#!/usr/bin/env python3
"""VideoNest Launcher - Starts both backend and frontend."""

import subprocess
import sys
import time
import webbrowser
from pathlib import Path


def main():
    print("""
    ███╗   ██╗██╗███╗   ██╗███████╗██╗   ██╗███████╗██╗  ██╗███████╗███████╗
    ████╗  ██║██║████╗  ██║██╔════╝╚██╗ ██╔╝██╔════╝██║  ██║██╔════╝██╔════╝
    ██╔██╗ ██║██║██╔██╗ ██║█████╗  ╚████╔╝ ███████╗███████║█████╗  ███████╗
    ██║╚██╗██║██║██║╚██╗██║██╔══╝   ╚██╔╝  ╚════██║██╔══██║██╔══╝  ╚════██║
    ██║ ╚████║██║██║ ╚████║███████╗   ██║   ███████║██║  ██║███████╗███████║
    ╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝
    """)

    base_dir = Path(__file__).parent
    backend_dir = base_dir / "backend"
    frontend_dir = base_dir / "frontend"

    print("Starting VideoNest...")
    print()

    # Start backend
    print("[1/2] Starting backend on port 8000...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    # Wait for backend to start
    time.sleep(2)

    # Start frontend
    print("[2/2] Starting frontend on port 5173...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev", "--", "--port", "5173"],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    print()
    print("=" * 50)
    print("  VideoNest is running!")
    print("=" * 50)
    print()
    print("  Open http://localhost:5173 in your browser")
    print()
    print("  Press Ctrl+C to stop")
    print()

    # Open browser
    webbrowser.open("http://localhost:5173")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        backend_process.terminate()
        frontend_process.terminate()
        print("Done!")


if __name__ == "__main__":
    main()
