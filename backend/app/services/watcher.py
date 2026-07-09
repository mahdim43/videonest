import asyncio
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from app.core.config import settings


class VideoFolderHandler(FileSystemEventHandler):
    def __init__(self, loop):
        self.loop = loop

    def on_created(self, event):
        if event.is_directory:
            return
        if Path(event.src_path).suffix.lower() in settings.VIDEO_EXTENSIONS:
            asyncio.run_coroutine_threadsafe(
                self._notify_new_video(event.src_path),
                self.loop
            )

    async def _notify_new_video(self, path: str):
        pass


_observer = None


def start_watching(folders: list[str], loop):
    global _observer
    _observer = Observer()
    handler = VideoFolderHandler(loop)

    for folder in folders:
        if Path(folder).exists():
            _observer.schedule(handler, folder, recursive=True)

    _observer.start()


def stop_watching():
    global _observer
    if _observer:
        _observer.stop()
        _observer.join()
        _observer = None
