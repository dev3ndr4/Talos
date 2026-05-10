from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_knowledge_status():
    return {"status": "Knowledge Brain is active"}
