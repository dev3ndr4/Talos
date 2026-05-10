from datetime import datetime

from bson import ObjectId

from app.core.database import db
from app.domains.chat.agent import ChatAgent
from app.domains.chat.schemas import ChatSessionCreate

chat_agent = ChatAgent()


async def create_chat_session(user_id: str, session_in: ChatSessionCreate):
    session_dict = {
        "user_id": user_id,
        "title": session_in.title,
        "chat_summary": "This is a new conversation.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
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


async def add_message(session_id: str, role: str, content: str, reasoning_trace: str | None = None):
    message_dict = {
        "session_id": session_id,
        "role": role,
        "content": content,
        "reasoning_trace": reasoning_trace,
        "created_at": datetime.utcnow(),
    }
    result = await db.messages.insert_one(message_dict)
    message_dict["id"] = str(result.inserted_id)

    # Update session's updated_at
    await db.chat_sessions.update_one({"_id": ObjectId(session_id)}, {"$set": {"updated_at": datetime.utcnow()}})
    return message_dict


async def get_messages(session_id: str, limit: int = 10):
    cursor = db.messages.find({"session_id": session_id}).sort("created_at", -1).limit(limit)
    messages = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        messages.append(doc)
    return messages[::-1]  # Return in chronological order


async def process_message_consolidated(user_id: str, session_id: str, content: str, agent_type: str = "coding"):
    # 1. Get user and session
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})

    if not user or not session:
        return None

    # 2. Add user message
    await add_message(session_id, "user", content)

    # 3. Get context
    history = await get_messages(session_id, limit=5)

    # 4. Call consolidated LLM via ChatAgent
    llm_data = await chat_agent.process_message(
        user.get("user_summary", ""),
        session.get("chat_summary", ""),
        history[:-1],
        content,
        agent_type,
    )

    # 5. Add assistant message
    assistant_msg = await add_message(session_id, "assistant", llm_data["assistant_message"], llm_data["reasoning_trace"])

    # 6. Update summaries in DB
    await db.chat_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "chat_summary": llm_data["chat_summary_update"],
                "updated_at": datetime.utcnow(),
            }
        },
    )
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"user_summary": llm_data["user_profile_update"]}})

    # 7. Get fresh objects for response
    updated_session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    updated_session["id"] = str(updated_session["_id"])

    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    updated_user["id"] = str(updated_user["_id"])

    return {"message": assistant_msg, "session": updated_session, "user": updated_user}
