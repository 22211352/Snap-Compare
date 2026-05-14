from fastapi import HTTPException
from sqlalchemy.orm import Session

from config import get_settings
from models.history import RecognizedItem, SearchSession
from providers.mock_provider import MockProvider
from providers.vision_provider import RealVisionProvider
from schemas.recognize import RecognizedItemSchema


def get_vision_provider():
    settings = get_settings()
    print(f"[Vision] USE_MOCK_PROVIDER={settings.use_mock_provider}")
    print(f"[Vision] USE_MOCK_VISION={settings.use_mock_vision}")
    if settings.use_mock_provider or settings.use_mock_vision:
        print("[Vision] Provider selected: mock")
        return MockProvider()
    print("[Vision] Provider selected: gemini")
    return RealVisionProvider()


async def recognize_image(db: Session, session_id: int, image_url: str) -> RecognizedItemSchema:
    session = db.get(SearchSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail={"code": "SESSION_NOT_FOUND", "message": "Search session not found"})

    provider = get_vision_provider()
    try:
        result = await provider.recognize(image_url)
    except Exception as exc:
        if get_settings().use_mock_provider:
            raise HTTPException(
                status_code=502,
                detail={"code": "VISION_PROVIDER_FAILED", "message": "Vision provider is temporarily unavailable"},
            ) from exc

        fallback_reason = f"Gemini error: {exc}"
        print(f"[Vision] Fallback to mock: {fallback_reason}")
        fallback = MockProvider()
        result = await fallback.recognize(image_url)
        raw_result = result.raw_result or {}
        raw_result["fallback_reason"] = fallback_reason
        result.raw_result = raw_result
        result.provider = "mock"
        result.is_mock = True
        result.fallback_reason = fallback_reason
        result.raw_model_output = None

    item = RecognizedItem(
        session_id=session.id,
        category=result.category,
        brand=result.brand,
        color=result.color,
        style=result.style,
        material=result.material,
        keywords=result.keywords,
        confidence=result.confidence,
        raw_result=result.raw_result,
    )
    db.add(item)
    session.status = "recognized"
    session.recognized_summary = " ".join(filter(None, [result.brand, result.color, result.style or result.category]))
    db.commit()
    db.refresh(item)
    return result
