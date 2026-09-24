from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "LAND STACK"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALGORITHM: str = "HS256"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # SQLite database (no PostgreSQL needed)
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./landstack.db"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
