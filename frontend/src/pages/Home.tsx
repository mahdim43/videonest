import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { videosApi, historyApi, favoritesApi, foldersApi } from '../api/client'
import { useProfileStore } from '../stores/profileStore'
import { motion } from 'framer-motion'
import { Play, Heart, Folder, Search, Settings, Clock, Film, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Home() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentProfile, setCurrentProfile } = useProfileStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (!currentProfile && profileId) {
      setCurrentProfile({ id: parseInt(profileId), name: '', avatar: null, created_at: '' })
    }
  }, [profileId, currentProfile, setCurrentProfile])

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
  const recentlyAdded = [...videos].sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="min-h-screen bg-vn-bg">
      <header className="sticky top-0 z-50 bg-vn-bg/80 backdrop-blur-xl border-b border-vn-panel">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold">
            Video<span className="text-vn-accent">Nest</span>
          </h1>

          <div className="flex items-center gap-4">
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

            <button
              onClick={() => navigate(`/settings/${profileId}`)}
              className="p-2 rounded-xl hover:bg-vn-panel transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {continueWatching.length > 0 && (
          <section>
            <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-vn-accent" />
              Continue Watching
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {continueWatching.map((item: any) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/watch/${item.video_id}`)}
                  className="bg-vn-card rounded-xl p-4 text-left hover:bg-vn-panel 
                             transition-colors group"
                >
                  <div className="aspect-video bg-vn-panel rounded-lg mb-3 flex items-center 
                                  justify-center overflow-hidden">
                    <Play className="w-8 h-8 text-vn-text-secondary group-hover:text-vn-accent" />
                  </div>
                  <p className="text-sm text-vn-text truncate">{item.video?.filename}</p>
                  <div className="mt-2 h-1 bg-vn-panel rounded-full overflow-hidden">
                    <div
                      className="h-full bg-vn-accent"
                      style={{ width: `${(item.position / item.duration) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-vn-text-secondary mt-1">
                    {Math.floor((item.duration - item.position) / 3600)}h {Math.floor(((item.duration - item.position) % 3600) / 60)}m left
                  </p>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {searchQuery ? (
          <section>
            <h2 className="text-xl font-heading font-semibold mb-4">
              Search Results for "{searchQuery}"
            </h2>
            <VideoGrid videos={videos} onPlay={(id) => navigate(`/watch/${id}`)} />
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
                <h2 className="text-xl font-heading font-semibold">
                  {selectedFolder ? 'Folder Videos' : 'Recently Added'}
                </h2>
              </div>
              <VideoGrid videos={recentlyAdded} onPlay={(id) => navigate(`/watch/${id}`)} />
              {recentlyAdded.length === 0 && folders.length > 0 && (
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
              {recentlyAdded.length === 0 && folders.length === 0 && (
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
              <section>
                <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-vn-accent" />
                  Favorites
                </h2>
                <VideoGrid
                  videos={favorites.map((f: any) => f.video).filter(Boolean)}
                  onPlay={(id) => navigate(`/watch/${id}`)}
                />
              </section>
            )}

            {folders.length > 0 && (
              <section>
                <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-vn-accent" />
                  Folders
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {folders.map((folder: any) => (
                    <motion.button
                      key={folder.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedFolder(selectedFolder === folder.id ? null : folder.id)
                        setSearchQuery('')
                      }}
                      className={`rounded-xl p-4 text-left transition-colors ${
                        selectedFolder === folder.id
                          ? 'bg-vn-accent/20 border-2 border-vn-accent'
                          : 'bg-vn-card hover:bg-vn-panel border-2 border-transparent'
                      }`}
                    >
                      <Folder className="w-8 h-8 text-vn-accent mb-2" />
                      <p className="text-sm text-vn-text truncate">{folder.name}</p>
                    </motion.button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function VideoGrid({ videos, onPlay }: { videos: any[]; onPlay: (id: number) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {videos.map((video: any) => (
        <motion.button
          key={video.id}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onPlay(video.id)}
          className="bg-vn-card rounded-xl overflow-hidden text-left hover:bg-vn-panel 
                     transition-all duration-200 group"
        >
          <div className="aspect-video bg-vn-panel flex items-center justify-center relative overflow-hidden">
            <Play className="w-10 h-10 text-vn-text-secondary group-hover:text-vn-accent 
                           group-hover:scale-110 transition-all duration-200" />
            {video.resolution && (
              <span className="absolute top-2 right-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white/80">
                {video.resolution}
              </span>
            )}
          </div>
          <div className="p-3">
            <p className="text-xs text-vn-text leading-tight line-clamp-2 group-hover:text-white transition-colors min-h-[2rem]">
              {video.filename.replace(/\.[^/.]+$/, '').replace(/\./g, ' ')}
            </p>
            {video.duration && (
              <p className="text-xs text-vn-text-secondary mt-1">
                {Math.floor(video.duration / 3600)}h {Math.floor((video.duration % 3600) / 60)}m
              </p>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  )
}
