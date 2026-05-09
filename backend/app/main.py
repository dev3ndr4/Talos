from fastapi import FastAPI
from app.domains.knowledge.router import router as knowledge_router
from app.domains.comms.router import router as comms_router
from app.domains.coding.router import router as coding_router

app = FastAPI(title="Talos API", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "Talos Business Architect API is active"}

# Include domain routers
app.include_router(knowledge_router, prefix="/api/knowledge", tags=["Knowledge"])
app.include_router(comms_router, prefix="/api/comms", tags=["Comms"])
app.include_router(coding_router, prefix="/api/coding", tags=["Coding"])
