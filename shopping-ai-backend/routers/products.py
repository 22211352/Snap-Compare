from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.product import Product, UserFavorite
from models.user import User
from schemas.product import (
    FavoriteRequest,
    FavoriteResponse,
    PriceHistoryResponse,
    ProductDetail,
    SearchRequest,
    SearchResponse,
)
from services.price_history_service import get_price_history
from services.product_search_service import search_products

router = APIRouter(prefix="/api", tags=["products"])


@router.post("/search")
async def search(request: SearchRequest, db: Session = Depends(get_db)):
    products = await search_products(db, request)
    return {"data": SearchResponse(session_id=request.session_id, products=products)}


@router.get("/products/{product_id}")
async def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"code": "PRODUCT_NOT_FOUND", "message": "商品不存在"})
    detail = ProductDetail.model_validate(product).model_copy(update={"recommend_reason": "识别属性匹配度高，适合优先比较"})
    return {"data": detail}


@router.get("/products/{product_id}/price-history")
async def product_price_history(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"code": "PRODUCT_NOT_FOUND", "message": "商品不存在"})
    points = get_price_history(db, product_id)
    return {"data": PriceHistoryResponse(product_id=product_id, points=points)}


@router.post("/favorites")
async def create_favorite(request: FavoriteRequest, db: Session = Depends(get_db)):
    product = db.get(Product, request.product_id)
    if not product:
        raise HTTPException(status_code=404, detail={"code": "PRODUCT_NOT_FOUND", "message": "商品不存在"})

    user = None
    if request.device_id:
        user = db.query(User).filter(User.device_id == request.device_id).first()
        if not user:
            user = User(device_id=request.device_id)
            db.add(user)
            db.flush()

    existing = (
        db.query(UserFavorite)
        .filter(UserFavorite.user_id == (user.id if user else None), UserFavorite.product_id == product.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail={"code": "FAVORITE_EXISTS", "message": "已收藏该商品"})

    favorite = UserFavorite(user_id=user.id if user else None, product_id=product.id)
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return {"data": FavoriteResponse(favorite_id=favorite.id, product_id=product.id, created_at=favorite.created_at)}
