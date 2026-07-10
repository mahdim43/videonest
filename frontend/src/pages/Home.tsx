import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { videosApi, historyApi, favoritesApi, foldersApi } from '../api/client'
import { useProfileStore } from '../stores/profileStore'
import { motion } from 'framer-motion'
import { Play, Heart, Folder, Search, Settings, Clock, Film, Loader2, ArrowUpDown, ChevronDown, X, Download } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import MobileNav from '../components/MobileNav'
import { useIsMobile } from '../hooks/useIsMobile'

type SortMode = 'recent' | 'az' | 'za'

export default function Home() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentProfile, setCurrentProfile } = useProfileStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showInstallInstructions, setShowInstallInstructions] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const installedHandler = () => setIsInstalled(true)
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setIsInstalled(true)
      setDeferredPrompt(null)
    } else {
      setShowInstallInstructions(true)
    }
  }

  useEffect(() => {
    if (!currentProfile && profileId) {
      setCurrentProfile({ id: parseInt(profileId), name: '', avatar: null, created_at: '' })
    }
  }, [profileId, currentProfile, setCurrentProfile])

  useEffect(() => {
    if (showMobileSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showMobileSearch])

  const { data: history = [] } = useQuery({
    queryKey: ['history', profileId],
    queryFn: async () => {
      const res = await historyApi.get(parseInt(profileId!))
      return res.data
    },
    enabled: !!profileId,
  })

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', profileId],
    queryFn: async () => {
      const res = await favoritesApi.get(parseInt(profileId!))
      return res.data
    },
    enabled: !!profileId,
  })

  const { data: videos = [] } = useQuery({
    queryKey: ['videos', searchQuery, selectedFolder],
    queryFn: async () => {
      const res = await videosApi.getAll(searchQuery || undefined, selectedFolder || undefined)
      return res.data
    },
  })

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const res = await foldersApi.getAll()
      return res.data
    },
  })

  const scanMutation = useMutation({
    mutationFn: () => foldersApi.scan(),
    onMutate: () => setIsScanning(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      setIsScanning(false)
    },
    onError: () => setIsScanning(false),
  })

  const continueWatching = history.filter((h: any) => !h.completed && h.video).slice(0, 6)

  const watchedMap = new Map<number, number>()
  history.forEach((h: any) => {
    if (h.duration > 0) {
      watchedMap.set(h.video_id, Math.round((h.position / h.duration) * 100))
    }
  })

  const sortedVideos = [...videos].sort((a: any, b: any) => {
    switch (sortMode) {
      case 'az':
        return a.filename.localeCompare(b.filename)
      case 'za':
        return b.filename.localeCompare(a.filename)
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const sortLabels: Record<SortMode, string> = {
    recent: 'Recently Added',
    az: 'A → Z',
    za: 'Z → A',
  }

  const cycleSortMode = () => {
    setSortMode(prev => {
      if (prev === 'recent') return 'az'
      if (prev === 'az') return 'za'
      return 'recent'
    })
  }

  return (
    <div className="min-h-screen bg-vn-bg pb-20 md:pb-0">
      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-vn-bg">
          <div className="flex items-center gap-2 p-4 bg-vn-panel">
            <button
              onClick={() => {
                setShowMobileSearch(false)
                setSearchQuery('')
              }}
              className="p-2 rounded-xl hover:bg-vn-card transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedFolder(null)
              }}
              placeholder="Search videos..."
              className="flex-1 px-4 py-3 bg-vn-card rounded-xl text-vn-text
                         placeholder:text-vn-text-secondary outline-none focus:ring-2 
                         focus:ring-vn-accent transition-all text-lg"
            />
          </div>
          {searchQuery && (
            <div className="p-4">
              <VideoGrid videos={sortedVideos} onPlay={(id) => navigate(`/watch/${id}`)} watchedMap={watchedMap} />
            </div>
          )}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-vn-bg/80 backdrop-blur-xl border-b border-vn-panel">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-heading font-bold">
            Video<span className="text-vn-accent">Nest</span>
          </h1>

          <div className="flex items-center gap-2 sm:gap-4">
            {isMobile ? (
              <button
                onClick={() => setShowMobileSearch(true)}
                className="p-2 rounded-xl hover:bg-vn-panel transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vn-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedFolder(null)
                  }}
                  placeholder="Search videos..."
                  className="w-64 pl-10 pr-4 py-2 bg-vn-panel rounded-xl text-vn-text
                             placeholder:text-vn-text-secondary outline-none focus:ring-2 
                             focus:ring-vn-accent transition-all"
                />
              </div>
            )}

            {!isInstalled && (
              <button
                onClick={handleInstall}
                className="p-2 rounded-xl hover:bg-vn-panel transition-colors text-vn-accent"
                title="Install App"
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => navigate(`/settings/${profileId}`)}
              className="p-2 rounded-xl hover:bg-vn-panel transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-12">
        {continueWatching.length > 0 && (
          <section>
            <div className="bg-vn-card rounded-2xl p-4 sm:p-5 border border-vn-panel">
              <h2 className="text-base sm:text-lg font-heading font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-vn-accent" />
                Continue Watching
                <span className="text-xs text-vn-text-secondary font-normal ml-auto">
                  {continueWatching.length} {continueWatching.length === 1 ? 'video' : 'videos'}
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {continueWatching.map((item: any) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/watch/${item.video_id}`)}
                    className="bg-vn-panel rounded-xl p-3 text-left hover:bg-vn-bg 
                               transition-colors group"
                  >
                    <div className="aspect-video bg-vn-bg rounded-lg mb-2 flex items-center 
                                    justify-center overflow-hidden">
                      <Play className="w-7 h-7 text-vn-text-secondary group-hover:text-vn-accent" />
                    </div>
                    <p className="text-xs text-vn-text truncate mb-1.5">
                      {item.video?.filename?.replace(/\.[^/.]+$/, '').replace(/\./g, ' ')}
                    </p>
                    <div className="h-1 bg-vn-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-vn-accent"
                        style={{ width: `${(item.position / item.duration) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-vn-text-secondary mt-1">
                      {Math.round((item.position / item.duration) * 100)}% watched
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>
        )}

        {searchQuery && !showMobileSearch ? (
          <section>
            <h2 className="text-lg sm:text-xl font-heading font-semibold mb-4">
              Search Results for "{searchQuery}"
            </h2>
            <VideoGrid videos={sortedVideos} onPlay={(id) => navigate(`/watch/${id}`)} watchedMap={watchedMap} />
          </section>
        ) : (
          <>
            {selectedFolder && (
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-vn-accent hover:underline text-sm"
                >
                  All Videos
                </button>
                <span className="text-vn-text-secondary">/</span>
                <span className="text-vn-text text-sm">
                  {folders.find((f: any) => f.id === selectedFolder)?.name}
                </span>
              </div>
            )}

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-heading font-semibold">
                  {selectedFolder ? 'Folder Videos' : sortLabels[sortMode]}
                </h2>
                {!selectedFolder && (
                  <button
                    onClick={cycleSortMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vn-panel hover:bg-vn-card
                               text-sm text-vn-text-secondary hover:text-vn-text transition-colors"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">{sortLabels[sortMode]}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
              </div>
              <VideoGrid videos={sortedVideos} onPlay={(id) => navigate(`/watch/${id}`)} watchedMap={watchedMap} />
              {sortedVideos.length === 0 && folders.length > 0 && (
                <div className="text-center py-12">
                  <Film className="w-16 h-16 text-vn-text-secondary mx-auto mb-4" />
                  <p className="text-vn-text-secondary mb-4">No videos found</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => scanMutation.mutate()}
                    disabled={isScanning}
                    className="px-6 py-3 bg-vn-accent rounded-xl font-medium
                               hover:bg-vn-hover transition-colors flex items-center gap-2 mx-auto"
                  >
                    {isScanning ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <></>
                    )}
                    {isScanning ? 'Scanning...' : 'Scan Folders'}
                  </motion.button>
                </div>
              )}
              {sortedVideos.length === 0 && folders.length === 0 && (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-vn-text-secondary mx-auto mb-4" />
                  <p className="text-vn-text-secondary mb-4">No folders added yet</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/settings/${profileId}`)}
                    className="px-6 py-3 bg-vn-accent rounded-xl font-medium
                               hover:bg-vn-hover transition-colors"
                  >
                    Add Folder
                  </motion.button>
                </div>
              )}
            </section>

            {favorites.length > 0 && (
              <section id="favorites-section">
                <h2 className="text-lg sm:text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-vn-accent" />
                  Favorites
                </h2>
                <VideoGrid
                  videos={favorites.map((f: any) => f.video).filter(Boolean)}
                  onPlay={(id) => navigate(`/watch/${id}`)}
                  watchedMap={watchedMap}
                />
              </section>
            )}

            {folders.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-vn-accent" />
                  Folders
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {folders.map((folder: any) => (
                    <motion.button
                      key={folder.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedFolder(selectedFolder === folder.id ? null : folder.id)
                        setSearchQuery('')
                      }}
                      className={`rounded-xl p-3 sm:p-4 text-left transition-colors ${
                        selectedFolder === folder.id
                          ? 'bg-vn-accent/20 border-2 border-vn-accent'
                          : 'bg-vn-card hover:bg-vn-panel border-2 border-transparent'
                      }`}
                    >
                      <Folder className="w-6 h-6 sm:w-8 sm:h-8 text-vn-accent mb-2" />
                      <p className="text-xs sm:text-sm text-vn-text truncate">{folder.name}</p>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {showInstallInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowInstallInstructions(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-vn-panel border border-vn-card rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-heading font-semibold mb-3">Install VideoNest</h3>
            <div className="space-y-3 text-sm text-vn-text-secondary">
              <div className="flex items-start gap-3">
                <span className="font-bold text-vn-accent">1.</span>
                <p>Tap the <strong>Share</strong> button in your browser</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-vn-accent">2.</span>
                <p>Select <strong>"Add to Home Screen"</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="font-bold text-vn-accent">3.</span>
                <p>Tap <strong>"Add"</strong> to confirm</p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallInstructions(false)}
              className="w-full mt-5 px-4 py-2.5 bg-vn-accent hover:bg-vn-hover rounded-xl transition-colors font-medium"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}

      {isMobile && (
        <MobileNav
          onSearch={() => setShowMobileSearch(true)}
          onFavorites={() => {
            const el = document.getElementById('favorites-section')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
        />
      )}
    </div>
  )
}

function VideoGrid({ videos, onPlay, watchedMap }: { videos: any[]; onPlay: (id: number) => void; watchedMap: Map<number, number> }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {videos.map((video: any) => {
        const watched = watchedMap.get(video.id)
        return (
          <motion.button
            key={video.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onPlay(video.id)}
            className="bg-vn-card rounded-xl overflow-hidden text-left hover:bg-vn-panel 
                       transition-all duration-200 group"
          >
            <div className="aspect-video bg-vn-panel flex items-center justify-center relative overflow-hidden">
              {video.thumbnail_path ? (
                <img
                  src={`/api/videos/${video.id}/thumbnail`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-vn-text-secondary group-hover:text-vn-accent 
                               group-hover:scale-110 transition-all duration-200" />
              )}
              {video.resolution && (
                <span className="absolute top-2 right-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white/80">
                  {video.resolution}
                </span>
              )}
              {watched !== undefined && watched > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                  <div className="h-full bg-vn-accent" style={{ width: `${watched}%` }} />
                </div>
              )}
            </div>
            <div className="p-2 sm:p-3">
              <p className="text-xs text-vn-text leading-tight line-clamp-2 group-hover:text-white transition-colors min-h-[2rem]">
                {video.filename.replace(/\.[^/.]+$/, '').replace(/\./g, ' ')}
              </p>
              <div className="flex items-center justify-between mt-1">
                {video.duration && (
                  <p className="text-[10px] sm:text-xs text-vn-text-secondary">
                    {Math.floor(video.duration / 3600)}h {Math.floor((video.duration % 3600) / 60)}m
                  </p>
                )}
                {watched !== undefined && watched > 0 && (
                  <p className="text-[10px] text-vn-accent font-medium">{watched}%</p>
                )}
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
