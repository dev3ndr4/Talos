import json

import litellm

from app.core.config import settings


class ChatAgent:
    """
    Unified Chat Agent responsible for managing conversation flow,
    summarization, and user profile memory in a consolidated manner.
    """

    def __init__(self):
        self.name = "Talos Chat Architect"
        self.model = settings.LLM_MODEL
        self.api_key = settings.GEMINI_API_KEY

    async def process_message(
        self,
        user_summary: str,
        chat_summary: str,
        history: list[dict],
        current_message: str,
        agent_type: str = "coding",
    ):
        agent_prompts = {
            "coding": "You are currently in CODING mode. Focus on software engineering, debugging, and architectural patterns.",
            "knowledge": "You are currently in KNOWLEDGE mode. Focus on research, synthesis, and deep information retrieval.",
            "comms": "You are currently in COMMS mode. Focus on professional communication, drafting emails/messages, and relationship management.",
        }

        agent_instruction = agent_prompts.get(agent_type, agent_prompts["coding"])

        system_prompt = f"""You are Talos, a Unified Autonomous Business Architect.
{agent_instruction}

USER PROFILE MEMORY:
{user_summary}

CURRENT CONVERSATION MEMORY:
{chat_summary}

Follow the 'Glass Box' philosophy: explain your reasoning in a clear, transparent way.

CRITICAL: You MUST return your response as a JSON object with the following structure:
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

        # Add history (last N messages)
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current user message
        messages.append({"role": "user", "content": current_message})

        # Call LiteLLM
        response = await litellm.acompletion(
            model=self.model,
            messages=messages,
            api_key=self.api_key,
            response_format={"type": "json_object"},
        )

        try:
            raw_content = response.choices[0].message.content
            return json.loads(raw_content)
        except Exception:
            # Fallback if JSON fails
            return {
                "assistant_message": response.choices[0].message.content,
                "reasoning_trace": "Error parsing reasoning.",
                "chat_summary_update": chat_summary,
                "user_profile_update": user_summary,
            }
