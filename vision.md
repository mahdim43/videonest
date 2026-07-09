You are a senior frontend engineer and UX designer.

Your task is to build the VideoNest video player.

This player is the most important part of the entire application.

Do NOT use the default browser controls.

Build a completely custom video player using React + TypeScript + Vidstack.

The player should feel like a premium streaming platform rather than a web video player.

=====================================================
DESIGN
=====================================================

Theme:

- Background: #080808
- Surface: #111111
- Cards: #181818
- Accent: #D90429
- Hover Accent: #EF233C
- Text: White
- Secondary Text: #AAAAAA

Use smooth animations.

Rounded corners.

Soft shadows.

No visible borders.

The controls should fade in/out.

No YouTube clone.

No Netflix clone.

Create a unique premium UI.

=====================================================
PLAYER LAYOUT
=====================================================

The video occupies as much space as possible while preserving aspect ratio.

Overlay controls float above the video.

The overlay fades in when:

- mouse moves
- user taps
- user pauses

The overlay fades out after 2 seconds of inactivity.

Use smooth opacity transitions.

=====================================================
CENTER CONTROLS
=====================================================

Center controls contain

Previous Episode

Play / Pause

Next Episode

Large circular buttons.

Play button is larger than the others.

When hovering:

- scale 1.08
- smooth animation

=====================================================
BOTTOM CONTROLS
=====================================================

Bottom Left

Play

Current Time

Duration

Bottom Center

Timeline

Bottom Right

Subtitle

Playback Speed

AutoPlay toggle

Picture in Picture

Fullscreen

Settings

=====================================================
TIMELINE
=====================================================

The timeline should feel extremely polished.

Requirements

Hovering over timeline:

Show preview thumbnail.

Show timestamp.

The preview follows cursor.

Current progress

Buffered progress

Remaining progress

must all have different colors.

Dragging

Do NOT jump.

Preview continuously.

When released

Seek.

Support keyboard seeking.

=====================================================
TIMELINE PREVIEW
=====================================================

Display

+----------------------+
|                      |
|     thumbnail        |
|                      |
+----------------------+

01:23:18

The preview should animate.

=====================================================
GESTURES (DESKTOP)
=====================================================

Space

Play Pause

Left Arrow

Back 5 seconds

Right Arrow

Forward 5 seconds

Up

Volume +

Down

Volume -

Double Click

Fullscreen

Mouse Wheel

Adjust volume

F

Fullscreen

M

Mute

C

Toggle subtitles

=====================================================
GESTURES (MOBILE)
=====================================================

Double tap left

Seek backward 5 seconds

Double tap right

Seek forward 5 seconds

Long press anywhere

Playback becomes 2x

Release

Return to previous speed

Horizontal swipe

Scrub timeline

Vertical swipe left

Brightness overlay

Vertical swipe right

Volume overlay

Pinch

Zoom video

=====================================================
SUBTITLES
=====================================================

Support

Embedded subtitles

SRT

ASS

SSA

VTT

Allow user to

Enable

Disable

Change size

Change color

Outline

Background

Subtitle delay

Remember preferences.

=====================================================
AUTO PLAY
=====================================================

When video finishes

Display

Next Episode

Playing in

3

2

1

Buttons

Play Now

Cancel

AutoPlay can be disabled.

=====================================================
EPISODES
=====================================================

Buttons

Previous Episode

Next Episode

Disable buttons when unavailable.

=====================================================
PLAYBACK MEMORY
=====================================================

Save playback position every 5 seconds.

When reopening

Offer

Resume

or

Start Over

If playback >95%

Start from beginning next time.

=====================================================
PLAYER STATES
=====================================================

Loading

Show animated spinner.

Buffering

Show buffering animation.

Paused

Overlay visible.

Playing

Overlay hidden.

Error

Show friendly error page.

=====================================================
ANIMATIONS
=====================================================

All animations should use Framer Motion.

No abrupt changes.

Use easing.

Buttons

Scale on hover.

Timeline

Smooth interpolation.

Overlay

Fade.

Menus

Slide + Fade.

=====================================================
RESPONSIVENESS
=====================================================

Desktop

Tablet

Phone

Landscape phone

Portrait phone

All layouts must work perfectly.

=====================================================
ACCESSIBILITY
=====================================================

Keyboard accessible.

Visible focus.

ARIA labels.

Large touch targets.

=====================================================
QUALITY
=====================================================

Avoid unnecessary re-renders.

Separate components.

Create reusable hooks.

Use TypeScript strictly.

Code should be production ready.

No placeholder code.

No TODOs.

No fake implementations.

Implement everything completely.

Think like a senior engineer shipping a polished commercial streaming application.

Even Better: Break it into separate tasks

One mistake people make is asking the AI to build the entire player in one go. I would split it into milestones:

Core Player
Video playback
Overlay
Play/Pause
Timeline
Fullscreen
Mobile Gestures
Double-tap seek
Hold for 2×
Swipe seeking
Brightness/volume gestures
Subtitle System
Embedded subtitle extraction
External subtitle loading
Subtitle settings UI
Timeline Preview
Thumbnail sprite generation
Hover previews
Timestamp preview
Player Polish
Framer Motion animations
Loading/buffering states
Keyboard shortcuts
Auto-hide controls
Accessibility
Performance optimization