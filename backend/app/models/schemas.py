from datetime import datetime
from pydantic import BaseModel


class ProfileCreate(BaseModel):
    name: str
    avatar: str | None = None


class ProfileResponse(BaseModel):
    id: int
    name: str
    avatar: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class FolderCreate(BaseModel):
    path: str
    name: str


class FolderResponse(BaseModel):
    id: int
    path: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class VideoResponse(BaseModel):
    id: int
    filename: str
    path: str
    folder_id: int
    duration: float | None
    resolution: str | None
    codec: str | None
    bitrate: int | None
    frame_rate: float | None
    file_size: int | None
    created_at: datetime
    indexed_at: datetime

    class Config:
        from_attributes = True


class PlaybackHistoryCreate(BaseModel):
    video_id: int
    position: float
    duration: float
    playback_speed: float = 1.0
    subtitle_language: str | None = None


class PlaybackHistoryResponse(BaseModel):
    id: int
    profile_id: int
    video_id: int
    position: float
    duration: float
    playback_speed: float
    subtitle_language: str | None
    last_watched: datetime
    completed: bool

    class Config:
        from_attributes = True


class FavoriteCreate(BaseModel):
    video_id: int


class FavoriteResponse(BaseModel):
    id: int
    profile_id: int
    video_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    theme: str | None = None
    subtitle_font_size: int | None = None
    subtitle_color: str | None = None
    playback_speed: float | None = None
    autoplay: bool | None = None


class SettingsResponse(BaseModel):
    id: int
    profile_id: int
    theme: str
    subtitle_font_size: int
    subtitle_color: str
    playback_speed: float
    autoplay: bool

    class Config:
        from_attributes = True
