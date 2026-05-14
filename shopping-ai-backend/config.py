from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Shopping AI Assistant"
    env: str = "development"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/shopping_ai"
    use_mock_provider: bool = True
    use_mock_vision: bool = True
    use_mock_product: bool = True
    upload_dir: str = "uploads"
    public_base_url: str = "http://localhost:8000"
    backend_cors_origins: str = "*"

    vision_api_key: str | None = None
    vision_api_base_url: str | None = None
    jd_app_key: str | None = None
    jd_app_secret: str | None = None
    jd_api_base_url: str | None = None
    pdd_client_id: str | None = None
    pdd_client_secret: str | None = None
    pdd_api_base_url: str | None = None
    llm_api_key: str | None = None
    llm_api_base_url: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def upload_path(self) -> Path:
        return Path(self.upload_dir)

    @property
    def cors_origins(self) -> list[str]:
        if self.backend_cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
