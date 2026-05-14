from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.filter import FilterRequest, FilterResponse
from services.filter_service import parse_and_filter

router = APIRouter(prefix="/api", tags=["filter"])


@router.post("/filter")
async def filter_products(request: FilterRequest, db: Session = Depends(get_db)):
    condition, products = await parse_and_filter(db, request.session_id, request.text)
    return {"data": FilterResponse(condition=condition, products=products)}
