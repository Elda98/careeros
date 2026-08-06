from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    environment: str = "development"

    database_url: str = "postgresql+asyncpg://careeros:careeros_dev_password@localhost:5432/careeros"
    redis_url: str = "redis://localhost:6379/0"

    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "careeros-documents"

    groq_api_key: str = ""

    langchain_tracing_v2: bool = False
    langchain_api_key: str = ""
    langchain_project: str = "careeros-dev"

    otel_exporter_otlp_endpoint: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
