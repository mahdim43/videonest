from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import Favorite
from app.models.schemas import FavoriteCreate

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


@router.get("/{profile_id}")
async def get_favorites(profile_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Favorite)
        .options(selectinload(Favorite.video))
        .where(Favorite.profile_id == profile_id)
    )
    favorites = result.scalars().all()

    return [
        {
            "id": f.id,
            "profile_id": f.profile_id,
            "video_id": f.video_id,
            "video": {
                "id": f.video.id,
                "filename": f.video.filename,
                "path": f.video.path,
                "duration": f.video.duration,
                "resolution": f.video.resolution,
            } if f.video else None
        }
        for f in favorites
    ]


@router.post("/{profile_id}")
async def add_favorite(
    profile_id: int,
    favorite: FavoriteCreate,
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(
        select(Favorite).where(
            Favorite.profile_id == profile_id,
            Favorite.video_id == favorite.video_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already in favorites")

    db_favorite = Favorite(profile_id=profile_id, video_id=favorite.video_id)
    db.add(db_favorite)
    await db.commit()
    await db.refresh(db_favorite)
    return {"id": db_favorite.id, "profile_id": db_favorite.profile_id, "video_id": db_favorite.video_id}


@router.delete("/{profile_id}/{video_id}")
async def remove_favorite(
    profile_id: int,
    video_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Favorite).where(
            Favorite.profile_id == profile_id,
            Favorite.video_id == video_id
        )
    )
    favorite = result.scalar_one_or_none()
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    await db.delete(favorite)
    await db.commit()
    return {"message": "Favorite removed"}
