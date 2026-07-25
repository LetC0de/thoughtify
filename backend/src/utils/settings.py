from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

    DB_CONNECTION : str
    SECRET_KEY : str
    RESEND_API_KEY : str
    ALGORITHM : str
    EXP_TIME : int
    CORS_ORIGINS : str = "http://localhost:5173,null"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = settings()