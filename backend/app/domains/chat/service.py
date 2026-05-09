from datetime import datetime
from typing import List, Optional
from app.core.database import db
from app.core.config import settings
from app.domains.chat.schemas import ChatSessionCreate, MessageBase
from bson import ObjectId
import litellm
import os

async def create_chat_session(user_id: str, session_in: ChatSessionCreate):
    session_dict = {
        "user_id": user_id,
        "title": session_in.title,
        "chat_summary": "This is a new conversation.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.chat_sessions.insert_one(session_dict)
    session_dict["id"] = str(result.inserted_id)
    return session_dict

async def get_chat_sessions(user_id: str):
    cursor = db.chat_sessions.find({"user_id": user_id})
    sessions = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        sessions.append(doc)
    return sessions

async def add_message(session_id: str, role: str, content: str, reasoning_trace: Optional[str] = None):
    message_dict = {
        "session_id": session_id,
        "role": role,
        "content": content,
        "reasoning_trace": reasoning_trace,
        "created_at": datetime.utcnow()
    }
    result = await db.messages.insert_one(message_dict)
    message_dict["id"] = str(result.inserted_id)
    
    # Update session's updated_at
    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"updated_at": datetime.utcnow()}}
    )
    return message_dict

async def get_messages(session_id: str, limit: int = 10):
    cursor = db.messages.find({"session_id": session_id}).sort("created_at", -1).limit(limit)
    messages = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        messages.append(doc)
    return messages[::-1] # Return in chronological order

async def call_llm(user_summary: str, chat_summary: str, history: List[dict], current_message: str):
    system_prompt = f"""You are Talos, a Unified Autonomous Business Architect.
Your goal is to assist the user with Knowledge, Comms, and Coding tasks.

USER PROFILE MEMORY:
{user_summary}

CURRENT CONVERSATION MEMORY:
{chat_summary}

Follow the 'Glass Box' philosophy: explain your reasoning in a clear, transparent way.
"""
    
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add history (last N messages)
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Add current user message
    messages.append({"role": "user", "content": current_message})
    
    # Call LiteLLM
    response = litellm.completion(
        model=settings.LLM_MODEL,
        messages=messages,
        api_key=settings.GEMINI_API_KEY
    )
    
    content = response.choices[0].message.content
    reasoning_trace = "Reasoning synthesized based on user profile and chat history."
    
    return content, reasoning_trace

async def update_summaries(user_id: str, session_id: str):
    # 1. Get user, session, and recent messages
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    messages = await get_messages(session_id, limit=2) # Last user and assistant messages
    
    if not user or not session or len(messages) < 2:
        return

    history_str = "\n".join([f"{m['role']}: {m['content']}" for m in messages])

    # 2. Update Chat Summary
    chat_prompt = f"""Update the following Chat Summary based on the latest interaction.
Keep it concise but include key facts, decisions, or ongoing tasks.

CURRENT CHAT SUMMARY:
{session.get('chat_summary', '')}

LATEST INTERACTION:
{history_str}

NEW CHAT SUMMARY:"""
    
    chat_resp = litellm.completion(
        model=settings.LLM_MODEL,
        messages=[{"role": "user", "content": chat_prompt}],
        api_key=settings.GEMINI_API_KEY
    )
    new_chat_summary = chat_resp.choices[0].message.content

    # 3. Update User Summary
    user_prompt = f"""Update the following User Profile Memory based on the latest interaction.
Only include long-term facts (preferences, name, role, global goals). Ignore session-specific noise.

CURRENT USER PROFILE MEMORY:
{user.get('user_summary', '')}

LATEST INTERACTION:
{history_str}

NEW USER PROFILE MEMORY:"""

    user_resp = litellm.completion(
        model=settings.LLM_MODEL,
        messages=[{"role": "user", "content": user_prompt}],
        api_key=settings.GEMINI_API_KEY
    )
    new_user_summary = user_resp.choices[0].message.content

    # 4. Save to DB
    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"chat_summary": new_chat_summary}}
    )
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"user_summary": new_user_summary}}
    )
