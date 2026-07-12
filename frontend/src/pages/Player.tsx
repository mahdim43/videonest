import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { videosApi, historyApi, favoritesApi, subtitlePrefsApi } from '../api/client'
import { useProfileStore } from '../stores/profileStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, AlertCircle, ChevronLeft } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  DesktopControls,
  SubtitleOverlay,
  SubtitleMenu,
  SpeedMenu,
  GestureHint,
} from '../components/player'

type PlayerState = 'loading' | 'buffering' | 'playing' | 'paused' | 'error'

export default function Player() {
  const { videoId } = useParams<{ videoId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentProfile } = useProfileStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ambientCanvasRef = useRef<HTMLCanvasElement>(null)
  const progressBarElementRef = useRef<HTMLElement | null>(null)
  const dragTimeRef = useRef(0)
  const isMobile = useIsMobile()
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < window.innerHeight
  })

  const [playerState, setPlayerState] = useState<PlayerState>('loading')
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(false)
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
        if (tracks[i].language === `track${trackIndex}`) {
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

  const clearControlsTimeout = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
  }, [])

  const startControlsTimeout = useCallback((ms = 4000) => {
    clearControlsTimeout()
    controlsTimeout.current = setTimeout(() => {
      if (playerState === 'playing') setShowControls(false)
    }, ms)
  }, [playerState, clearControlsTimeout])

  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    startControlsTimeout(2000)
  }, [startControlsTimeout])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (!rect) return
    const pos = (e.clientX - rect.left) / rect.width
    seek(pos * duration)
  }, [duration, seek])

  const handleProgressHover = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (!rect) return
    const pos = (e.clientX - rect.left) / rect.width
    setHoverTime(pos * duration)
    setShowHoverTime(true)
  }, [duration])

  const handleProgressDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    progressBarElementRef.current = e.currentTarget as HTMLElement
    const rect = progressBarElementRef.current.getBoundingClientRect()
    if (!rect) return
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t = pos * duration
    setDragTime(t)
    dragTimeRef.current = t

    const onMove = (ev: MouseEvent) => {
      if (!progressBarElementRef.current) return
      const r = progressBarElementRef.current.getBoundingClientRect()
      const p = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width))
      const newT = p * duration
      setDragTime(newT)
      dragTimeRef.current = newT
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      seek(dragTimeRef.current)
      setIsDragging(false)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [duration, seek])

  const progressTouchDragging = useRef(false)

  const handleProgressTouchStart = useCallback((e: React.TouchEvent) => {
    progressTouchDragging.current = true
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (!rect) return
    const pos = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width))
    seek(pos * duration)
  }, [duration, seek])

  const handleProgressTouchMove = useCallback((e: React.TouchEvent) => {
    if (!progressTouchDragging.current) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (!rect) return
    const pos = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width))
    seek(pos * duration)
  }, [duration, seek])

  const handleProgressTouchEnd = useCallback(() => {
    progressTouchDragging.current = false
  }, [])

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

  const handleShowVolumeSlider = useCallback(() => setShowVolumeSlider(true), [])
  const handleHideVolumeSlider = useCallback(() => {
    setTimeout(() => setShowVolumeSlider(false), 300)
  }, [])

  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipAccumRef = useRef(0)
  const isTouchDeviceRef = useRef(false)
  const longPressFiredRef = useRef(false)
  const lastSingleTapTime = useRef(0)

  const handleOverlayTouch = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.vn-player-controls')) return
    if (e.touches.length > 1) return
    isTouchDeviceRef.current = true

    const now = Date.now()
    const screenWidth = window.innerWidth
    const x = e.touches[0].clientX

    const timeSinceLastTap = now - lastSingleTapTime.current

    if (timeSinceLastTap < 300 && lastSingleTapTime.current > 0) {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
      lastSingleTapTime.current = 0

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
      clearControlsTimeout()
      return
    }

    lastSingleTapTime.current = now

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => {
      if (!longPressFiredRef.current) {
        setShowControls(prev => {
          const next = !prev
          if (next) startControlsTimeout(4000)
          else clearControlsTimeout()
          return next
        })
      }
    }, 200)
  }, [skip, startControlsTimeout, clearControlsTimeout])

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

    longPressFiredRef.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFiredRef.current = true
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
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
      const delta = -dy / (window.innerHeight)
      const newBrightness = Math.max(0.1, Math.min(1, brightness + delta * 0.5))
      setBrightness(newBrightness)
      setShowBrightness(true)
    }

    if (startX > screenWidth * 0.7 && Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) {
      const delta = -dy / (window.innerHeight)
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
    longPressFiredRef.current = false

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
    const checkPortrait = () => setIsPortrait(window.innerHeight > window.innerWidth)
    checkPortrait()
    window.addEventListener('resize', checkPortrait)
    window.addEventListener('orientationchange', checkPortrait)
    return () => {
      window.removeEventListener('resize', checkPortrait)
      window.removeEventListener('orientationchange', checkPortrait)
    }
  }, [])

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
    if (!isMobile) {
      setShowControls(true)
      startControlsTimeout(3000)
    }
  }, [isMobile, startControlsTimeout])

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

  return (
    <div
      ref={containerRef}
      className="h-dvh w-full bg-black flex flex-col items-center justify-center relative select-none overflow-hidden"
      onMouseMove={!isMobile ? handleMouseMove : undefined}
      onMouseLeave={() => {
        if (!isMobile && playerState === 'playing') setShowControls(false)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={!isMobile ? handleWheel : undefined}
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

      {/* Video container - fits within viewport */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{ filter: `brightness(${brightness})` }}
      >
        <video
          ref={videoRef}
          src={videosApi.streamUrl(video.id)}
          className="max-w-full max-h-full w-auto h-auto object-contain"
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

        {/* Touch overlay - only catches taps, NOT on controls */}
        <div
          className="absolute inset-0"
          onClick={(e) => {
            if (isTouchDeviceRef.current) return
            if ((e.target as HTMLElement).closest('.vn-player-controls')) return
            setShowControls(prev => {
              const next = !prev
              if (next) startControlsTimeout(4000)
              else clearControlsTimeout()
              return next
            })
          }}
          onTouchStart={handleOverlayTouch}
        />

        <SubtitleOverlay
          activeCues={activeCues}
          showSubtitles={showSubtitles}
          prefs={localPrefs}
        />
      </div>

      {/* Loading / Buffering / Error states */}
      <AnimatePresence>
        {playerState === 'buffering' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
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
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40"
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
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-40"
          >
            <AlertCircle className="w-16 h-16 text-vn-accent mb-4" />
            <p className="text-vn-text text-lg font-medium mb-2">Unable to play video</p>
            <p className="text-vn-text-secondary text-sm">The file format may not be supported</p>
          </motion.div>
        )}
      </AnimatePresence>

      <GestureHint text={showGestureHint} />

      <AnimatePresence>
        {swipeSeekIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40"
          >
            <div className="flex flex-col items-center gap-2 bg-black/70 backdrop-blur-md rounded-xl p-2">
              <span className="text-xs text-yellow-400">☀</span>
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

      {/* Subtitle menu */}
      <AnimatePresence>
        {showSubtitleMenu && (
          <div className="absolute z-50 vn-player-controls" style={{ bottom: isMobile ? '180px' : '80px', right: isMobile ? '16px' : '48px' }}>
            <SubtitleMenu
              show={showSubtitleMenu}
              onClose={() => setShowSubtitleMenu(false)}
              subtitleTracks={subtitleTracks}
              activeSubtitle={activeSubtitle}
              localPrefs={localPrefs}
              onSelectTrack={(trackIndex) => {
                if (trackIndex === null) {
                  setActiveSubtitle(null)
                  setShowSubtitles(false)
                  showNotification('Subtitles Off')
                } else {
                  setActiveSubtitle(trackIndex)
                  setShowSubtitles(true)
                  const track = subtitleTracks.find((t: any) => t.index === trackIndex)
                  showNotification(`Subtitles: ${track?.title || track?.language || 'Track ' + trackIndex}`)
                }
              }}
              onUpdatePrefs={(data) => {
                const next = { ...localPrefs, ...data }
                setLocalPrefs(next)
                updateSubtitlePrefsMutation.mutate(data)
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ALL CONTROLS are in one z-50 layer ABOVE the touch overlay */}
      {showControls && playerState !== 'loading' && playerState !== 'error' && (
        <div className="absolute inset-0 z-50 vn-player-controls pointer-events-none">
          {/* Bottom controls - always DesktopControls */}
          <DesktopControls
            playerState={playerState}
            currentTime={currentTime}
            duration={duration}
            buffered={buffered}
            volume={volume}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            playbackSpeed={playbackSpeed}
            showSubtitleMenu={showSubtitleMenu}
            showSettings={showSettings}
            showVolumeSlider={showVolumeSlider}
            showHoverTime={showHoverTime}
            hoverTime={hoverTime}
            isDragging={isDragging}
            dragTime={dragTime}
            autoplay={autoplay}
            cinemaMode={cinemaMode}
            hasPrev={!!neighbors?.prev}
            hasNext={!!neighbors?.next}
            videoFilename={video.filename}
            isPortrait={isPortrait && !isFullscreen}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onToggleFullscreen={toggleFullscreen}
            onTogglePiP={togglePiP}
            onToggleAutoplay={() => setAutoplay(a => !a)}
            onToggleCinemaMode={() => setCinemaMode(c => !c)}
            onSkipBack={() => skip(-10)}
            onSkipForward={() => skip(10)}
            onPrevEpisode={() => neighbors?.prev && navigate(`/watch/${neighbors.prev.id}`)}
            onNextEpisode={() => neighbors?.next && navigate(`/watch/${neighbors.next.id}`)}
            onShowSubtitleMenu={() => setShowSubtitleMenu(s => !s)}
            onShowSettings={() => setShowSettings(s => !s)}
            onProgressClick={handleProgressClick}
            onProgressHover={handleProgressHover}
            onProgressLeave={() => setShowHoverTime(false)}
            onProgressDragStart={handleProgressDragStart}
            onProgressTouchStart={handleProgressTouchStart}
            onProgressTouchMove={handleProgressTouchMove}
            onProgressTouchEnd={handleProgressTouchEnd}
            onVolumeChange={handleVolumeChange}
            onVolumeDragStart={handleVolumeDragStart}
            onShowVolumeSlider={handleShowVolumeSlider}
            onHideVolumeSlider={handleHideVolumeSlider}
            onMouseMove={handleMouseMove}
            formatTime={formatTime}
          />

          {/* Speed menu - shown on all devices when settings toggled */}
          {showSettings && (
            <div className={`absolute pointer-events-auto ${isPortrait && !isFullscreen ? 'bottom-28 left-4 right-4' : 'bottom-20 right-12 z-50'}`}>
              <SpeedMenu
                show={showSettings}
                playbackSpeed={playbackSpeed}
                onSelectSpeed={changeSpeed}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
