from pydantic_settings import BaseSettings, SettingsConfigDict

class settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

    DB_CONNECTION : str
    SECRET_KEY : str
    RESEND_API_KEY : str
    ALGORITHM : str
    EXP_TIME : int



settings = settings()