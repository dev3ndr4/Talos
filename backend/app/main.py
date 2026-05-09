from fastapi import FastAPI
from app.domains.knowledge.router import router as knowledge_router
from app.domains.comms.router import router as comms_router
from app.domains.coding.router import router as coding_router
from app.domains.auth.router import router as auth_router
from app.domains.chat.router import router as chat_router

import logging
from app.core.database import client, db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("talos")

app = FastAPI(title="Talos API", version="0.1.0")

@app.on_event("startup")
async def startup_event():
    logger.info("Talos API is starting up...")
    try:
        # Check MongoDB connection
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        # We don't exit here to allow the /health endpoint to potentially report the error
    
    logger.info("Check: Root endpoint is available at /")
    logger.info("Check: Health endpoint is available at /health")

@app.get("/")
async def root():
    return {"message": "Talos Business Architect API is active"}

@app.get("/health")
async def health():
    try:
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# Include domain routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(knowledge_router, prefix="/api/knowledge", tags=["Knowledge"])
app.include_router(comms_router, prefix="/api/comms", tags=["Comms"])
app.include_router(coding_router, prefix="/api/coding", tags=["Coding"])
