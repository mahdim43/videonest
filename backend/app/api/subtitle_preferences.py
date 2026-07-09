from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import SubtitlePreferences
from app.models.schemas import SubtitlePreferencesUpdate, SubtitlePreferencesResponse

router = APIRouter(prefix="/api/subtitle-preferences", tags=["subtitle-preferences"])


@router.get("/{profile_id}", response_model=SubtitlePreferencesResponse)
async def get_subtitle_preferences(profile_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SubtitlePreferences).where(SubtitlePreferences.profile_id == profile_id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = SubtitlePreferences(profile_id=profile_id)
        db.add(prefs)
        await db.commit()
        await db.refresh(prefs)
    return prefs


@router.put("/{profile_id}", response_model=SubtitlePreferencesResponse)
async def update_subtitle_preferences(
    profile_id: int,
    update: SubtitlePreferencesUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SubtitlePreferences).where(SubtitlePreferences.profile_id == profile_id)
    )
    prefs = result.scalar_one_or_none()
    if not prefs:
        prefs = SubtitlePreferences(profile_id=profile_id)
        db.add(prefs)
        await db.flush()

    update_data = update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prefs, key, value)

    await db.commit()
    await db.refresh(prefs)
    return prefs
