from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    playback_history = relationship("PlaybackHistory", back_populates="profile")
    favorites = relationship("Favorite", back_populates="profile")
    settings = relationship("ProfileSettings", back_populates="profile", uselist=False)


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    videos = relationship("Video", back_populates="folder")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    path = Column(String, unique=True, nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id"))
    duration = Column(Float, nullable=True)
    resolution = Column(String, nullable=True)
    codec = Column(String, nullable=True)
    bitrate = Column(Integer, nullable=True)
    frame_rate = Column(Float, nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    indexed_at = Column(DateTime, default=datetime.utcnow)

    folder = relationship("Folder", back_populates="videos")
    playback_history = relationship("PlaybackHistory", back_populates="video")
    favorites = relationship("Favorite", back_populates="video")


class PlaybackHistory(Base):
    __tablename__ = "playback_history"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    position = Column(Float, default=0.0)
    duration = Column(Float, default=0.0)
    playback_speed = Column(Float, default=1.0)
    subtitle_language = Column(String, nullable=True)
    last_watched = Column(DateTime, default=datetime.utcnow)
    completed = Column(Boolean, default=False)

    profile = relationship("Profile", back_populates="playback_history")
    video = relationship("Video", back_populates="playback_history")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="favorites")
    video = relationship("Video", back_populates="favorites")


class ProfileSettings(Base):
    __tablename__ = "profile_settings"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), unique=True)
    theme = Column(String, default="dark")
    subtitle_font_size = Column(Integer, default=24)
    subtitle_color = Column(String, default="#FFFFFF")
    playback_speed = Column(Float, default=1.0)
    autoplay = Column(Boolean, default=True)

    profile = relationship("Profile", back_populates="settings")
