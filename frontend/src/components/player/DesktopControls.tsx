import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, PictureInPicture,
  ChevronRight, ChevronLeft, Sun, Moon, Settings as SettingsIcon
} from 'lucide-react'
import { useRef } from 'react'

interface DesktopControlsProps {
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
  showVolumeSlider: boolean
  showHoverTime: boolean
  hoverTime: number
  isDragging: boolean
  dragTime: number
  autoplay: boolean
  cinemaMode: boolean
  hasPrev: boolean
  hasNext: boolean
  videoFilename: string
  onTogglePlay: () => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  onTogglePiP: () => void
  onToggleAutoplay: () => void
  onToggleCinemaMode: () => void
  onSkipBack: () => void
  onSkipForward: () => void
  onPrevEpisode: () => void
  onNextEpisode: () => void
  onShowSubtitleMenu: () => void
  onShowSettings: () => void
  onProgressClick: (e: React.MouseEvent) => void
  onProgressHover: (e: React.MouseEvent) => void
  onProgressLeave: () => void
  onProgressDragStart: (e: React.MouseEvent) => void
  onProgressDrag: (e: React.MouseEvent) => void
  onProgressDragEnd: () => void
  onVolumeChange: (e: React.MouseEvent) => void
  onVolumeDragStart: (e: React.MouseEvent) => void
  onMouseMove: () => void
  formatTime: (s: number) => string
}

