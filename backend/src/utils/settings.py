from pydantic_settings import BaseSettings, SettingsConfigDict

class settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

    DB_CONNECTION : str
    SECRET_KEY : str
    RESEND_API_KEY : str
    ALGORITHM : str
    EXP_TIME : int
    FE_DOMAIN : str = "http://localhost:5173"
    FE_DOMAIN_WWW : str = "http://localhost:5173"
    ADMIN_DOMAIN : str = "http://localhost:5173"
    BACKEND_DOMAIN : str = "http://localhost:5173"


settings = settings()