from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import ProfileSettings
from app.models.schemas import SettingsUpdate, SettingsResponse

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/{profile_id}", response_model=SettingsResponse)
async def get_settings(profile_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProfileSettings).where(ProfileSettings.profile_id == profile_id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings


@router.put("/{profile_id}", response_model=SettingsResponse)
async def update_settings(
    profile_id: int,
    settings_update: SettingsUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ProfileSettings).where(ProfileSettings.profile_id == profile_id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    update_data = settings_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    return settings
