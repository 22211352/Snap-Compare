from pydantic import BaseModel, Field

from schemas.product import ProductCard


class FilterRequest(BaseModel):
    session_id: int
    text: str


class FilterCondition(BaseModel):
    min_price: float | None = None
    max_price: float | None = None
    platforms: list[str] = Field(default_factory=list)
    shop_type: str | None = None
    sort_by: str | None = None
    keywords_include: list[str] = Field(default_factory=list)
    keywords_exclude: list[str] = Field(default_factory=list)


class FilterResponse(BaseModel):
    condition: FilterCondition
    products: list[ProductCard]
