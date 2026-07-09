import json
import subprocess
from pathlib import Path


def get_video_metadata(file_path: str) -> dict:
    """Extract video metadata using ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(result.stdout)

        video_stream = None
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video":
                video_stream = stream
                break

        if not video_stream:
            return {}

        format_info = data.get("format", {})

        return {
            "duration": float(format_info.get("duration", 0)),
            "resolution": f"{video_stream.get('width', 0)}x{video_stream.get('height', 0)}",
            "codec": video_stream.get("codec_name", "unknown"),
            "bitrate": int(format_info.get("bit_rate", 0)),
            "frame_rate": eval(video_stream.get("r_frame_rate", "0/1")) if "/" in video_stream.get("r_frame_rate", "0/1") else float(video_stream.get("r_frame_rate", 0)),
            "file_size": int(format_info.get("size", 0)),
        }
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError):
        return {}


def generate_thumbnail(video_path: str, output_path: str, timestamp: str = "00:00:01") -> bool:
    """Generate a thumbnail from a video."""
    cmd = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-ss", timestamp,
        "-vframes", "1",
        "-vf", "scale=320:-1",
        output_path
    ]

    try:
        subprocess.run(cmd, capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False
