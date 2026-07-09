Vision

VideoNest is not a media server like Jellyfin or Plex.

It is a personal local streaming platform designed for a single user who wants the smoothest possible experience watching videos stored on their PC from any device connected to the same Wi-Fi network.

The philosophy is:

Pick your folders once. Forget about file management forever.

The application should feel closer to a premium streaming service than a traditional file browser while remaining lightweight, responsive, and easy to deploy.

Target Users
One primary user.
Optional multiple local profiles.
No passwords.
No cloud.
No internet required.
No account creation.

Everything stays on the user's computer.

Core Workflow
User opens VideoNest.
Creates one or more local profiles.
Chooses one or more folders.
VideoNest indexes the folders.
Library appears instantly.
User opens the website from a phone.
Presses Play.
That's it.

No additional setup.

Architecture
                Browser (Phone)

                     │

          React + TypeScript + PWA

                     │

──────────── Local Network ────────────

                     │

         FastAPI Backend (Python)

                     │

     SQLite + FFmpeg + FFprobe

                     │

        User Selected Video Folders

Everything communicates over REST + WebSocket.

Technology Stack
Backend
FastAPI
SQLAlchemy
SQLite
FFmpeg
FFprobe
Watchdog (folder monitoring)
Uvicorn
Frontend
React
TypeScript
Vite
TailwindCSS
Framer Motion
Vidstack Player
TanStack Query
Zustand
React Router
Deployment

Docker support

Standalone installer later

Design Language

Don't copy Netflix.

Don't copy YouTube.

Instead create a unique identity.

Style inspiration:

Modern Windows 11
Cyberpunk UI
Pixel accents
Minimalism
Black and Red

The UI should feel premium.

Colors

Background

#080808

Panels

#111111

Cards

#181818

Primary Accent

#D90429

Hover

#EF233C

Success

#3CB371

Text

#FFFFFF

Secondary Text

#AAAAAA
Typography

Body

Inter

Headings

Space Grotesk

Pixel Font

Only for

Logo
Loading
Small decorations

Never for body text.

UI Style

Rounded corners

16px

Soft shadows

Glass blur

Large spacing

Very smooth animations

Absolutely no clutter.

Landing Screen
────────────────────────

VideoNest

Choose Profile

○ Amir

+ New Profile

────────────────────────
Home Screen

Sections

Continue Watching

Recently Added

Favorites

Folders

Settings

Continue Watching Card

Breaking Bad

Episode 5

━━━━━━━━━━━━━━

23:18 / 49:30

Resume
Folder View
Anime

    One Piece

    Naruto

Movies

    Interstellar

TV Shows

    Breaking Bad

Folders preserve the real disk structure.

Automatic Folder Monitoring

When the user copies a video into

Anime/

the UI updates automatically.

No refresh button.

Supported Formats

MP4

MKV

AVI

MOV

FLV

WEBM

M4V

TS

HEVC

AV1

H264

HDR if browser supports it.

Video Metadata

Read using FFprobe.

Store

Resolution

Codec

Duration

Bitrate

Frame Rate

Embedded subtitles

Embedded chapters

File size

Creation date

Streaming

HTTP Range Requests.

Always stream the original file.

Transcode only when absolutely necessary.

Video Player

The player is the most important component.

It should feel better than VLC.

Controls

Play

Pause

Seek

Volume

Fullscreen

Subtitle

Playback Speed

AutoPlay

Previous Episode

Next Episode

Picture in Picture

Screenshot

Gestures

Desktop

Double Click

Fullscreen

Arrow Keys

Seek

Space

Pause

Mouse Wheel

Volume

Mobile

Double Tap Left

-5 sec

Double Tap Right

+5 sec

Long Press

2× Speed

Horizontal Drag

Seek

Vertical Left

Brightness

Vertical Right

Volume

Pinch

Zoom

Timeline

Generate preview thumbnails.

While dragging

────────●────────

      ▲

┌──────────┐

 thumbnail

└──────────┘

01:24:18

Exactly like YouTube.

Player Overlay

Controls disappear after

2 seconds.

Fade animation.

AutoPlay

When a video ends

Next Episode

Playing in

3

2

1

Cancel button.

Previous Episode

One tap.

Next Episode

One tap.

Subtitle Support

Embedded subtitles

MKV

MP4

External

SRT

ASS

SSA

VTT

SUP

Features

On

Off

Language selection

Size

Color

Outline

Shadow

Background

Delay

Position

Playback Memory

Every profile stores

Current position

Watch percentage

Last watched date

Subtitle preference

Playback speed

If watched

95%

mark as completed.

Continue Watching

Breaking Bad

Episode 6

██████████░░░░

Resume

Search

Instant

Search by

Filename

Folder

Episode

Series

Favorites

Heart button.

Recently Added

Automatically sorted.

Settings

Folders

Profiles

Theme

Subtitle Defaults

Playback Defaults

Database

Rescan

About

Profiles

No passwords.

Just

Choose Profile

Amir

Guest

Anime

Database

Tables

Profiles

Folders

Videos

PlaybackHistory

Favorites

Settings

SubtitlePreferences

API

REST

GET /videos

GET /folders

GET /profiles

POST /history

POST /favorites

POST /settings

GET /stream/{id}

GET /subtitles/{id}

WebSocket

Library Updates

Folder Changes

Playback Events

Performance Goals

1000+ videos

Instant search

Home page

<300ms

Player startup

<1 second

Seek latency

<150ms

60 FPS animations

Accessibility

Keyboard shortcuts

Screen reader labels

Responsive UI

Large touch targets

Future Features

Chromecast

DLNA

Poster downloads

Skip intro

AI chapter detection

Collections

Video tags

Notes

Statistics

Multi-language

Remote access

Development Roadmap
Phase 1 (MVP)
Folder selection
Library indexing
Streaming
Profiles
Playback history
Continue Watching
Search
Favorites
Embedded and external subtitles
Mobile-friendly player
Autoplay
Next/Previous episode
Timeline preview
Beautiful dark theme
Phase 2
Metadata enrichment
Poster downloads
Keyboard shortcut customization
Better episode grouping
Performance optimization
Phase 3
Chromecast
DLNA
AI-powered organization
Collections
Plugin system
One last feature I would add

This is the feature I'd be most excited about because it reinforces the "personal streaming platform" identity.

Cinema Mode

When you press Play, the app doesn't just open a video—it transitions into a distraction-free viewing experience.

The entire UI fades to black.
The player expands with a smooth animation.
The current video's dominant colors subtly tint the background using a blurred ambient glow (similar to Ambilight, but software-generated).
Controls remain minimal and auto-hide.
Exiting playback smoothly restores the library.

It makes watching your own videos feel intentional and immersive instead of like opening a file in a generic media player.

One architectural change I strongly recommend

Instead of asking an AI to generate the whole application in one shot, treat this as a professional software project.

Have the AI first generate:

The complete project structure.
The database schema.
The REST and WebSocket API contracts.
The backend implementation.
The frontend component library and design system.
The player.
The remaining pages and features.