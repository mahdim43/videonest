<div align="center">

<img src="frontend/public/favicon.svg" alt="VideoNest Logo" width="100" />

# VideoNest

**Personal local streaming platform for your video collection.**

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776ab.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

<div align="center">

<img src="frontend/src/assets/hero.png" alt="VideoNest Screenshot" width="700" />

</div>

## Features

| | Feature | Description |
|---|---|---|
| 👤 | **Multi-User Profiles** | Separate libraries and watch history per profile |
| 📂 | **Auto Folder Indexing** | Point to a directory — videos appear automatically |
| ▶️ | **Smooth Streaming** | HTTP Range Requests for instant seeking |
| ⏸️ | **Continue Watching** | Pick up right where you left off |
| ❤️ | **Favorites** | Bookmark videos for quick access |
| 🔍 | **Search** | Find anything in your collection instantly |
| 📱 | **Mobile Player** | Touch-friendly controls, gesture support |
| 💬 | **Subtitles** | SRT/ASS subtitle support with customizable preferences |
| 🎨 | **Cyberpunk Theme** | Dark UI with neon purple accents |
| 📲 | **PWA** | Install as a standalone app, works offline |

## Tech Stack

<div align="center">

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19 &middot; TypeScript &middot; Vite &middot; TailwindCSS 4 &middot; Zustand &middot; React Query &middot; Framer Motion |
| **Backend** | FastAPI &middot; SQLAlchemy &middot; SQLite &middot; Pydantic &middot; Watchdog |
| **Media** | FFmpeg &middot; HTTP Range Requests &middot; Thumbnail generation |
| **Infra** | Docker &middot; Nginx &middot; PWA (vite-plugin-pwa) |

</div>

## Quick Start

### Docker (Recommended)

```bash
docker-compose up -d
```

Frontend available at `http://localhost` &middot; Backend API at `http://localhost:8000`

### Local Development

**Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Windows Installer

> **Prerequisites:** Python 3.11+, Node.js 20+, FFmpeg in PATH, [NSIS](https://nsis.sourceforge.io/Download)

```bash
build.bat            # Build frontend & bundle backend
create-installer.bat # Generate VideoNest-Setup.exe
```

Run `VideoNest-Setup.exe` and install to your preferred directory. Launch from the Start Menu or desktop shortcut.

### Quick Launch (Dev)

```bash
start.bat
```

## Project Structure

```
videonest/
├── backend/
│   └── app/
│       ├── api/          # Route handlers (profiles, videos, folders, history, favorites)
│       ├── core/         # Config & database setup
│       ├── models/       # SQLAlchemy models
│       └── services/     # Business logic (scanning, thumbnails, streaming)
├── frontend/
│   └── src/
│       ├── components/   # UI components (player controls, nav, prompts)
│       ├── pages/        # Landing, Home, Player, Settings
│       └── assets/       # Images & icons
├── docker-compose.yml
├── start.bat
└── launch.py
```

## API Reference

<details>
<summary><strong>View all endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profiles/` | List all profiles |
| `POST` | `/api/profiles/` | Create a new profile |
| `GET` | `/api/folders/` | List indexed folders |
| `POST` | `/api/folders/` | Add a folder to index |
| `GET` | `/api/videos/` | List all videos |
| `GET` | `/api/videos/{id}/stream` | Stream video with Range support |
| `GET` | `/api/history/{profileId}` | Get playback history |
| `POST` | `/api/history/{profileId}` | Update playback position |
| `GET` | `/api/favorites/{profileId}` | Get favorites |
| `POST` | `/api/favorites/{profileId}` | Add to favorites |

</details>

## License

[MIT](LICENSE) &copy; 2026 VideoNest
