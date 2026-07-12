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
  isPortrait: boolean
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
  onProgressTouchStart: (e: React.TouchEvent) => void
  onProgressTouchMove: (e: React.TouchEvent) => void
  onProgressTouchEnd: () => void
  onVolumeChange: (e: React.MouseEvent) => void
  onVolumeDragStart: (e: React.MouseEvent) => void
  onShowVolumeSlider: () => void
  onHideVolumeSlider: () => void
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
  isPortrait,
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
  onProgressTouchStart,
  onProgressTouchMove,
  onProgressTouchEnd,
  onVolumeChange,
  onVolumeDragStart,
  onShowVolumeSlider,
  onHideVolumeSlider,
  onMouseMove,
  formatTime,
}: DesktopControlsProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

  const p = isPortrait

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
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-auto ${p ? 'h-20' : 'h-32'}`} />

      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 pointer-events-auto ${p ? 'p-2' : 'p-4 sm:p-6'}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className={`rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/20 
                       transition-all duration-300 hover:scale-105 active:scale-95 ${p ? 'p-2' : 'p-3'}`}
            aria-label="Go back"
          >
            <ChevronLeft className={p ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} />
          </button>

          <h2 className={`font-heading font-semibold truncate px-4 ${p ? 'text-xs max-w-[55%]' : 'text-sm sm:text-lg max-w-xs sm:max-w-2xl'}`}>
            {videoFilename.replace(/\.[^/.]+$/, '').replace(/\./g, ' ')}
          </h2>

          <div className={p ? 'w-8' : 'w-12'} />
        </div>
      </div>

      {/* Center play controls */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`flex items-center pointer-events-auto ${p ? 'gap-2' : 'gap-3 sm:gap-6'}`}>
          {hasPrev && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onPrevEpisode}
              className={`rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                         transition-all duration-200 ${p ? 'p-2' : 'p-3'}`}
              aria-label="Previous episode"
            >
              <ChevronLeft className={p ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onSkipBack}
            className={`rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                       transition-all duration-200 ${p ? 'p-2 hidden' : 'p-3 sm:p-4 hidden sm:flex'}`}
            aria-label="Skip back 10 seconds"
          >
            <SkipBack className={p ? 'w-5 h-5' : 'w-6 h-6 sm:w-8 sm:h-8'} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onTogglePlay}
            className={`rounded-full bg-vn-accent hover:bg-vn-hover 
                       transition-all duration-200 shadow-[0_0_30px_rgba(217,4,41,0.4)] ${p ? 'p-4' : 'p-5 sm:p-6'}`}
            aria-label={playerState === 'playing' ? 'Pause' : 'Play'}
          >
            {playerState === 'playing' ? (
              <Pause className={p ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} />
            ) : (
              <Play className={`${p ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10'} ml-0.5`} />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onSkipForward}
            className={`rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                       transition-all duration-200 ${p ? 'p-2 hidden' : 'p-3 sm:p-4 hidden sm:flex'}`}
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className={p ? 'w-5 h-5' : 'w-6 h-6 sm:w-8 sm:h-8'} />
          </motion.button>

          {hasNext && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onNextEpisode}
              className={`rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                         transition-all duration-200 ${p ? 'p-2' : 'p-3'}`}
              aria-label="Next episode"
            >
              <ChevronRight className={p ? 'w-5 h-5' : 'w-6 h-6 sm:w-7 sm:h-7'} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto ${p ? 'h-28' : 'h-40'}`} />

      {/* Bottom controls */}
      <div className={`absolute bottom-0 left-0 right-0 pointer-events-auto ${p ? 'p-2' : 'p-4 sm:p-6'}`}>
        <div className="max-w-6xl mx-auto space-y-2 sm:space-y-3">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className={`relative bg-white/20 rounded-full cursor-pointer group ${p ? 'h-3' : 'h-1.5 sm:h-2'}`}
            onClick={onProgressClick}
            onMouseMove={onProgressHover}
            onMouseLeave={onProgressLeave}
            onMouseDown={onProgressDragStart}
            onTouchStart={onProgressTouchStart}
            onTouchMove={onProgressTouchMove}
            onTouchEnd={onProgressTouchEnd}
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
              className={`absolute bg-vn-accent rounded-full -translate-y-1/2 top-1/2 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         shadow-[0_0_10px_rgba(217,4,41,0.8)] ${p ? 'w-5 h-5' : 'w-4 h-4'}`}
              style={{ 
                left: `calc(${isDragging ? (dragTime / duration) * 100 : progressPercent}% - ${p ? '10px' : '8px'})` 
              }}
            />
            <AnimatePresence>
              {showHoverTime && !p && (
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
            <div className={`flex items-center ${p ? 'gap-1' : 'gap-2 sm:gap-3'}`}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onTogglePlay}
                className={`rounded-xl hover:bg-white/10 transition-all ${p ? 'p-1.5' : 'p-2'}`}
                aria-label={playerState === 'playing' ? 'Pause' : 'Play'}
              >
                {playerState === 'playing' ? (
                  <Pause className={p ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} />
                ) : (
                  <Play className={`${p ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'} ml-0.5`} />
                )}
              </motion.button>

              <span className={`font-mono text-white/80 ${p ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>
                {formatTime(isDragging ? dragTime : currentTime)} / {formatTime(duration)}
              </span>

              <div
                className="relative flex items-center"
                onMouseEnter={onShowVolumeSlider}
                onMouseLeave={onHideVolumeSlider}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleMute}
                  className={`rounded-xl hover:bg-white/10 transition-all pointer-events-auto ${p ? 'p-1.5' : 'p-2'}`}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className={p ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
                  ) : (
                    <Volume2 className={p ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
                  )}
                </motion.button>
                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden pointer-events-auto"
                    >
                      <div className="flex items-center gap-2 pl-1">
                        <div
                          ref={volumeSliderRef}
                          onMouseDown={onVolumeDragStart}
                          onClick={onVolumeChange}
                          className={`relative rounded-full cursor-pointer group/vol ${p ? 'w-20 h-1.5' : 'w-28 sm:w-36 h-1.5 sm:h-2'}`}
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                        >
                          <div
                            className="absolute top-0 left-0 h-full bg-vn-accent rounded-full pointer-events-none transition-all duration-75"
                            style={{ width: `${volume * 100}%` }}
                          />
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg pointer-events-none
                                       opacity-0 group-hover/vol:opacity-100 transition-opacity duration-200
                                       shadow-[0_0_8px_rgba(255,255,255,0.3)] ${p ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'}`}
                            style={{ left: `calc(${volume * 100}% - ${p ? '7px' : '7px'})` }}
                          />
                        </div>
                        <span className={`font-mono text-white/60 tabular-nums ${p ? 'text-[9px] w-7' : 'text-[10px] w-8'}`}>
                          {Math.round(volume * 100)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className={`flex items-center ${p ? 'gap-0.5' : 'gap-1 sm:gap-2'}`}>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onShowSubtitleMenu}
                  className={`rounded-xl transition-all ${showSubtitleMenu ? 'bg-vn-accent' : 'hover:bg-white/10'} ${p ? 'p-1.5' : 'p-2'}`}
                  aria-label="Subtitle settings"
                >
                  <SettingsIcon className={p ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
                </motion.button>
              </div>

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onShowSettings}
                  className={`rounded-xl hover:bg-white/10 transition-all ${p ? 'p-1.5 text-[10px]' : 'p-2 text-xs sm:text-sm'} font-medium`}
                  aria-label="Playback speed"
                >
                  {playbackSpeed}x
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleAutoplay}
                className={`rounded-xl transition-all ${autoplay ? 'bg-vn-accent' : 'hover:bg-white/10'} ${p ? 'p-1.5' : 'p-2'}`}
                aria-label="Toggle autoplay"
              >
                <ChevronRight className={p ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
              </motion.button>

              {!p && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onToggleCinemaMode}
                  className={`p-2 rounded-xl transition-all ${cinemaMode ? 'bg-vn-accent' : 'hover:bg-white/10'}`}
                  aria-label="Toggle cinema mode"
                >
                  {cinemaMode ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
                </motion.button>
              )}

              {!p && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onTogglePiP}
                  className="p-2 rounded-xl hover:bg-white/10 transition-all hidden sm:flex"
                  aria-label="Picture in picture"
                >
                  <PictureInPicture className="w-5 h-5" />
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleFullscreen}
                className={`rounded-xl hover:bg-white/10 transition-all ${p ? 'p-1.5' : 'p-2'}`}
                aria-label="Toggle fullscreen"
              >
                {isFullscreen ? (
                  <Minimize className={p ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
                ) : (
                  <Maximize className={p ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5'} />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
