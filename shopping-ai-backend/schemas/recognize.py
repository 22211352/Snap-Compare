from pydantic import BaseModel, Field


class RecognizeRequest(BaseModel):
    session_id: int
    upload_id: str
    image_url: str


class RecognizedItemSchema(BaseModel):
    category: str
    brand: str | None = None
    color: str | None = None
    style: str | None = None
    material: str | None = None
    keywords: list[str] = Field(default_factory=list)
    confidence: float
    raw_result: dict | None = None
    provider: str = "mock"
    is_mock: bool = True
    fallback_reason: str | None = None
    raw_model_output: str | None = None


class RecognizeResponse(BaseModel):
    session_id: int
    recognized_item: RecognizedItemSchema
