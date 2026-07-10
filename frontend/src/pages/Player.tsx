import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { videosApi, historyApi, favoritesApi, subtitlePrefsApi } from '../api/client'
import { useProfileStore } from '../stores/profileStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Heart, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, PictureInPicture,
  Subtitles, ChevronRight, AlertCircle,
  ChevronLeft, Sun, Moon, Settings as SettingsIcon
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

  const ambientCanvasRef = useRef<HTMLCanvasElement>(null)

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
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [activeSubtitle, setActiveSubtitle] = useState<number | null>(null)
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false)
  const [localPrefs, setLocalPrefs] = useState<any>(null)
  const [activeCues, setActiveCues] = useState<string[]>([])

  const [subtitleNotification, setSubtitleNotification] = useState('')
  const [buffered, setBuffered] = useState(0)
  const [showGestureHint, setShowGestureHint] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [hoverTime, setHoverTime] = useState(0)
  const [showHoverTime, setShowHoverTime] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  const [showAutoplayCountdown, setShowAutoplayCountdown] = useState(false)
  const [autoplayCountdown, setAutoplayCountdown] = useState(5)
  const [cinemaMode, setCinemaMode] = useState(false)
  const [ambientColor, setAmbientColor] = useState('rgba(0,0,0,0.8)')
  const [brightness, setBrightness] = useState(1)
  const [showBrightness, setShowBrightness] = useState(false)
  const [swipeSeekIndicator, setSwipeSeekIndicator] = useState<{ direction: string; amount: number } | null>(null)

  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTapTime = useRef(0)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subtitleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notificationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoplayTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const ambientInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const pinchStartRef = useRef<number | null>(null)
  const volumeSliderRef = useRef<HTMLDivElement>(null)

  const { data: video } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => {
      const res = await videosApi.get(parseInt(videoId!))
      return res.data
    },
    enabled: !!videoId,
  })

  const { data: neighbors } = useQuery({
    queryKey: ['neighbors', videoId],
    queryFn: async () => {
      const res = await videosApi.getNeighbors(parseInt(videoId!))
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

  const { data: subtitlePrefs } = useQuery({
    queryKey: ['subtitlePrefs', currentProfile?.id],
    queryFn: async () => {
      if (!currentProfile) return null
      const storageKey = `vn_sub_prefs_${currentProfile.id}`
      const local = localStorage.getItem(storageKey)
      if (local) return JSON.parse(local)
      try {
        const res = await subtitlePrefsApi.get(currentProfile.id)
        localStorage.setItem(storageKey, JSON.stringify(res.data))
        return res.data
      } catch {
        return null
      }
    },
    enabled: !!currentProfile,
  })

  const updateSubtitlePrefsMutation = useMutation({
    mutationFn: (data: any) => {
      if (!currentProfile) throw new Error('No profile')
      const storageKey = `vn_sub_prefs_${currentProfile.id}`
      const existing = localStorage.getItem(storageKey)
      const merged = { ...(existing ? JSON.parse(existing) : {}), ...data }
      localStorage.setItem(storageKey, JSON.stringify(merged))
      return subtitlePrefsApi.update(currentProfile.id, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtitlePrefs'] }),
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

  const showNotification = useCallback((text: string) => {
    setSubtitleNotification(text)
    if (notificationTimeout.current) clearTimeout(notificationTimeout.current)
    notificationTimeout.current = setTimeout(() => setSubtitleNotification(''), 2000)
  }, [])

  const applySubtitleTrack = useCallback((trackIndex: number | null) => {
    const video = videoRef.current
    if (!video) return
    const tracks = video.textTracks
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden'
    }
    if (trackIndex !== null) {
      for (let i = 0; i < tracks.length; i++) {
        if (i === 0 || tracks[i].language === `track${trackIndex}`) {
          tracks[i].mode = 'hidden'
          const handler = () => {
            const active: string[] = []
            const cues = tracks[i].activeCues
            if (cues) {
              for (let j = 0; j < cues.length; j++) {
                active.push((cues[j] as VTTCue).text || '')
              }
            }
            setActiveCues(active)
          }
          const track = tracks[i]
          track.oncuechange = handler
          if (track.cues && track.cues.length > 0) {
            handler()
          } else {
            track.addEventListener('load', () => handler(), { once: true })
          }
          break
        }
      }
    } else {
      setActiveCues([])
    }
  }, [])

  useEffect(() => {
    if (activeSubtitle !== null) {
      applySubtitleTrack(activeSubtitle)
    } else {
      applySubtitleTrack(null)
    }
  }, [activeSubtitle, applySubtitleTrack])

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

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      try { await (screen.orientation as any).unlock?.() } catch {}
    } else {
      await container.requestFullscreen()
      try {
        if (screen.orientation?.lock) {
          await screen.orientation.lock('landscape')
        }
      } catch {}
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

  const updateAmbientColor = useCallback(() => {
    const video = videoRef.current
    const canvas = ambientCanvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 64
    canvas.height = 36
    ctx.drawImage(video, 0, 0, 64, 36)
    const data = ctx.getImageData(0, 0, 64, 36).data
    let r = 0, g = 0, b = 0, count = 0
    for (let i = 0; i < data.length; i += 16) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      count++
    }
    r = Math.floor(r / count * 0.3)
    g = Math.floor(g / count * 0.3)
    b = Math.floor(b / count * 0.3)
    setAmbientColor(`rgba(${r},${g},${b},0.6)`)
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
        if (subtitleTracks.length > 0) {
          if (activeSubtitle !== null) {
            setActiveSubtitle(null)
            setShowSubtitles(false)
            showNotification('Subtitles Off')
          } else {
            const firstTrack = subtitleTracks[0]
            setActiveSubtitle(firstTrack.index)
            setShowSubtitles(true)
            showNotification(`Subtitles: ${firstTrack.title || firstTrack.language || 'Track ' + firstTrack.index}`)
          }
        }
        break
      case 'Escape':
        if (showSubtitleMenu) {
          setShowSubtitleMenu(false)
          e.stopPropagation()
        }
        break
    }
  }, [togglePlay, skip, toggleFullscreen, toggleMute, togglePiP, subtitleTracks, activeSubtitle, showNotification, showSubtitleMenu])

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

  const handleVolumeDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const updateVol = (ev: MouseEvent) => {
      const el = volumeSliderRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const pos = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
      if (videoRef.current) {
        videoRef.current.volume = pos
        videoRef.current.muted = false
      }
      setVolume(pos)
      setIsMuted(false)
    }
    updateVol(e.nativeEvent)
    const onMove = (ev: MouseEvent) => updateVol(ev)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const tapCountRef = useRef(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipAccumRef = useRef(0)
  const touchHandledRef = useRef(false)

  const handleOverlayTouch = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.vn-controls')) return
    if (e.touches.length > 1) return
    touchHandledRef.current = true

    const now = Date.now()
    const timeSinceLastTap = now - lastTapTime.current
    const screenWidth = window.innerWidth
    const x = e.touches[0].clientX

    tapCountRef.current += 1

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)

    tapTimerRef.current = setTimeout(() => {
      if (tapCountRef.current === 1) {
        setShowControls(prev => !prev)
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
      }
      tapCountRef.current = 0
      skipAccumRef.current = 0
    }, 300)

    if (timeSinceLastTap < 300) {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
      tapCountRef.current = 0

      skipAccumRef.current += 5
      if (x < screenWidth * 0.3) {
        skip(-skipAccumRef.current)
        setShowGestureHint(`-${skipAccumRef.current}s`)
      } else if (x > screenWidth * 0.7) {
        skip(skipAccumRef.current)
        setShowGestureHint(`+${skipAccumRef.current}s`)
      }
      setTimeout(() => setShowGestureHint(''), 600)
      setShowControls(false)
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    }

    lastTapTime.current = now
  }, [skip])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setVolume(v => {
      const newV = Math.max(0, Math.min(1, v + delta))
      if (videoRef.current) videoRef.current.volume = newV
      return newV
    })
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchStartRef.current = Math.sqrt(dx * dx + dy * dy)
      return
    }

    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }

    longPressTimer.current = setTimeout(() => {
      if (videoRef.current) videoRef.current.playbackRate = 2
      setShowGestureHint('2x Speed')
    }, 500)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const scale = dist / pinchStartRef.current
      if (videoRef.current) {
        const newScale = Math.max(1, Math.min(3, scale))
        videoRef.current.style.transform = `scale(${newScale})`
        videoRef.current.style.transformOrigin = 'center center'
      }
      return
    }

    if (!touchStartRef.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    const screenWidth = window.innerWidth
    const startX = touchStartRef.current.x

    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      const seekAmount = (dx / screenWidth) * duration * 0.5
      const direction = dx > 0 ? '+' : '-'
      setSwipeSeekIndicator({ direction, amount: Math.abs(Math.round(seekAmount)) })
    }

    if (startX < screenWidth * 0.3 && Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) {
      const delta = -dy / (screenHeight())
      const newBrightness = Math.max(0.1, Math.min(1, brightness + delta * 0.5))
      setBrightness(newBrightness)
      setShowBrightness(true)
    }

    if (startX > screenWidth * 0.7 && Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) {
      const delta = -dy / (screenHeight())
      const newVolume = Math.max(0, Math.min(1, volume + delta * 0.5))
      if (videoRef.current) videoRef.current.volume = newVolume
      setVolume(newVolume)
    }
  }, [duration, brightness, volume])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    if (videoRef.current?.playbackRate === 2) {
      videoRef.current.playbackRate = playbackSpeed
      setShowGestureHint('')
    }

    if (swipeSeekIndicator) {
      const amount = swipeSeekIndicator.direction === '+' ? swipeSeekIndicator.amount : -swipeSeekIndicator.amount
      seek(currentTime + amount)
      setSwipeSeekIndicator(null)
    }

    touchStartRef.current = null
    pinchStartRef.current = null
    setShowBrightness(false)
  }, [playbackSpeed, swipeSeekIndicator, currentTime, seek])

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
      if (subtitleTimeout.current) clearTimeout(subtitleTimeout.current)
      if (notificationTimeout.current) clearTimeout(notificationTimeout.current)
      if (autoplayTimer.current) clearInterval(autoplayTimer.current)
      if (ambientInterval.current) clearInterval(ambientInterval.current)
    }
  }, [])

  useEffect(() => {
    if (subtitleTracks.length > 0 && activeSubtitle === null && showSubtitles) {
      const firstTrack = subtitleTracks[0]
      setActiveSubtitle(firstTrack.index)
      showNotification(`Subtitles: ${firstTrack.title || firstTrack.language || 'Track ' + firstTrack.index}`)
    }
  }, [subtitleTracks, activeSubtitle, showSubtitles, showNotification])

  useEffect(() => {
    if (subtitleNotification) {
      if (subtitleTimeout.current) clearTimeout(subtitleTimeout.current)
      subtitleTimeout.current = setTimeout(() => setSubtitleNotification(''), 2000)
    }
  }, [subtitleNotification])

  useEffect(() => {
    applySubtitleTrack(showSubtitles ? activeSubtitle : null)
  }, [showSubtitles, activeSubtitle, applySubtitleTrack])

  useEffect(() => {
    if (cinemaMode) {
      ambientInterval.current = setInterval(updateAmbientColor, 2000)
    } else {
      if (ambientInterval.current) clearInterval(ambientInterval.current)
    }
    return () => {
      if (ambientInterval.current) clearInterval(ambientInterval.current)
    }
  }, [cinemaMode, updateAmbientColor])

  useEffect(() => {
    if (showAutoplayCountdown && autoplay) {
      setAutoplayCountdown(5)
      autoplayTimer.current = setInterval(() => {
        setAutoplayCountdown(prev => {
          if (prev <= 1) {
            if (autoplayTimer.current) clearInterval(autoplayTimer.current)
            setShowAutoplayCountdown(false)
            if (neighbors?.next) {
              navigate(`/watch/${neighbors.next.id}`)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current)
    }
  }, [showAutoplayCountdown, autoplay, neighbors, navigate])

  useEffect(() => {
    const handleVideoEnd = () => {
      if (autoplay && neighbors?.next) {
        setShowAutoplayCountdown(true)
      }
    }
    const video = videoRef.current
    if (video) {
      video.addEventListener('ended', handleVideoEnd)
      return () => video.removeEventListener('ended', handleVideoEnd)
    }
  }, [autoplay, neighbors])

  useEffect(() => {
    if (subtitlePrefs) {
      setLocalPrefs(subtitlePrefs)
    }
  }, [subtitlePrefs])

  const screenHeight = () => window.innerHeight

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

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
      className={`min-h-screen bg-black relative select-none overflow-hidden ${cinemaMode ? 'cursor-default' : 'cursor-none'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (playerState === 'playing') setShowControls(false)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >

      <canvas ref={ambientCanvasRef} className="hidden" width={64} height={36} />

      {cinemaMode && (
        <div
          className="absolute inset-0 -m-20 transition-colors duration-2000"
          style={{
            background: `radial-gradient(ellipse at center, ${ambientColor} 0%, rgba(0,0,0,0.95) 70%)`,
            filter: 'blur(80px)',
            zIndex: 0,
          }}
        />
      )}

      <div
        className="relative z-10"
        style={{ filter: `brightness(${brightness})` }}
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
          playsInline
        >
          {subtitleTracks.map((track: any) => (
            <track
              key={`${video.id}-${track.index}`}
              kind="subtitles"
              src={videosApi.subtitleUrl(video.id, track.index)}
              srcLang={`track${track.index}`}
              label={track.title || track.language || `Track ${track.index}`}
            />
          ))}
        </video>

        <div
          className="absolute inset-0 z-15"
          onClick={(e) => {
            if (touchHandledRef.current) { touchHandledRef.current = false; return }
            if ((e.target as HTMLElement).closest('.vn-controls')) return
            setShowControls(prev => !prev)
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
          }}
          onTouchStart={handleOverlayTouch}
        />

        {activeCues.length > 0 && showSubtitles && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1"
            style={{ bottom: `${localPrefs?.position ?? 60}px` }}
          >
            {activeCues.map((text, i) => (
              <div
                key={i}
                className="px-3 py-1 rounded-md text-center max-w-[80%]"
                style={{
                  fontSize: `${localPrefs?.font_size || 24}px`,
                  color: localPrefs?.color || '#FFFFFF',
                  backgroundColor: (localPrefs?.background_opacity ?? 0.5) > 0
                    ? `rgba(0, 0, 0, ${localPrefs?.background_opacity ?? 0.5})`
                    : 'transparent',
                  textShadow: localPrefs?.outline
                    ? (() => {
                        const w = localPrefs?.outline_width || 2
                        const c = localPrefs?.outline_color || '#000000'
                        return `-${w}px -${w}px 0 ${c}, ${w}px -${w}px 0 ${c}, -${w}px ${w}px 0 ${c}, ${w}px ${w}px 0 ${c}`
                      })()
                    : localPrefs?.shadow
                      ? `${localPrefs?.shadow_offset || 2}px ${localPrefs?.shadow_offset || 2}px 2px ${localPrefs?.shadow_color || '#000000'}`
                      : 'none',
                  lineHeight: 1.4,
                }}
                dangerouslySetInnerHTML={{ __html: text }}
              />
            ))}
          </div>
        )}
      </div>

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

      <AnimatePresence>
        {swipeSeekIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="bg-black/80 backdrop-blur-md px-8 py-4 rounded-2xl">
              <span className="text-3xl font-bold text-white">
                {swipeSeekIndicator.direction}{swipeSeekIndicator.amount}s
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBrightness && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30"
          >
            <div className="flex flex-col items-center gap-2 bg-black/70 backdrop-blur-md rounded-xl p-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              <div className="w-1 h-24 bg-white/20 rounded-full relative">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-yellow-400 rounded-full"
                  style={{ height: `${brightness * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-white/60">{Math.round(brightness * 100)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {subtitleNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-40"
          >
            <div className="bg-black/80 backdrop-blur-md px-5 py-2.5 rounded-xl">
              <p className="text-sm text-white/90 font-medium">{subtitleNotification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAutoplayCountdown && neighbors?.next && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto"
          >
            <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-8 text-center max-w-sm">
              <p className="text-white/60 text-sm mb-2">Next Episode</p>
              <p className="text-white text-lg font-medium mb-4 truncate">
                {neighbors.next.filename.replace(/\.[^/.]+$/, '').replace(/\./g, ' ')}
              </p>
              <div className="relative mb-4">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-vn-accent"
                    animate={{ width: `${((5 - autoplayCountdown) / 5) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
                <p className="text-vn-accent text-2xl font-bold mt-2">{autoplayCountdown}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowAutoplayCountdown(false)
                    if (autoplayTimer.current) clearInterval(autoplayTimer.current)
                  }}
                  className="px-4 py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAutoplayCountdown(false)
                    if (autoplayTimer.current) clearInterval(autoplayTimer.current)
                    navigate(`/watch/${neighbors.next.id}`)
                  }}
                  className="px-4 py-2 bg-vn-accent rounded-xl text-sm hover:bg-vn-hover transition-colors"
                >
                  Play Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubtitleMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 right-12 z-50"
          >
            <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-4 w-64 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-white/80">Subtitles</p>
                <button
                  onClick={() => setShowSubtitleMenu(false)}
                  className="text-white/40 hover:text-white text-xs"
                >
                  Close
                </button>
              </div>

              {/* Track Selection */}
              <div className="space-y-1 mb-4">
                <button
                  onClick={() => {
                    setActiveSubtitle(null)
                    setShowSubtitles(false)
                    showNotification('Subtitles Off')
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSubtitle === null ? 'bg-vn-accent text-white' : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  Off
                </button>
                {subtitleTracks.map((track: any) => (
                  <button
                    key={track.index}
                    onClick={() => {
                      setActiveSubtitle(track.index)
                      setShowSubtitles(true)
                      showNotification(`Subtitles: ${track.title || track.language || 'Track ' + track.index}`)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      activeSubtitle === track.index ? 'bg-vn-accent text-white' : 'hover:bg-white/10 text-white/80'
                    }`}
                  >
                    {track.title || track.language || `Track ${track.index}`}
                  </button>
                ))}
                {subtitleTracks.length === 0 && (
                  <p className="text-xs text-white/40 px-3 py-2">No subtitles found</p>
                )}
              </div>

              <hr className="border-white/10 my-3" />

              {/* Appearance Settings */}
              <div className="space-y-4">
                {/* Font Size */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-white/50 uppercase tracking-wider">Font Size</label>
                    <span className="text-[10px] text-white/40">{localPrefs?.font_size || 24}px</span>
                  </div>
                  <input
                    type="range" min="12" max="48" step="2"
                    value={localPrefs?.font_size || 24}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      const next = { ...localPrefs, font_size: val }
                      setLocalPrefs(next)
                      updateSubtitlePrefsMutation.mutate({ font_size: val })
                    }}
                    className="w-full accent-vn-accent h-1"
                  />
                </div>

                {/* Background */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-white/50 uppercase tracking-wider">Background</label>
                    <button
                      onClick={() => {
                        const val = (localPrefs?.background_opacity ?? 0.5) > 0 ? 0 : 0.5
                        const next = { ...localPrefs, background_opacity: val }
                        setLocalPrefs(next)

                        updateSubtitlePrefsMutation.mutate({ background_opacity: val })
                      }}
                      className={`w-8 h-4 rounded-full transition-colors ${(localPrefs?.background_opacity ?? 0.5) > 0 ? 'bg-vn-accent' : 'bg-white/20'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${(localPrefs?.background_opacity ?? 0.5) > 0 ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {(localPrefs?.background_opacity ?? 0.5) > 0 && (
                    <input
                      type="range" min="0.1" max="1" step="0.1"
                      value={localPrefs?.background_opacity ?? 0.5}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        const next = { ...localPrefs, background_opacity: val }
                        setLocalPrefs(next)

                        updateSubtitlePrefsMutation.mutate({ background_opacity: val })
                      }}
                      className="w-full accent-vn-accent h-1"
                    />
                  )}
                </div>

                {/* Position from Bottom */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-white/50 uppercase tracking-wider">Position from Bottom</label>
                    <span className="text-[10px] text-white/40">{localPrefs?.position ?? 60}px</span>
                  </div>
                  <input
                    type="range" min="10" max="300" step="5"
                    value={localPrefs?.position ?? 60}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      const next = { ...localPrefs, position: val }
                      setLocalPrefs(next)
                      updateSubtitlePrefsMutation.mutate({ position: val })
                    }}
                    className="w-full accent-vn-accent h-1"
                  />
                </div>

                {/* Outline */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-white/50 uppercase tracking-wider">Outline</label>
                    <button
                      onClick={() => {
                        const val = !localPrefs?.outline
                        const next = { ...localPrefs, outline: val }
                        setLocalPrefs(next)

                        updateSubtitlePrefsMutation.mutate({ outline: val })
                      }}
                      className={`w-8 h-4 rounded-full transition-colors ${localPrefs?.outline ? 'bg-vn-accent' : 'bg-white/20'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${localPrefs?.outline ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {localPrefs?.outline && (
                    <input
                      type="range" min="1" max="4" step="1"
                      value={localPrefs?.outline_width || 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        const next = { ...localPrefs, outline_width: val }
                        setLocalPrefs(next)

                        updateSubtitlePrefsMutation.mutate({ outline_width: val })
                      }}
                      className="w-full accent-vn-accent h-1"
                    />
                  )}
                </div>

                {/* Shadow */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-white/50 uppercase tracking-wider">Shadow</label>
                    <button
                      onClick={() => {
                        const val = !localPrefs?.shadow
                        const next = { ...localPrefs, shadow: val }
                        setLocalPrefs(next)

                        updateSubtitlePrefsMutation.mutate({ shadow: val })
                      }}
                      className={`w-8 h-4 rounded-full transition-colors ${localPrefs?.shadow ? 'bg-vn-accent' : 'bg-white/20'}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${localPrefs?.shadow ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      </AnimatePresence>

      <AnimatePresence>
        {showControls && playerState !== 'loading' && playerState !== 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none z-30 vn-controls"
          >
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-auto" />

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

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-3 sm:gap-6 pointer-events-auto">
                {neighbors?.prev && (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => navigate(`/watch/${neighbors.prev.id}`)}
                    className="p-3 sm:p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                               transition-all duration-200"
                    aria-label="Previous episode"
                  >
                    <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                  </motion.button>
                )}

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

                {neighbors?.next && (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => navigate(`/watch/${neighbors.next.id}`)}
                    className="p-3 sm:p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 
                               transition-all duration-200"
                    aria-label="Next episode"
                  >
                    <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                  </motion.button>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto" />

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pointer-events-auto">
              <div className="max-w-6xl mx-auto space-y-3">
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

                <div className="flex items-center justify-between">
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
                      className="relative"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
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
                                onMouseDown={handleVolumeDragStart}
                                onClick={handleVolumeChange}
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
                        onClick={toggleMute}
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
                        onClick={() => {
                          setShowSubtitleMenu(s => !s)
                        }}
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

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAutoplay(a => !a)}
                      className={`p-2 rounded-xl transition-all ${autoplay ? 'bg-vn-accent' : 'hover:bg-white/10'}`}
                      aria-label="Toggle autoplay"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCinemaMode(c => !c)}
                      className={`p-2 rounded-xl transition-all ${cinemaMode ? 'bg-vn-accent' : 'hover:bg-white/10'}`}
                      aria-label="Toggle cinema mode"
                    >
                      {cinemaMode ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePiP}
                      className="p-2 rounded-xl hover:bg-white/10 transition-all hidden sm:flex"
                      aria-label="Picture in picture"
                    >
                      <PictureInPicture className="w-5 h-5" />
                    </motion.button>

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
