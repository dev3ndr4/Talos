import json
import logging
import os

import litellm
from litellm.exceptions import RateLimitError

from app.core.config import settings
from app.core.tools.coding import ExecutePython
from app.core.tools.comms import DraftEmail
from app.core.tools.knowledge import GrepSearch, ListFiles, ReadFile, WebSearch
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
    """

    def __init__(self):
        self.name = "Talos Chat Architect"
        self.model = settings.LLM_MODEL
        self.api_key = settings.GEMINI_API_KEY
        self.max_steps = 5
        self.instructions_path = "app/core/instructions"

    def _load_instruction(self, agent_type: str) -> str:
        """Loads agent-specific instructions from Markdown files."""
        try:
            # We are running from the backend directory usually, but check current working dir
            # For robustness, we can use absolute paths or relative to this file
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
  "email_draft": {{
    "to": "recipient@example.com (optional)",
    "subject": "Email subject",
    "body": "Email body content"
  }} (OPTIONAL: Only include this if you are drafting an email in COMMS mode)
}}
"""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": current_message})

        tools = registry.get_all_schemas()
        reasoning_log = []
        captured_email_draft = None

        try:
            for step in range(self.max_steps):
                logger.info(f"Agent Step {step + 1}/{self.max_steps}")

                response = await litellm.acompletion(
                    model=self.model,
                    messages=messages,
                    api_key=self.api_key,
                    tools=tools,
                    tool_choice="auto",
                    response_format={"type": "json_object"} if step == self.max_steps - 1 else None,
                )

                response_message = response.choices[0].message
                tool_calls = getattr(response_message, "tool_calls", None)

                if not tool_calls:
                    # Final response reached or no tool calls
                    raw_content = response_message.content
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
                messages.append(response_message)
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    logger.info(f"Executing tool: {function_name}")
                    reasoning_log.append(f"- **Tool Call**: {function_name}({json.dumps(function_args)})")

                    result = await registry.execute(function_name, function_args)

                    # Special handling for email drafts
                    if function_name == "DraftEmail" and result.success:
                        captured_email_draft = result.output.get("email_draft")

                    reasoning_log.append(f"  - **Result**: {str(result.output)[:200]}...")

                    messages.append(
                        {
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": json.dumps(result.output),
                        }
                    )

            # If we hit max steps without a final response
            return {
                "assistant_message": "I attempted to solve the task but reached my maximum operational limit. Please try breaking the request into smaller steps.",
                "reasoning_trace": "Max steps reached during autonomous execution.\n" + "\n".join(reasoning_log),
                "chat_summary_update": chat_summary,
                "user_profile_update": user_summary,
            }

        except RateLimitError as e:
            raise AgentRateLimitError(str(e)) from e
        except Exception as e:
            logger.error(f"Agent Error: {str(e)}", exc_info=True)
            raise AgentGeneralError(str(e)) from e
