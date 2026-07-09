from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "VideoNest"
    DATABASE_URL: str = "sqlite+aiosqlite:///./videonest.db"
    VIDEO_EXTENSIONS: list[str] = [
        ".mp4", ".mkv", ".avi", ".mov", ".flv", ".webm", ".m4v", ".ts"
    ]
    THUMBNAIL_DIR: Path = Path("thumbnails")
    BASE_DIR: Path = Path(".")

    class Config:
        env_file = ".env"


settings = Settings()
