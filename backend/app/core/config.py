"""Typed configuration loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the gateway service.

    Defaults are deliberately safe for a local prototype. Production secrets
    must be provided through environment variables, never source control.
    """

    app_name: str = "SAMANVAYSETU API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    database_url: str = "postgresql+psycopg://samanvaysetu:change-me-for-local-development@localhost:5432/samanvaysetu"

    # AI Schema Mapper settings (Optional: deterministic mapping registry fallback is authoritative when absent)
    ai_schema_mapper_enabled: bool = False
    ai_schema_mapper_api_key: str | None = None
    ai_schema_mapper_model: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance for the application lifetime."""

    return Settings()
