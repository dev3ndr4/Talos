from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_coding_status():
    return {"status": "Coding Agent is active"}
