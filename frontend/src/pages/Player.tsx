import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { videosApi, historyApi, favoritesApi } from '../api/client'
import { useProfileStore } from '../stores/profileStore'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import {
  ArrowLeft, Heart, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, PictureInPicture, Camera,
  Subtitles, ChevronLeft, ChevronRight, Loader2, AlertCircle
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'

type PlayerState = 'loading' | 'buffering' | 'playing' | 'paused' | 'error'

export default function Player() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentProfile } = useProfileStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [playerState, setPlayerState] = useState<PlayerState>('loading')
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(false)
  const [activeSubtitle, setActiveSubtitle] = useState<number | null>(null)
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [showGestureHint, setShowGestureHint] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [hoverTime, setHoverTime] = useState(0)
  const [showHoverTime, setShowHoverTime] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  const [showAutoplayOverlay, setShowAutoplayOverlay] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(3)

  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTapTime = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressX = useMotionValue(0)

  const { data: video } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      const res = await videosApi.get(parseInt(videoId!))
      return res.data
    },
    enabled: !!videoId,
  })

  const { data: subtitleTracks = [] } = useQuery({
    queryKey: ['subtitles', videoId],
    queryFn: async () => {
      const res = await videosApi.getSubtitles(parseInt(videoId!))
      return res.data
    },
    enabled: !!videoId,
  })

  const { data: history } = useQuery({
    queryKey: ['videoHistory', videoId, currentProfile?.id],
    queryFn: async () => {
      if (!currentProfile) return null
      const res = await historyApi.get(currentProfile.id)
      return res.data.find((h: any) => h.video_id === parseInt(videoId!))
    },
    enabled: !!videoId && !!currentProfile,
  })

  const { data: isFavorite = false } = useQuery({
    queryKey: ['isFavorite', videoId, currentProfile?.id],
    queryFn: async () => {
      if (!currentProfile) return false
      const res = await favoritesApi.get(currentProfile.id)
      return res.data.some((f: any) => f.video_id === parseInt(videoId!))
    },
    enabled: !!videoId && !!currentProfile,
  })

  const updateHistoryMutation = useMutation({
    mutationFn: (data: { position: number; duration: number }) => {
      if (!currentProfile) throw new Error('No profile')
      return historyApi.update(currentProfile.id, {
        video_id: parseInt(videoId!),
        ...data,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: () => {
      if (!currentProfile) throw new Error('No profile')
      return isFavorite
        ? favoritesApi.remove(currentProfile.id, parseInt(videoId!))
        : favoritesApi.add(currentProfile.id, parseInt(videoId!))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFavorite'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlayerState('playing')
    } else {
      video.pause()
      setPlayerState('paused')
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }, [])

  const seek = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(time, duration))
  }, [duration])

  const skip = useCallback((seconds: number) => {
    seek(currentTime + seconds)
    setShowGestureHint(seconds > 0 ? `+${seconds}s` : `${seconds}s`)
    setTimeout(() => setShowGestureHint(''), 600)
  }, [currentTime, seek])

  const changeSpeed = useCallback((speed: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = speed
    setPlaybackSpeed(speed)
    setShowSettings(false)
  }, [])

  const togglePiP = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture()
      }
    } catch (err) {
      console.error('PiP failed:', err)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video || isDragging) return
    setCurrentTime(video.currentTime)
    if (video.currentTime > 0 && video.duration > 0) {
      updateHistoryMutation.mutate({
        position: video.currentTime,
        duration: video.duration,
      })
    }
  }, [isDragging, updateHistoryMutation])

  const handleProgress = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.buffered.length) return
    const bufferedEnd = video.buffered.end(video.buffered.length - 1)
    setBuffered(bufferedEnd)
  }, [])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => {
      if (playerState === 'playing') setShowControls(false)
    }, 2000)
  }, [playerState])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return
    const pos = (e.clientX - rect.left) / rect.width
    seek(pos * duration)
  }, [duration, seek])

  const handleProgressHover = useCallback((e: React.MouseEvent) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return
    const pos = (e.clientX - rect.left) / rect.width
    setHoverTime(pos * duration)
    setShowHoverTime(true)
  }, [duration])

  const handleProgressDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return
    const pos = (e.clientX - rect.left) / rect.width
    setDragTime(pos * duration)
  }, [duration])

  const handleProgressDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const rect = progressRef.current?.getBoundingClientRect()
    if (!rect) return
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setDragTime(pos * duration)
  }, [isDragging, duration])

  const handleProgressDragEnd = useCallback(() => {
    if (isDragging) {
      seek(dragTime)
      setIsDragging(false)
    }
  }, [isDragging, dragTime, seek])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault()
        togglePlay()
        break
      case 'ArrowLeft':
        e.preventDefault()
        skip(-5)
        break
      case 'ArrowRight':
        e.preventDefault()
        skip(5)
        break
      case 'ArrowUp':
        e.preventDefault()
        setVolume(v => {
          const newV = Math.min(1, v + 0.1)
          if (videoRef.current) videoRef.current.volume = newV
          return newV
        })
        break
      case 'ArrowDown':
        e.preventDefault()
        setVolume(v => {
          const newV = Math.max(0, v - 0.1)
          if (videoRef.current) videoRef.current.volume = newV
          return newV
        })
        break
      case 'f':
        e.preventDefault()
        toggleFullscreen()
        break
      case 'm':
        e.preventDefault()
        toggleMute()
        break
      case 'p':
        e.preventDefault()
        togglePiP()
        break
      case 'c':
        e.preventDefault()
        setShowSubtitles(s => !s)
        break
    }
  }, [togglePlay, skip, toggleFullscreen, toggleMute, togglePiP])

  const handleVolumeChange = useCallback((e: React.MouseEvent) => {
    const slider = e.currentTarget
    const rect = slider.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (videoRef.current) {
      videoRef.current.volume = pos
      videoRef.current.muted = false
    }
    setVolume(pos)
    setIsMuted(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setVolume(v => {
      const newV = Math.max(0, Math.min(1, v + delta))
      if (videoRef.current) videoRef.current.volume = newV
      return newV
    })
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !history) return
    if (history.position > 0 && history.duration > 0) {
      const percent = (history.position / history.duration) * 100
      if (percent < 95) {
        video.currentTime = history.position
      }
    }
  }, [history])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
      if (autoplayTimer.current) clearInterval(autoplayTimer.current)
    }
  }, [])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const screenWidth = window.innerWidth
    const x = touch.clientX

    longPressTimer.current = setTimeout(() => {
      if (videoRef.current) videoRef.current.playbackRate = 2
      setShowGestureHint('2x Speed')
    }, 500)

    const now = Date.now()
    const timeSinceLastTap = now - lastTapTime.current

    if (timeSinceLastTap < 300) {
      if (x < screenWidth * 0.3) {
        skip(-5)
        setShowGestureHint('-5s')
      } else if (x > screenWidth * 0.7) {
        skip(5)
        setShowGestureHint('+5s')
      }
      setTimeout(() => setShowGestureHint(''), 600)
    }

    lastTapTime.current = now
  }, [skip])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (videoRef.current?.playbackRate === 2) {
      videoRef.current.playbackRate = playbackSpeed
      setShowGestureHint('')
    }
  }, [playbackSpeed])

  if (!video) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-vn-accent border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const progressPercent = (currentTime / duration) * 100
  const bufferedPercent = (buffered / duration) * 100

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-black relative select-none overflow-hidden cursor-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (playerState === 'playing') setShowControls(false)
      }}
      onDoubleClick={(e) => {
        if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'VIDEO') {
          toggleFullscreen()
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video
        ref={videoRef}
        src={videosApi.streamUrl(video.id)}
        className="w-full h-screen object-contain"
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration)
          setPlayerState('paused')
        }}
        onWaiting={() => setPlayerState('buffering')}
        onPlaying={() => setPlayerState('playing')}
        onPlay={() => setPlayerState('playing')}
        onPause={() => setPlayerState('paused')}
        onError={() => setPlayerState('error')}
        onClick={togglePlay}
        playsInline
      >
        {activeSubtitle !== null && (
          <track
            kind="subtitles"
            src={videosApi.subtitleUrl(video.id, activeSubtitle)}
            srcLang="en"
            default
          />
        )}
      </video>

      {/* Buffering State */}
      <AnimatePresence>
        {playerState === 'buffering' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border-4 border-vn-accent border-t-transparent"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {playerState === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full border-4 border-vn-accent border-t-transparent mb-4"
            />
            <p className="text-vn-text-secondary text-sm">Loading video...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {playerState === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
          >
            <AlertCircle className="w-16 h-16 text-vn-accent mb-4" />
            <p className="text-vn-text text-lg font-medium mb-2">Unable to play video</p>
            <p className="text-vn-text-secondary text-sm">The file format may not be supported</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Hint */}
      <AnimatePresence>
        {showGestureHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/80 backdrop-blur-md px-8 py-4 rounded-2xl">
              <span className="text-4xl font-bold text-white">{showGestureHint}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitle Display */}
      <AnimatePresence>
        {showSubtitles && activeSubtitle !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-40"
          >
            <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-xl">
              <p className="text-sm text-white/90 font-medium">
                Subtitle Track {activeSubtitle} Active
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitle Track Menu */}
      <AnimatePresence>
        {showSubtitleMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 right-20 z-50"
          >
            <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-3 min-w-[200px] shadow-2xl">
              <p className="text-[10px] text-white/50 mb-2 uppercase tracking-wider">Subtitles</p>
              <button
                onClick={() => { setActiveSubtitle(null); setShowSubtitleMenu(false); setShowSubtitles(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  activeSubtitle === null ? 'bg-vn-accent text-white' : 'hover:bg-white/10 text-white/80'
                }`}
              >
                Off
              </button>
              {subtitleTracks.map((track: any) => (
                <button
                  key={track.index}
                  onClick={() => { setActiveSubtitle(track.index); setShowSubtitleMenu(false); setShowSubtitles(true) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSubtitle === track.index ? 'bg-vn-accent text-white' : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  {track.title || track.language || `Track ${track.index}`}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && playerState !== 'loading' && playerState !== 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none z-30"
          >
            {/* Top Gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-auto" />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 pointer-events-auto">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between max-w-7xl mx-auto"
              >
                <button
                  onClick={() => navigate(-1)}
                  className="p-3 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/20 
                             transition-all duration-300 hover:scale-105 active:scale-95"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <h2 className="text-sm sm:text-lg font-heading font-semibold truncate max-w-xs sm:max-w-2xl px-4">
                  {video.filename.replace(/\.[^/.]+$/, '').replace(/\./g, ' ')}
                </h2>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFavoriteMutation.mutate()}
                    className="p-3 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all"
                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorite ? 'fill-vn-accent text-vn-accent drop-shadow-[0_0_8px_rgba(217,4,41,0.8)]' : ''}`} />
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Center Controls */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-4 sm:gap-6 pointer-events-auto">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => skip(-10)}
                  className="p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                             transition-all duration-200 hidden sm:flex"
                  aria-label="Skip back 10 seconds"
                >
                  <SkipBack className="w-6 h-6 sm:w-8 sm:h-8" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={togglePlay}
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
                  onClick={() => skip(10)}
                  className="p-3 sm:p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                             transition-all duration-200 hidden sm:flex"
                  aria-label="Skip forward 10 seconds"
                >
                  <SkipForward className="w-6 h-6 sm:w-8 sm:h-8" />
                </motion.button>
              </div>
            </div>

            {/* Bottom Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto" />

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pointer-events-auto">
              <div className="max-w-6xl mx-auto space-y-3">
                {/* Timeline */}
                <div
                  ref={progressRef}
                  className="relative h-1.5 sm:h-2 bg-white/20 rounded-full cursor-pointer group"
                  onClick={handleProgressClick}
                  onMouseMove={handleProgressHover}
                  onMouseLeave={() => setShowHoverTime(false)}
                  onMouseDown={handleProgressDragStart}
                  onMouseMoveCapture={handleProgressDrag}
                  onMouseUp={handleProgressDragEnd}
                >
                  {/* Buffered */}
                  <div
                    className="absolute h-full bg-white/30 rounded-full"
                    style={{ width: `${bufferedPercent}%` }}
                  />

                  {/* Progress */}
                  <motion.div
                    className="absolute h-full bg-vn-accent rounded-full"
                    style={{ width: `${isDragging ? (dragTime / duration) * 100 : progressPercent}%` }}
                    layout
                    transition={{ duration: 0.1 }}
                  />

                  {/* Thumb */}
                  <motion.div
                    className="absolute w-4 h-4 bg-vn-accent rounded-full -translate-y-1/2 top-1/2 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-200
                               shadow-[0_0_10px_rgba(217,4,41,0.8)]"
                    style={{ 
                      left: `calc(${isDragging ? (dragTime / duration) * 100 : progressPercent}% - 8px)` 
                    }}
                  />

                  {/* Hover Time Preview */}
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

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  {/* Left Controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePlay}
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
                      className="relative group/vol"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleMute}
                        className="p-2 rounded-xl hover:bg-white/10 transition-all"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : volume < 0.5 ? (
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </motion.button>
                      {showVolumeSlider && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/95 backdrop-blur-xl rounded-xl"
                        >
                          <div
                            className="relative w-24 h-32 bg-white/10 rounded-full cursor-pointer group/slider"
                            onClick={handleVolumeChange}
                          >
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-vn-accent rounded-full"
                              style={{ height: `${volume * 100}%` }}
                            />
                            <div
                              className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg
                                         transition-transform group-hover/slider:scale-125"
                              style={{ bottom: `calc(${volume * 100}% - 8px)` }}
                            />
                          </div>
                          <p className="text-[10px] text-white/50 text-center mt-2">{Math.round(volume * 100)}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Subtitles */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (subtitleTracks.length === 0) return
                          if (subtitleTracks.length === 1) {
                            if (activeSubtitle !== null) {
                              setActiveSubtitle(null)
                              setShowSubtitles(false)
                            } else {
                              setActiveSubtitle(subtitleTracks[0].index)
                              setShowSubtitles(true)
                            }
                          } else {
                            setShowSubtitleMenu(s => !s)
                          }
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          activeSubtitle !== null ? 'bg-vn-accent' : 'hover:bg-white/10'
                        } ${subtitleTracks.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        aria-label="Toggle subtitles"
                      >
                        <Subtitles className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.button>
                    </div>

                    {/* Speed */}
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-xl hover:bg-white/10 transition-all text-xs sm:text-sm font-medium"
                        aria-label="Playback speed"
                      >
                        {playbackSpeed}x
                      </motion.button>

                      <AnimatePresence>
                        {showSettings && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full right-0 mb-2 p-3 bg-black/95 backdrop-blur-xl 
                                       rounded-2xl min-w-[160px] shadow-2xl"
                          >
                            <p className="text-[10px] text-white/50 mb-2 uppercase tracking-wider">Speed</p>
                            <div className="grid grid-cols-3 gap-1">
                              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                                <motion.button
                                  key={speed}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => changeSpeed(speed)}
                                  className={`px-2 py-1.5 rounded-lg text-xs transition-all ${
                                    playbackSpeed === speed
                                      ? 'bg-vn-accent text-white'
                                      : 'bg-white/10 hover:bg-white/20'
                                  }`}
                                >
                                  {speed}x
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Autoplay */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAutoplay(a => !a)}
                      className={`p-2 rounded-xl transition-all ${autoplay ? 'bg-vn-accent' : 'hover:bg-white/10'}`}
                      aria-label="Toggle autoplay"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    {/* PiP */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePiP}
                      className="p-2 rounded-xl hover:bg-white/10 transition-all hidden sm:flex"
                      aria-label="Picture in picture"
                    >
                      <PictureInPicture className="w-5 h-5" />
                    </motion.button>

                    {/* Fullscreen */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleFullscreen}
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
        )}
      </AnimatePresence>
    </div>
  )
}
