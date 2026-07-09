import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import init_db
from app.api import profiles, folders, videos, history, favorites, settings, subtitle_preferences
from app.services.watcher import start_watching, stop_watching


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    loop = asyncio.get_event_loop()
    start_watching([], loop)
    yield
    stop_watching()


app = FastAPI(
    title="VideoNest",
    description="Personal local streaming platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router)
app.include_router(folders.router)
app.include_router(videos.router)
app.include_router(history.router)
app.include_router(favorites.router)
app.include_router(settings.router)
app.include_router(subtitle_preferences.router)

try:
    app.mount("/thumbnails", StaticFiles(directory="thumbnails"), name="thumbnails")
except Exception:
    pass


@app.get("/")
async def root():
    return {"message": "VideoNest API"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}
