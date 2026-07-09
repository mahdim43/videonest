from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.core.database import get_db
from app.models.models import PlaybackHistory, Video
from app.models.schemas import PlaybackHistoryCreate

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/{profile_id}")
async def get_playback_history(
    profile_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PlaybackHistory)
        .options(selectinload(PlaybackHistory.video))
        .where(PlaybackHistory.profile_id == profile_id)
        .order_by(PlaybackHistory.last_watched.desc())
        .limit(limit)
    )
    history = result.scalars().all()

    return [
        {
            "id": h.id,
            "profile_id": h.profile_id,
            "video_id": h.video_id,
            "position": h.position,
            "duration": h.duration,
            "playback_speed": h.playback_speed,
            "subtitle_language": h.subtitle_language,
            "last_watched": h.last_watched.isoformat() if h.last_watched else None,
            "completed": h.completed,
            "video": {
                "id": h.video.id,
                "filename": h.video.filename,
                "path": h.video.path,
                "duration": h.video.duration,
                "resolution": h.video.resolution,
            } if h.video else None
        }
        for h in history
    ]


@router.post("/{profile_id}")
async def update_playback_history(
    profile_id: int,
    history: PlaybackHistoryCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PlaybackHistory).where(
            PlaybackHistory.profile_id == profile_id,
            PlaybackHistory.video_id == history.video_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.position = history.position
        existing.duration = history.duration
        existing.playback_speed = history.playback_speed
        existing.subtitle_language = history.subtitle_language
        existing.last_watched = datetime.utcnow()
        if history.duration > 0 and (history.position / history.duration) >= 0.95:
            existing.completed = True
        await db.commit()
        await db.refresh(existing)
        return {
            "id": existing.id,
            "profile_id": existing.profile_id,
            "video_id": existing.video_id,
            "position": existing.position,
            "duration": existing.duration,
            "completed": existing.completed,
        }
    else:
        db_history = PlaybackHistory(
            profile_id=profile_id,
            video_id=history.video_id,
            position=history.position,
            duration=history.duration,
            playback_speed=history.playback_speed,
            subtitle_language=history.subtitle_language,
            completed=history.duration > 0 and (history.position / history.duration) >= 0.95
        )
        db.add(db_history)
        await db.commit()
        await db.refresh(db_history)
        return {
            "id": db_history.id,
            "profile_id": db_history.profile_id,
            "video_id": db_history.video_id,
            "position": db_history.position,
            "duration": db_history.duration,
            "completed": db_history.completed,
        }


@router.delete("/{profile_id}/{video_id}")
async def delete_playback_history(
    profile_id: int,
    video_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PlaybackHistory).where(
            PlaybackHistory.profile_id == profile_id,
            PlaybackHistory.video_id == video_id
        )
    )
    history = result.scalar_one_or_none()
    if not history:
        raise HTTPException(status_code=404, detail="History not found")
    await db.delete(history)
    await db.commit()
    return {"message": "History deleted"}
