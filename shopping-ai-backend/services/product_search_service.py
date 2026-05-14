import asyncio
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from config import get_settings
from models.history import RecognizedItem, SearchSession
from models.product import Product
from providers.jd_provider import RealJDProvider
from providers.mock_provider import MockJDProvider, MockPDDProvider
from providers.pdd_provider import RealPDDProvider
from schemas.product import ProductCard, SearchRequest
from services.price_history_service import record_initial_price_history


def get_product_providers():
    settings = get_settings()
    if settings.use_mock_provider or settings.use_mock_product:
        return [MockJDProvider(), MockPDDProvider()]
    return [RealJDProvider(), RealPDDProvider()]


def _to_card(product: Product) -> ProductCard:
    return ProductCard.model_validate(product).model_copy(
        update={"recommend_reason": _recommend_reason(product)}
    )


def _recommend_reason(product: Product) -> str:
    if product.shop_type == "official":
        return "官方/旗舰店来源，价格与相似商品相比更稳"
    if product.price <= Decimal("2200"):
        return "当前价格较低，适合优先比较"
    return "与识别属性相似度高，可作为备选"


async def search_products(db: Session, request: SearchRequest) -> list[ProductCard]:
    session = db.get(SearchSession, request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail={"code": "SESSION_NOT_FOUND", "message": "搜索会话不存在"})

    recognized = (
        db.query(RecognizedItem)
        .filter(RecognizedItem.session_id == session.id)
        .order_by(RecognizedItem.created_at.desc())
        .first()
    )
    keywords = request.keywords or (recognized.keywords if recognized else [])
    if not keywords:
        raise HTTPException(status_code=400, detail={"code": "NO_RECOGNIZED_ITEM", "message": "请先完成图片识别"})

    search_request = request.model_copy(update={"keywords": keywords})
    providers = get_product_providers()
    results = await asyncio.gather(
        *[provider.search_products(search_request) for provider in providers],
        return_exceptions=True,
    )

    cards: list[ProductCard] = []
    for result in results:
        if isinstance(result, Exception):
            continue
        cards.extend(result)
    if not cards:
        raise HTTPException(status_code=502, detail={"code": "PRODUCT_PROVIDER_FAILED", "message": "商品开放平台暂时不可用"})

    existing = db.query(Product).filter(Product.session_id == session.id).all()
    for item in existing:
        db.delete(item)
    db.flush()

    saved: list[ProductCard] = []
    seen: set[tuple[str, str]] = set()
    for card in cards[: request.page_size]:
        key = (card.platform, card.external_product_id)
        if key in seen:
            continue
        seen.add(key)
        product = Product(
            session_id=session.id,
            platform=card.platform,
            external_product_id=card.external_product_id,
            title=card.title,
            image_url=card.image_url,
            price=card.price,
            original_price=card.original_price,
            shop_name=card.shop_name,
            shop_type=card.shop_type,
            sales_count=card.sales_count,
            coupon_info=card.coupon_info,
            product_url=card.product_url,
            attributes=card.attributes,
            score=card.score,
        )
        db.add(product)
        db.flush()
        record_initial_price_history(db, product)
        saved.append(_to_card(product))

    session.status = "searched"
    session.product_count = len(saved)
    db.commit()
    return sorted(saved, key=lambda item: (-(float(item.score or 0)), float(item.price)))
