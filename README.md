# VideoNest

Personal local streaming platform for your video collection.

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features

- Profile-based multi-user support
- Automatic folder indexing
- Video streaming with HTTP Range Requests
- Playback history and continue watching
- Favorites
- Search
- Mobile-friendly player
- Subtitle support
- Dark theme with cyberpunk-inspired design

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite, FFmpeg
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Vidstack Player

## Docker

```bash
docker-compose up -d
```

## Creating Installer

### Prerequisites

- Python 3.11+
- Node.js 20+
- FFmpeg installed and in PATH
- [NSIS](https://nsis.sourceforge.io/Download) (for Windows installer)

### Build Steps

1. Run the build script:
```bash
build.bat
```

2. Create the installer:
```bash
create-installer.bat
```

3. Find `VideoNest-Setup.exe` in the project root.

### Using the Installer

1. Run `VideoNest-Setup.exe`
2. Choose installation directory
3. Launch from Start Menu or desktop shortcut

## Quick Launch (Development)

For development without installer:
```bash
start.bat
```

## API Endpoints

- `GET /api/profiles/` - List profiles
- `POST /api/profiles/` - Create profile
- `GET /api/folders/` - List folders
- `POST /api/folders/` - Add folder
- `GET /api/videos/` - List videos
- `GET /api/videos/{id}/stream` - Stream video
- `GET /api/history/{profileId}` - Get playback history
- `POST /api/history/{profileId}` - Update playback history
- `GET /api/favorites/{profileId}` - Get favorites
- `POST /api/favorites/{profileId}` - Add to favorites
