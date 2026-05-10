from datetime import datetime

from bson import ObjectId

from app.domains.auth.models import User
from app.domains.chat.agent import AgentRateLimitError, ChatAgent
from app.domains.chat.models import ChatFolder, ChatSession, Message
from app.domains.chat.schemas import ChatFolderCreate, ChatFolderUpdate, ChatSessionCreate

chat_agent = ChatAgent()


async def create_chat_folder(user_id: str, folder_in: ChatFolderCreate):
    folder = ChatFolder(
        user_id=user_id,
        name=folder_in.name,
        is_expanded=folder_in.is_expanded,
        session_ids=folder_in.session_ids,
    )
    await folder.insert()
    folder_dict = folder.model_dump()
    folder_dict["id"] = str(folder.id)
    return folder_dict


async def get_chat_folders(user_id: str):
    folders = await ChatFolder.find(ChatFolder.user_id == user_id).sort(-ChatFolder.updated_at).to_list()
    result = []
    for f in folders:
        f_dict = f.model_dump()
        f_dict["id"] = str(f.id)
        result.append(f_dict)
    return result


async def update_chat_folder(user_id: str, folder_id: str, folder_in: ChatFolderUpdate):
    folder = await ChatFolder.find_one(ChatFolder.id == ObjectId(folder_id), ChatFolder.user_id == user_id)
    if not folder:
        return None

    update_data = folder_in.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    await folder.update({"$set": update_data})

    updated_folder = await ChatFolder.find_one(ChatFolder.id == ObjectId(folder_id))
    folder_dict = updated_folder.model_dump()
    folder_dict["id"] = str(updated_folder.id)
    return folder_dict


async def delete_chat_folder(user_id: str, folder_id: str):
    folder = await ChatFolder.find_one(ChatFolder.id == ObjectId(folder_id), ChatFolder.user_id == user_id)
    if not folder:
        return False

    await folder.delete()
    return True


async def move_session_to_folder(user_id: str, session_id: str, folder_id: str | None):
    # Remove session from any existing folders
    existing_folders = await ChatFolder.find(ChatFolder.user_id == user_id, ChatFolder.session_ids == session_id).to_list()
    for f in existing_folders:
        new_ids = [sid for sid in f.session_ids if sid != session_id]
        await f.update({"$set": {"session_ids": new_ids, "updated_at": datetime.utcnow()}})

    # Add to new folder if provided
    if folder_id:
        folder = await ChatFolder.find_one(ChatFolder.id == ObjectId(folder_id), ChatFolder.user_id == user_id)
        if folder:
            if session_id not in folder.session_ids:
                new_ids = folder.session_ids + [session_id]
                await folder.update({"$set": {"session_ids": new_ids, "updated_at": datetime.utcnow()}})

    return await get_chat_folders(user_id)


async def create_chat_session(user_id: str, session_in: ChatSessionCreate):
    session = ChatSession(
        user_id=user_id,
        title=session_in.title,
    )
    await session.insert()
    session_dict = session.model_dump()
    session_dict["id"] = str(session.id)
    return session_dict


async def get_chat_sessions(user_id: str):
    sessions = await ChatSession.find(ChatSession.user_id == user_id).sort(-ChatSession.updated_at).to_list()
    result = []
    for s in sessions:
        s_dict = s.model_dump()
        s_dict["id"] = str(s.id)
        result.append(s_dict)
    return result


async def add_message(
    session_id: str,
    role: str,
    content: str,
    reasoning_trace: str | None = None,
    email_draft: dict | None = None,
):
    message = Message(
        session_id=session_id,
        role=role,
        content=content,
        reasoning_trace=reasoning_trace,
        email_draft=email_draft,
    )
    await message.insert()

    # Update session's updated_at
    await ChatSession.find_one(ChatSession.id == ObjectId(session_id)).update({"$set": {"updated_at": datetime.utcnow()}})

    message_dict = message.model_dump()
    message_dict["id"] = str(message.id)
    return message_dict


async def get_messages(session_id: str, limit: int = 10):
    messages = await Message.find(Message.session_id == session_id).sort(-Message.created_at).limit(limit).to_list()
    result = []
    for m in messages:
        m_dict = m.model_dump()
        m_dict["id"] = str(m.id)
        result.append(m_dict)
    return result[::-1]  # Return in chronological order


async def process_message_consolidated(user_id: str, session_id: str, content: str, agent_type: str = "coding"):
    # 1. Get user and session
    user_doc = await User.find_one(User.id == ObjectId(user_id))
    session_doc = await ChatSession.find_one(ChatSession.id == ObjectId(session_id))

    if not user_doc or not session_doc:
        return None

    # 2. Add user message
    await add_message(session_id, "user", content)

    # 3. Get context
    history = await get_messages(session_id, limit=5)

    # 4. Call consolidated LLM via ChatAgent with retries
    MAX_RETRIES = 3
    llm_data = None
    last_error = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            llm_data = await chat_agent.process_message(
                user_doc.user_summary,
                session_doc.chat_summary,
                history[:-1],
                content,
                agent_type,
            )
            break
        except AgentRateLimitError:
            # Rate limit: don't retry, notify user to wait
            assistant_msg = await add_message(
                session_id,
                "assistant",
                "I'm sorry, I'm currently experiencing rate limits. Please try again in a few minutes.",
                "Rate limit encountered.",
            )
            # Match old behavior by returning dicts
            return {
                "message": assistant_msg,
                "session": {**session_doc.model_dump(), "id": str(session_doc.id)},
                "user": {**user_doc.model_dump(), "id": str(user_doc.id)},
                "error": "rate_limit",
            }
        except Exception as e:
            last_error = e
            if attempt < MAX_RETRIES:
                continue
            # Final failure after retries
            assistant_msg = await add_message(
                session_id,
                "assistant",
                "I'm having trouble processing your request. Our team has been notified. Please try creating a new chat session.",
                f"Final failure after {MAX_RETRIES} retries: {str(last_error)}",
            )
            return {
                "message": assistant_msg,
                "session": {**session_doc.model_dump(), "id": str(session_doc.id)},
                "user": {**user_doc.model_dump(), "id": str(user_doc.id)},
                "error": "final_failure",
            }

    # 5. Add assistant message
    assistant_msg = await add_message(
        session_id,
        "assistant",
        llm_data["assistant_message"],
        llm_data["reasoning_trace"],
        llm_data.get("email_draft"),
    )

    # 6. Update summaries in DB
    await session_doc.update(
        {
            "$set": {
                "chat_summary": llm_data["chat_summary_update"],
                "updated_at": datetime.utcnow(),
            }
        }
    )
    await user_doc.update({"$set": {"user_summary": llm_data["user_profile_update"]}})

    # 7. Get fresh objects for response
    updated_session = await ChatSession.find_one(ChatSession.id == ObjectId(session_id))
    updated_session_dict = updated_session.model_dump()
    updated_session_dict["id"] = str(updated_session.id)
    updated_session_dict["user_id"] = str(updated_session.user_id)

    updated_user = await User.find_one(User.id == ObjectId(user_id))
    updated_user_dict = updated_user.model_dump()
    updated_user_dict["id"] = str(updated_user.id)

    return {
        "message": assistant_msg,
        "session": updated_session_dict,
        "user": updated_user_dict,
        "detected_agent_type": llm_data.get("detected_agent_type"),
    }
