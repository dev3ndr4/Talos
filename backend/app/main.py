import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import client, init_beanie_db
from app.domains.auth.models import User
from app.domains.auth.router import router as auth_router
from app.domains.chat.models import ChatSession, Message
from app.domains.chat.router import router as chat_router
from app.domains.coding.router import router as coding_router
from app.domains.comms.router import router as comms_router
from app.domains.knowledge.router import router as knowledge_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("talos")

app = FastAPI(title="Talos API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    print("CRITICAL: Talos API startup sequence initiated", flush=True)
    logger.info("Talos API is starting up...")
    try:
        # Check MongoDB connection with timeout
        print("DEBUG: Pinging MongoDB...", flush=True)
        await asyncio.wait_for(client.admin.command("ping"), timeout=10.0)
        logger.info("Successfully connected to MongoDB.")

        # Initialize Beanie
        print("DEBUG: Initializing Beanie ORM...", flush=True)
        await init_beanie_db([User, ChatSession, Message])
        logger.info("Beanie ORM initialized.")

        print("DEBUG: MongoDB and Beanie initialization successful", flush=True)
    except TimeoutError:
        logger.error("Failed to connect to MongoDB: Connection timed out after 10s")
        print("ERROR: MongoDB connection timeout", flush=True)
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        print(f"ERROR: MongoDB connection failed: {e}", flush=True)

    logger.info("Check: Root endpoint is available at /")
    logger.info("Check: Health endpoint is available at /health")
    print("CRITICAL: Talos API startup sequence completed", flush=True)


@app.get("/")
async def root():
    return {"message": "Talos Business Architect API is active"}


@app.get("/health")
async def health():
    try:
        await client.admin.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


# Include domain routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(knowledge_router, prefix="/api/knowledge", tags=["Knowledge"])
app.include_router(comms_router, prefix="/api/comms", tags=["Comms"])
app.include_router(coding_router, prefix="/api/coding", tags=["Coding"])
