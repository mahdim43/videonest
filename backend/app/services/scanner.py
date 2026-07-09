import os
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.models import Folder, Video
from app.services.ffmpeg import get_video_metadata, generate_thumbnail


THUMBNAIL_DIR = Path("thumbnails")
THUMBNAIL_DIR.mkdir(exist_ok=True)


async def scan_folder(folder: Folder, db: AsyncSession) -> int:
    """Scan a folder and index all video files."""
    folder_path = Path(folder.path)
    if not folder_path.exists():
        print(f"[Scanner] Folder not found: {folder.path}")
        return 0

    print(f"[Scanner] Scanning folder: {folder.path}")
    count = 0

    try:
        for file_path in folder_path.iterdir():
            if not file_path.is_file():
                continue

            if file_path.suffix.lower() not in settings.VIDEO_EXTENSIONS:
                continue

            existing = await db.execute(
                select(Video).where(Video.path == str(file_path))
            )
            if existing.scalar_one_or_none():
                print(f"[Scanner] Already indexed: {file_path.name}")
                continue

            print(f"[Scanner] Indexing: {file_path.name}")
            metadata = get_video_metadata(str(file_path))

            thumb_name = f"{file_path.stem}.jpg"
            thumb_path = THUMBNAIL_DIR / thumb_name
            thumb_generated = False

            if not thumb_path.exists():
                duration = metadata.get("duration", 0)
                ts = "00:00:01"
                if duration > 10:
                    ts = "00:00:05"
                if duration > 60:
                    ts = "00:00:10"
                thumb_generated = generate_thumbnail(
                    str(file_path), str(thumb_path), ts
                )

            video = Video(
                filename=file_path.name,
                path=str(file_path),
                folder_id=folder.id,
                duration=metadata.get("duration"),
                resolution=metadata.get("resolution"),
                codec=metadata.get("codec"),
                bitrate=metadata.get("bitrate"),
                frame_rate=metadata.get("frame_rate"),
                file_size=metadata.get("file_size"),
                thumbnail_path=str(thumb_path) if thumb_generated and thumb_path.exists() else None,
            )
            db.add(video)
            count += 1
            print(f"[Scanner] Indexed: {file_path.name} ({metadata.get('resolution', 'N/A')})")

    except Exception as e:
        print(f"[Scanner] Error scanning folder: {e}")

    await db.commit()
    print(f"[Scanner] Finished scanning {folder.path}: {count} new videos")
    return count


async def scan_all_folders(db: AsyncSession) -> dict:
    """Scan all registered folders."""
    result = await db.execute(select(Folder))
    folders = result.scalars().all()

    total_indexed = 0
    for folder in folders:
        count = await scan_folder(folder, db)
        total_indexed += count

    return {"folders_scanned": len(folders), "videos_indexed": total_indexed}
