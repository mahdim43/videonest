import os
import subprocess
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse, Response, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.models.models import Video, Folder
from app.models.schemas import VideoResponse

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.get("/", response_model=list[VideoResponse])
async def get_videos(
    search: str | None = None,
    folder_id: int | None = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Video)
    if folder_id:
        query = query.where(Video.folder_id == folder_id)
    if search:
        words = search.replace(".", " ").replace("_", " ").split()
        conditions = [Video.filename.ilike(f"%{word}%") for word in words if word]
        if conditions:
            query = query.where(or_(*conditions))
    query = query.order_by(Video.filename)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.get("/{video_id}/neighbors")
async def get_neighbor_videos(video_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    siblings_result = await db.execute(
        select(Video)
        .where(Video.folder_id == video.folder_id)
        .order_by(Video.filename)
    )
    siblings = list(siblings_result.scalars().all())

    current_idx = next((i for i, v in enumerate(siblings) if v.id == video_id), 0)

    prev_video = siblings[current_idx - 1] if current_idx > 0 else None
    next_video = siblings[current_idx + 1] if current_idx < len(siblings) - 1 else None

    return {
        "prev": {"id": prev_video.id, "filename": prev_video.filename} if prev_video else None,
        "next": {"id": next_video.id, "filename": next_video.filename} if next_video else None,
    }


@router.get("/{video_id}/thumbnail")
async def get_thumbnail(video_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.thumbnail_path and os.path.exists(video.thumbnail_path):
        return FileResponse(video.thumbnail_path, media_type="image/jpeg")

    raise HTTPException(status_code=404, detail="Thumbnail not found")


@router.get("/{video_id}/subtitles")
async def get_subtitles(video_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    file_path = video.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    try:
        proc = subprocess.run(
            ["ffprobe", "-v", "quiet", "-select_streams", "s",
             "-show_entries", "stream=index,codec_name,codec_type",
             "-show_entries", "stream_tags=language,title",
             "-of", "json", file_path],
            capture_output=True, text=True, timeout=10
        )
        data = json.loads(proc.stdout)
        streams = data.get("streams", [])
        return [
            {
                "index": s["index"],
                "codec": s.get("codec_name", "unknown"),
                "language": s.get("tags", {}).get("language", "und"),
                "title": s.get("tags", {}).get("title", f"Track {s['index']}"),
            }
            for s in streams
        ]
    except Exception:
        return []


@router.get("/{video_id}/subtitles/{track_index}")
async def stream_subtitle(video_id: int, track_index: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    file_path = video.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    try:
        proc = subprocess.run(
            ["ffmpeg", "-i", file_path, "-map", f"0:{track_index}",
             "-f", "webvtt", "-codec:s", "webvtt", "pipe:1"],
            capture_output=True, timeout=30
        )
        if proc.returncode == 0 and proc.stdout:
            return Response(content=proc.stdout, media_type="text/vtt")
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="Subtitle track not found")


@router.get("/{video_id}/stream")
async def stream_video(
    video_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    file_path = video.path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")

    if range_header:
        range_start, range_end = range_header.replace("bytes=", "").split("-")
        range_start = int(range_start)
        range_end = int(range_end) if range_end else file_size - 1

        content_length = range_end - range_start + 1

        def iter_file():
            with open(file_path, "rb") as f:
                f.seek(range_start)
                remaining = content_length
                while remaining > 0:
                    chunk_size = min(1024 * 1024, remaining)
                    data = f.read(chunk_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {range_start}-{range_end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(content_length),
            "Content-Type": "video/mp4",
        }
        return StreamingResponse(iter_file(), status_code=206, headers=headers)
    else:
        def iter_file():
            with open(file_path, "rb") as f:
                while chunk := f.read(1024 * 1024):
                    yield chunk

        headers = {
            "Content-Length": str(file_size),
            "Content-Type": "video/mp4",
            "Accept-Ranges": "bytes",
        }
        return StreamingResponse(iter_file(), headers=headers)
