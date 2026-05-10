import json
import litellm
from app.core.config import settings
from typing import List

class ChatAgent:
    """
    Unified Chat Agent responsible for managing conversation flow,
    summarization, and user profile memory in a consolidated manner.
    """
    def __init__(self):
        self.name = "Talos Chat Architect"
        self.model = settings.LLM_MODEL
        self.api_key = settings.GEMINI_API_KEY

    async def process_message(self, user_summary: str, chat_summary: str, history: List[dict], current_message: str):
        system_prompt = f"""You are Talos, a Unified Autonomous Business Architect.
Your goal is to assist the user with Knowledge, Comms, and Coding tasks.

USER PROFILE MEMORY:
{user_summary}

CURRENT CONVERSATION MEMORY:
{chat_summary}

Follow the 'Glass Box' philosophy: explain your reasoning in a clear, transparent way.

CRITICAL: You MUST return your response as a JSON object with the following structure:
{{
  "assistant_message": "Your actual response to the user here",
  "reasoning_trace": "A brief explanation of your thought process",
  "chat_summary_update": "An updated concise summary of this conversation including key facts from this interaction",
  "user_profile_update": "An updated summary of the user profile including any new long-term facts learned"
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
            response_format={ "type": "json_object" }
        )
        
        try:
            raw_content = response.choices[0].message.content
            return json.loads(raw_content)
        except Exception as e:
            # Fallback if JSON fails
            return {
                "assistant_message": response.choices[0].message.content,
                "reasoning_trace": "Error parsing reasoning.",
                "chat_summary_update": chat_summary,
                "user_profile_update": user_summary
            }
