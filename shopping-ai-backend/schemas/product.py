from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SearchRequest(BaseModel):
    session_id: int
    keywords: list[str] = Field(default_factory=list)
    page: int = 1
    page_size: int = 20


class ProductCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    platform: str
    external_product_id: str
    title: str
    image_url: str
    price: Decimal
    original_price: Decimal | None = None
    shop_name: str | None = None
    shop_type: str | None = None
    sales_count: int | None = None
    coupon_info: str | None = None
    product_url: str
    attributes: dict | None = None
    score: Decimal | None = None
    recommend_reason: str | None = None


class SearchResponse(BaseModel):
    session_id: int
    products: list[ProductCard]


class ProductDetail(ProductCard):
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PricePoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recorded_at: datetime
    price: Decimal


class PriceHistoryResponse(BaseModel):
    product_id: int
    currency: str = "CNY"
    points: list[PricePoint]


class FavoriteRequest(BaseModel):
    product_id: int
    device_id: str | None = None


class FavoriteResponse(BaseModel):
    favorite_id: int
    product_id: int
    created_at: datetime
