from abc import ABC, abstractmethod
import base64
import json
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

import httpx

from config import get_settings
from schemas.recognize import RecognizedItemSchema


class VisionProvider(ABC):
    @abstractmethod
    async def recognize(self, image_url: str) -> RecognizedItemSchema:
        """Recognize product attributes from an image URL."""


class RealVisionProvider(VisionProvider):
    model_name = "gemini-2.5-flash"

    async def recognize(self, image_url: str) -> RecognizedItemSchema:
        settings = get_settings()
        if not settings.vision_api_key:
            raise RuntimeError("VISION_API_KEY is required when USE_MOCK_PROVIDER=false")

        image_path = self._resolve_uploaded_image_path(image_url)
        image_bytes = image_path.read_bytes()
        mime_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")

        print("[Vision] Provider selected: gemini")
        print(f"[Vision] Gemini request will be sent: true, image={image_path}, mime={mime_type}, bytes={len(image_bytes)}")

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": (
                                "You are an ecommerce visual product recognition assistant. "
                                "Identify the main product in the image. Return JSON only, no Markdown. "
                                "The JSON schema must be exactly: "
                                '{"category":"...","brand":"...","color":"...","keywords":[],"description":"...","confidence":0.0}. '
                                "Use Chinese ecommerce search keywords suitable for JD and PDD. "
                                "confidence must be a number from 0 to 1. If brand is unknown, return an empty string."
                            )
                        },
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": encoded_image,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json",
            },
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                self._endpoint(),
                headers={
                    "x-goog-api-key": settings.vision_api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        raw_response_text = response.text
        print(f"[Vision] Gemini HTTP status: {response.status_code}")
        print(f"[Vision] Gemini raw response first 500 chars: {raw_response_text[:500]}")
        response.raise_for_status()

        gemini_payload = response.json()
        parsed = self._parse_gemini_json(gemini_payload)
        keywords = parsed.get("keywords") if isinstance(parsed.get("keywords"), list) else []
        description = str(parsed.get("description") or "").strip()
        raw_model_output = self._extract_model_text(gemini_payload)

        return RecognizedItemSchema(
            category=str(parsed.get("category") or "unknown product").strip(),
            brand=str(parsed.get("brand") or "").strip() or None,
            color=str(parsed.get("color") or "").strip() or None,
            style=description or None,
            material=None,
            keywords=[str(item).strip() for item in keywords if str(item).strip()],
            confidence=float(parsed.get("confidence") or 0.0),
            raw_result={
                "provider": "gemini",
                "model": self.model_name,
                "description": description,
                "gemini_response": gemini_payload,
            },
            provider="gemini",
            is_mock=False,
            fallback_reason=None,
            raw_model_output=raw_model_output if settings.env == "development" else None,
        )

    def _endpoint(self) -> str:
        settings = get_settings()
        base_url = (settings.vision_api_base_url or "https://generativelanguage.googleapis.com").rstrip("/")
        if ":generateContent" in base_url:
            return base_url
        return f"{base_url}/v1beta/models/{self.model_name}:generateContent"

    def _resolve_uploaded_image_path(self, image_url: str) -> Path:
        settings = get_settings()
        parsed = urlparse(image_url)
        filename = Path(parsed.path).name if parsed.path else Path(image_url).name
        if not filename:
            raise FileNotFoundError("Image filename is missing")
        image_path = Path(settings.upload_dir) / filename
        if not image_path.exists():
            raise FileNotFoundError(f"Uploaded image not found: {image_path}")
        return image_path

    def _extract_model_text(self, payload: dict) -> str:
        parts = payload.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        return "".join(part.get("text", "") for part in parts if isinstance(part, dict)).strip()

    def _parse_gemini_json(self, payload: dict) -> dict:
        text = self._extract_model_text(payload)
        if text.startswith("```"):
            text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(text)
        if not isinstance(parsed, dict):
            raise ValueError("Gemini response is not a JSON object")
        return parsed
