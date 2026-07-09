from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import Profile, ProfileSettings
from app.models.schemas import ProfileCreate, ProfileResponse

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("/", response_model=list[ProfileResponse])
async def get_profiles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile))
    return result.scalars().all()


@router.post("/", response_model=ProfileResponse)
async def create_profile(profile: ProfileCreate, db: AsyncSession = Depends(get_db)):
    db_profile = Profile(name=profile.name, avatar=profile.avatar)
    db.add(db_profile)
    await db.commit()
    await db.refresh(db_profile)

    settings = ProfileSettings(profile_id=db_profile.id)
    db.add(settings)
    await db.commit()

    return db_profile


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.delete("/{profile_id}")
async def delete_profile(profile_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Profile).where(Profile.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
    await db.commit()
    return {"message": "Profile deleted"}
