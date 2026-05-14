from datetime import datetime

from pydantic import BaseModel


class UploadResponse(BaseModel):
    upload_id: str
    session_id: int
    image_url: str


class HistoryItem(BaseModel):
    session_id: int
    image_url: str
    recognized_summary: str | None
    product_count: int
    created_at: datetime


class HistoryResponse(BaseModel):
    items: list[HistoryItem]
