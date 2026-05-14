from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from config import get_settings
from models.history import SearchSession
from models.product import Product
from providers.llm_provider import RealLLMProvider
from providers.mock_provider import MockProvider
from schemas.filter import FilterCondition
from schemas.product import ProductCard
from services.product_search_service import _to_card


def get_llm_provider():
    settings = get_settings()
    if settings.use_mock_provider:
        return MockProvider()
    return RealLLMProvider()


async def parse_and_filter(db: Session, session_id: int, text: str) -> tuple[FilterCondition, list[ProductCard]]:
    if not text.strip():
        raise HTTPException(status_code=400, detail={"code": "EMPTY_FILTER_TEXT", "message": "筛选条件不能为空"})

    session = db.get(SearchSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail={"code": "SESSION_NOT_FOUND", "message": "搜索会话不存在"})

    products = db.query(Product).filter(Product.session_id == session.id).all()
    if not products:
        raise HTTPException(status_code=400, detail={"code": "NO_PRODUCTS", "message": "当前会话没有商品结果"})

    provider = get_llm_provider()
    try:
        condition = await provider.parse_filter(text)
    except Exception:
        condition = FilterCondition(sort_by="price_asc" if "便宜" in text else None)

    filtered = products
    if condition.min_price is not None:
        filtered = [p for p in filtered if p.price >= Decimal(str(condition.min_price))]
    if condition.max_price is not None:
        filtered = [p for p in filtered if p.price <= Decimal(str(condition.max_price))]
    if condition.platforms:
        filtered = [p for p in filtered if p.platform in condition.platforms]
    if condition.shop_type:
        filtered = [p for p in filtered if p.shop_type == condition.shop_type]
    for word in condition.keywords_include:
        filtered = [p for p in filtered if word.lower() in p.title.lower()]
    for word in condition.keywords_exclude:
        filtered = [p for p in filtered if word.lower() not in p.title.lower()]

    if condition.sort_by == "price_asc":
        filtered.sort(key=lambda p: p.price)
    elif condition.sort_by == "sales_desc":
        filtered.sort(key=lambda p: p.sales_count or 0, reverse=True)
    else:
        filtered.sort(key=lambda p: p.score or 0, reverse=True)

    return condition, [_to_card(product) for product in filtered]