export default function DesktopControls({
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
  showVolumeSlider,
  showHoverTime,
  hoverTime,
  isDragging,
  dragTime,
  autoplay,
  cinemaMode,
  hasPrev,
  hasNext,
  videoFilename,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  onTogglePiP,
  onToggleAutoplay,
  onToggleCinemaMode,
  onSkipBack,
  onSkipForward,
  onPrevEpisode,
  onNextEpisode,
  onShowSubtitleMenu,
  onShowSettings,
  onProgressClick,
  onProgressHover,
  onProgressLeave,
  onProgressDragStart,
  onProgressDrag,
  onProgressDragEnd,
  onVolumeChange,
  onVolumeDragStart,
  onMouseMove,
  formatTime,
}: DesktopControlsProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  const progressPercent = (currentTime / duration) * 100
  const bufferedPercent = (buffered / duration) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 pointer-events-none z-30 vn-controls"
      onMouseMove={onMouseMove}
    >
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-auto" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 pointer-events-auto">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="p-3 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/20 
                       transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <h2 className="text-sm sm:text-lg font-heading font-semibold truncate max-w-xs sm:max-w-2xl px-4">
            {videoFilename.replace(/\.[^/.]+$/, '').replace(/\./g, ' ')}
          </h2>

          <div className="w-12" />
        </div>
      </div>

      {/* Center play controls */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-3 sm:gap-6 pointer-events-auto">
          {hasPrev && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onPrevEpisode}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                         transition-all duration-200"
              aria-label="Previous episode"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onSkipBack}
            className="p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                       transition-all duration-200 hidden sm:flex"
            aria-label="Skip back 10 seconds"
          >
            <SkipBack className="w-6 h-6 sm:w-8 sm:h-8" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onTogglePlay}
            className="p-5 sm:p-6 rounded-full bg-vn-accent hover:bg-vn-hover 
                       transition-all duration-200 shadow-[0_0_30px_rgba(217,4,41,0.4)]"
            aria-label={playerState === 'playing' ? 'Pause' : 'Play'}
          >
            {playerState === 'playing' ? (
              <Pause className="w-8 h-8 sm:w-10 sm:h-10" />
            ) : (
              <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onSkipForward}
            className="p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                       transition-all duration-200 hidden sm:flex"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className="w-6 h-6 sm:w-8 sm:h-8" />
          </motion.button>

          {hasNext && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onNextEpisode}
              className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                         transition-all duration-200"
              aria-label="Next episode"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto" />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pointer-events-auto">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative h-1.5 sm:h-2 bg-white/20 rounded-full cursor-pointer group"
            onClick={onProgressClick}
            onMouseMove={onProgressHover}
            onMouseLeave={onProgressLeave}
            onMouseDown={onProgressDragStart}
            onMouseMoveCapture={onProgressDrag}
            onMouseUp={onProgressDragEnd}
          >
            <div
              className="absolute h-full bg-white/30 rounded-full"
              style={{ width: `${bufferedPercent}%` }}
            />
            <motion.div
              className="absolute h-full bg-vn-accent rounded-full"
              style={{ width: `${isDragging ? (dragTime / duration) * 100 : progressPercent}%` }}
              layout
              transition={{ duration: 0.1 }}
            />
            <motion.div
              className="absolute w-4 h-4 bg-vn-accent rounded-full -translate-y-1/2 top-1/2 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         shadow-[0_0_10px_rgba(217,4,41,0.8)]"
              style={{ 
                left: `calc(${isDragging ? (dragTime / duration) * 100 : progressPercent}% - 8px)` 
              }}
            />
            <AnimatePresence>
              {showHoverTime && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute bottom-6 px-3 py-1.5 bg-black/90 rounded-lg text-xs
                             pointer-events-none backdrop-blur-sm"
                  style={{ left: `${(hoverTime / duration) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  {formatTime(hoverTime)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onTogglePlay}
                className="p-2 rounded-xl hover:bg-white/10 transition-all"
                aria-label={playerState === 'playing' ? 'Pause' : 'Play'}
              >
                {playerState === 'playing' ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
                )}
              </motion.button>

              <span className="text-xs sm:text-sm font-mono text-white/80">
                {formatTime(isDragging ? dragTime : currentTime)} / {formatTime(duration)}
              </span>

              <div
                className="relative"
                onMouseEnter={() => onShowSettings()}
                onMouseLeave={() => onShowSettings()}
              >
                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-auto"
                    >
                      <div className="bg-black/90 backdrop-blur-xl rounded-xl p-3 flex flex-col items-center gap-2">
                        <span className="text-xs text-white/60 font-mono">{Math.round(volume * 100)}%</span>
                        <div
                          ref={volumeSliderRef}
                          onMouseDown={onVolumeDragStart}
                          onClick={onVolumeChange}
                          className="relative w-28 h-1.5 bg-white/20 rounded-full cursor-pointer"
                        >
                          <div
                            className="absolute top-0 left-0 h-full bg-vn-accent rounded-full pointer-events-none"
                            style={{ width: `${volume * 100}%` }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none"
                            style={{ left: `calc(${volume * 100}% - 6px)` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleMute}
                  className="p-2 rounded-xl hover:bg-white/10 transition-all pointer-events-auto"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </motion.button>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onShowSubtitleMenu}
                  className={`p-2 rounded-xl transition-all ${showSubtitleMenu ? 'bg-vn-accent' : 'hover:bg-white/10'}`}
                  aria-label="Subtitle settings"
                >
                  <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.button>
              </div>

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onShowSettings}
                  className="p-2 rounded-xl hover:bg-white/10 transition-all text-xs sm:text-sm font-medium"
                  aria-label="Playback speed"
                >
                  {playbackSpeed}x
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleAutoplay}
                className={`p-2 rounded-xl transition-all ${autoplay ? 'bg-vn-accent' : 'hover:bg-white/10'}`}
                aria-label="Toggle autoplay"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleCinemaMode}
                className={`p-2 rounded-xl transition-all ${cinemaMode ? 'bg-vn-accent' : 'hover:bg-white/10'}`}
                aria-label="Toggle cinema mode"
              >
                {cinemaMode ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onTogglePiP}
                className="p-2 rounded-xl hover:bg-white/10 transition-all hidden sm:flex"
                aria-label="Picture in picture"
              >
                <PictureInPicture className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleFullscreen}
                className="p-2 rounded-xl hover:bg-white/10 transition-all"
                aria-label="Toggle fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
