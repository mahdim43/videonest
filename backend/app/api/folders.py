from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.models import Folder, Video
from app.models.schemas import FolderCreate, FolderResponse
from app.services.scanner import scan_folder

router = APIRouter(prefix="/api/folders", tags=["folders"])


@router.get("/", response_model=list[FolderResponse])
async def get_folders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Folder))
    return result.scalars().all()


@router.post("/", response_model=FolderResponse)
async def add_folder(folder: FolderCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Folder).where(Folder.path == folder.path)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Folder already added")

    db_folder = Folder(path=folder.path, name=folder.name)
    db.add(db_folder)
    await db.commit()
    await db.refresh(db_folder)

    await scan_folder(db_folder, db)

    return db_folder


@router.post("/scan")
async def scan_all(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Folder))
    folders = result.scalars().all()
    total = 0
    for folder in folders:
        count = await scan_folder(folder, db)
        total += count
    return {"scanned": len(folders), "videos_found": total}


@router.delete("/{folder_id}")
async def remove_folder(folder_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Folder).where(Folder.id == folder_id))
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    await db.delete(folder)
    await db.commit()
    return {"message": "Folder removed"}


@router.get("/{folder_id}/videos")
async def get_folder_videos(folder_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Video).where(Video.folder_id == folder_id)
    )
    return result.scalars().all()
