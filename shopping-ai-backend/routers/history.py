from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.history import SearchSession
from models.user import User
from schemas.history import HistoryItem, HistoryResponse

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history")
async def get_history(device_id: str | None = None, limit: int = 20, db: Session = Depends(get_db)):
    query = db.query(SearchSession)
    if device_id:
        user = db.query(User).filter(User.device_id == device_id).first()
        if user:
            query = query.filter(SearchSession.user_id == user.id)
        else:
            query = query.filter(SearchSession.user_id.is_(None))
    sessions = query.order_by(SearchSession.created_at.desc()).limit(min(limit, 50)).all()
    items = [
        HistoryItem(
            session_id=session.id,
            image_url=session.image_url,
            recognized_summary=session.recognized_summary,
            product_count=session.product_count,
            created_at=session.created_at,
        )
        for session in sessions
    ]
    return {"data": HistoryResponse(items=items)}
