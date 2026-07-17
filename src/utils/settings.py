from pydantic_settings import BaseSettings, SettingsConfigDict

class settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

    DB_CONNECTION : str


settings = settings()