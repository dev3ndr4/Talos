import asyncio
import json
import logging
import os
import random

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.tools.coding import ExecutePython
from app.core.tools.comms import DraftEmail
from app.core.tools.knowledge import FetchURL, GrepSearch, ListFiles, ReadFile, WebSearch, WikipediaSearch
from app.core.tools.registry import registry
from app.core.tools.wiki import ListWikiPages, ReadWikiPage, WriteWikiPage

# Initialize tools
registry.register(ExecutePython)
registry.register(ReadFile)
registry.register(ListFiles)
registry.register(GrepSearch)
registry.register(WriteWikiPage)
registry.register(ReadWikiPage)
registry.register(ListWikiPages)
registry.register(DraftEmail)
registry.register(WebSearch)
registry.register(FetchURL)
registry.register(WikipediaSearch)

logger = logging.getLogger("talos.agent")


class AgentRateLimitError(Exception):
    """Raised when the LLM provider returns a rate limit error."""

    pass


class AgentGeneralError(Exception):
    """Raised for any other errors during LLM processing."""

    pass


class ChatAgent:
    """
    Unified Chat Agent responsible for managing conversation flow,
    summarization, and user profile memory with autonomous tool-calling support.
    Using official Google Gen AI SDK for stability.
    """

    def __init__(self):
        self.name = "Talos Chat Architect"
        # The SDK expects the model name without the provider prefix
        self.model = settings.LLM_MODEL.split("/")[-1]
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.max_steps = 5
        self.instructions_path = "app/core/instructions"

    def _load_instruction(self, agent_type: str) -> str:
        """Loads agent-specific instructions from Markdown files."""
        try:
            base_path = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            file_path = os.path.join(base_path, "core", "instructions", f"{agent_type}.md")
            with open(file_path) as f:
                return f.read()
        except FileNotFoundError:
            logger.warning(f"Instruction file for {agent_type} not found at {file_path}. Using default.")
            return "You are Talos, an autonomous agent."
        except Exception as e:
            logger.error(f"Error loading instructions: {e}")
            return "You are Talos, an autonomous agent."

    async def process_message(
        self,
        user_summary: str,
        chat_summary: str,
        history: list[dict],
        current_message: str,
        agent_type: str = "coding",
    ):
        agent_instruction = self._load_instruction(agent_type)

        system_prompt = f"""You are Talos, a Unified Autonomous Business Architect.
{agent_instruction}

USER PROFILE MEMORY:
{user_summary}

CURRENT CONVERSATION MEMORY:
{chat_summary}

PHILOSOPHY:
1. **Glass Box Reasoning**: Be transparent about your thought process.
2. **Autonomous Action**: You are here to DO, not just talk. Use your tools aggressively to solve problems.
3. **Self-Correction**: If a tool call fails or returns an error, analyze the output, fix your approach, and try again. You have multiple steps to get it right.
4. **Cross-Domain Ambition**: Even if in one mode, you can use any available tool. If you need to calculate something while in Knowledge mode, use ExecutePython.

When you use a tool, explain WHY you are using it in your reasoning trace.

CRITICAL: You MUST return your final response as a JSON object with the following structure:
{{
  "assistant_message": "Your actual response to the user here",
  "reasoning_trace": "A brief explanation of your thought process",
  "chat_summary_update": "A concise summary of this conversation including key facts",
  "user_profile_update": "A summary of the user profile including any new long-term facts learned",
  "detected_agent_type": "coding" | "knowledge" | "comms" | "simple" (OPTIONAL: Only include if you detect a clear shift in intent or performed a specialized task),
  "email_draft": {{
    "to": "recipient@example.com (optional)",
    "subject": "Email subject",
    "body": "Email body content"
  }} (OPTIONAL: Only include this if you are drafting an email in COMMS mode)
}}
"""

        # Convert history and current message to Google Gen AI format
        contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

        contents.append(types.Content(role="user", parts=[types.Part(text=current_message)]))

        # Prepare tools in native format
        # The SDK can take functions directly, but we have a custom registry.
        # We'll use manual tool calling loop to maintain the existing logic and control.
        native_tools = [
            types.Tool(function_declarations=[types.FunctionDeclaration(name=schema["function"]["name"], description=schema["function"]["description"], parameters=schema["function"]["parameters"]) for schema in registry.get_all_schemas()])
        ]

        reasoning_log = []
        captured_email_draft = None

        try:
            for step in range(self.max_steps):
                logger.info(f"Agent Step {step + 1}/{self.max_steps}")

                # Retry logic for flaky models (e.g., Gemma 4)
                response = None
                max_retries = 5
                for attempt in range(max_retries):
                    try:
                        # Use system_instruction parameter for the system prompt
                        config = types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            tools=native_tools,
                            response_mime_type="application/json" if step == self.max_steps - 1 else None,
                            # Disable automatic calling to maintain our reasoning log and tool execution logic
                            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                        )

                        response = self.client.models.generate_content(model=self.model, contents=contents, config=config)
                        break
                    except Exception as e:
                        if attempt == max_retries - 1:
                            raise e

                        # Exponential backoff with jitter
                        wait_time = (2**attempt) + (random.uniform(0, 1))
                        logger.warning(f"LLM call failed (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {wait_time:.2f}s...")
                        await asyncio.sleep(wait_time)

                candidate = response.candidates[0]
                tool_calls = [part.function_call for part in candidate.content.parts if part.function_call]

                if not tool_calls:
                    # Final response reached or no tool calls
                    raw_content = "".join([part.text for part in candidate.content.parts if part.text])
                    try:
                        final_data = json.loads(raw_content)
                        # Append the gathered reasoning log
                        if reasoning_log:
                            trace_header = "\n\n### Autonomous Action Log:\n"
                            final_data["reasoning_trace"] += trace_header + "\n".join(reasoning_log)

                        # Attach captured email draft if it's not already in the final response
                        if captured_email_draft and not final_data.get("email_draft"):
                            final_data["email_draft"] = captured_email_draft

                        return final_data
                    except json.JSONDecodeError:
                        # Fallback if not JSON but expected final
                        return {
                            "assistant_message": raw_content,
                            "reasoning_trace": "Model failed to return JSON in final step.",
                            "chat_summary_update": chat_summary,
                            "user_profile_update": user_summary,
                            "email_draft": captured_email_draft,
                        }

                # Handle tool calls
                # Add model's response to contents
                contents.append(candidate.content)

                tool_response_parts = []
                for tool_call in tool_calls:
                    function_name = tool_call.name
                    function_args = tool_call.args

                    logger.info(f"Executing tool: {function_name}")
                    reasoning_log.append(f"- **Tool Call**: {function_name}({json.dumps(function_args)})")

                    result = await registry.execute(function_name, function_args)

                    # Special handling for email drafts
                    if function_name == "DraftEmail" and result.success:
                        captured_email_draft = result.output.get("email_draft")

                    reasoning_log.append(f"  - **Result**: {str(result.output)[:200]}...")

                    # Ensure result.output is a dictionary for the GenAI SDK
                    response_dict = result.output
                    if not result.success:
                        response_dict = {"error": result.error}
                    elif not isinstance(response_dict, dict):
                        response_dict = {"result": response_dict}

                    tool_response_parts.append(types.Part(function_response=types.FunctionResponse(name=function_name, response=response_dict)))

                # Add tool results to contents
                contents.append(types.Content(role="tool", parts=tool_response_parts))

            # If we hit max steps without a final response
            return {
                "assistant_message": "I attempted to solve the task but reached my maximum operational limit. Please try breaking the request into smaller steps.",
                "reasoning_trace": "Max steps reached during autonomous execution.\n" + "\n".join(reasoning_log),
                "chat_summary_update": chat_summary,
                "user_profile_update": user_summary,
            }

        except Exception as e:
            logger.error(f"Agent Error: {str(e)}", exc_info=True)
            raise AgentGeneralError(str(e)) from e
