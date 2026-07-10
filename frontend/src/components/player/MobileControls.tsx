import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Maximize, Minimize, SkipBack, SkipForward,
  Volume2, VolumeX, ChevronLeft, ChevronRight,
  Subtitles, Settings as SettingsIcon
} from 'lucide-react'
import { useRef, useCallback } from 'react'

interface MobileControlsProps {
  playerState: 'loading' | 'buffering' | 'playing' | 'paused' | 'error'
  currentTime: number
  duration: number
  buffered: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  playbackSpeed: number
  showSubtitleMenu: boolean
  showSettings: boolean
  hasPrev: boolean
  hasNext: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onPrevEpisode: () => void
  onNextEpisode: () => void
  onShowSubtitleMenu: () => void
  onShowSettings: () => void
  onSeek: (time: number) => void
  formatTime: (s: number) => string
}

export default function MobileControls({
  playerState,
  currentTime,
  duration,
  buffered,
  volume,
  isMuted,
  isFullscreen,
  playbackSpeed,
  showSubtitleMenu,
  showSettings,
  hasPrev,
  hasNext,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  onSkipBack,
  onSkipForward,
  onPrevEpisode,
  onNextEpisode,
  onShowSubtitleMenu,
  onShowSettings,
  onSeek,
  formatTime,
}: MobileControlsProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

  const getProgressFromTouch = useCallback((clientX: number) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration
  }, [duration])

  const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
    isDraggingRef.current = true
    const time = getProgressFromTouch(e.touches[0].clientX)
    onSeek(time)
  }, [getProgressFromTouch, onSeek])

  const handleProgressTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    const time = getProgressFromTouch(e.touches[0].clientX)
    onSeek(time)
  }, [getProgressFromTouch, onSeek])

  const handleProgressTouchEnd = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 pb-4 px-4">
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-2 bg-white/20 rounded-full mb-3 mx-1"
          onTouchStart={handleProgressTouchStart}
          onTouchMove={handleProgressTouchMove}
          onTouchEnd={handleProgressTouchEnd}
          onClick={(e) => {
            const rect = progressRef.current?.getBoundingClientRect()
            if (!rect) return
            const pos = (e.clientX - rect.left) / rect.width
            onSeek(pos * duration)
          }}
        >
          <div
            className="absolute h-full bg-white/30 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute h-full bg-vn-accent rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute w-5 h-5 bg-vn-accent rounded-full -translate-y-1/2 top-1/2 
                       shadow-[0_0_10px_rgba(217,4,41,0.8)]"
            style={{ left: `calc(${progressPercent}% - 10px)` }}
          />
        </div>

        {/* Time display */}
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-xs font-mono text-white/80">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs font-mono text-white/50">
            {formatTime(duration)}
          </span>
        </div>

        {/* Main controls row */}
        <div className="flex items-center justify-between px-1">
          {/* Left controls */}
          <div className="flex items-center gap-0.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onToggleMute() }}
              className="p-3 rounded-full active:bg-white/10 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onShowSubtitleMenu() }}
              className={`p-3 rounded-full transition-colors ${showSubtitleMenu ? 'bg-vn-accent' : 'active:bg-white/10'}`}
              aria-label="Subtitles"
            >
              <Subtitles className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Center controls */}
          <div className="flex items-center gap-1">
            {hasPrev && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onPrevEpisode() }}
                className="p-2 rounded-full active:bg-white/10 transition-colors"
                aria-label="Previous episode"
              >
                <ChevronLeft className="w-7 h-7" />
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onSkipBack() }}
              className="p-3 rounded-full active:bg-white/10 transition-colors"
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onTogglePlay() }}
              className="p-5 rounded-full bg-white/15 active:bg-white/25 
                         transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              aria-label={playerState === 'playing' ? 'Pause' : 'Play'}
            >
              {playerState === 'playing' ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-0.5" />
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onSkipForward() }}
              className="p-3 rounded-full active:bg-white/10 transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-6 h-6" />
            </motion.button>

            {hasNext && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onNextEpisode() }}
                className="p-2 rounded-full active:bg-white/10 transition-colors"
                aria-label="Next episode"
              >
                <ChevronRight className="w-7 h-7" />
              </motion.button>
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-0.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onShowSettings() }}
              className={`p-3 rounded-full transition-colors ${showSettings ? 'bg-vn-accent' : 'active:bg-white/10'}`}
              aria-label="Playback speed"
            >
              <span className="text-xs font-medium">{playbackSpeed}x</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); onToggleFullscreen() }}
              className="p-3 rounded-full active:bg-white/10 transition-colors"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
