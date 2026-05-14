from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.recognize import RecognizeRequest, RecognizeResponse
from services.vision_service import recognize_image

router = APIRouter(prefix="/api", tags=["recognize"])


@router.post("/recognize")
async def recognize(request: RecognizeRequest, db: Session = Depends(get_db)):
    result = await recognize_image(db, request.session_id, request.image_url)
    return {"data": RecognizeResponse(session_id=request.session_id, recognized_item=result)}
