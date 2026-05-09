from fastapi import FastAPI
from app.domains.knowledge.router import router as knowledge_router
from app.domains.comms.router import router as comms_router
from app.domains.coding.router import router as coding_router
from app.domains.auth.router import router as auth_router
from app.domains.chat.router import router as chat_router

app = FastAPI(title="Talos API", version="0.1.0")

@app.on_event("startup")
async def startup_event():
    print("Talos API is starting up...")
    print("Check: Root endpoint is available at /")

@app.get("/")
async def root():
    return {"message": "Talos Business Architect API is active"}

# Include domain routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(knowledge_router, prefix="/api/knowledge", tags=["Knowledge"])
app.include_router(comms_router, prefix="/api/comms", tags=["Comms"])
app.include_router(coding_router, prefix="/api/coding", tags=["Coding"])
