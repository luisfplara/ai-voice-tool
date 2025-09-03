from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str 
    retell_api_key: str

    # Public base URL where FastAPI is reachable by Retell (ngrok or prod)
    backend_base_url: str = "http://localhost:8000"

    # Optional integrations
    openai_api_key: Optional[str] 

settings = Settings()

