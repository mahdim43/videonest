import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { foldersApi } from '../api/client'
import { motion } from 'framer-motion'
import { ArrowLeft, FolderPlus, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function Settings() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderPath, setNewFolderPath] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const res = await foldersApi.getAll()
      return res.data
    },
  })

  const addFolderMutation = useMutation({
    mutationFn: (data: { path: string; name: string }) => {
      return foldersApi.add(data.path, data.name)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      setNewFolderName('')
      setNewFolderPath('')
    },
  })

  const removeFolderMutation = useMutation({
    mutationFn: (id: number) => foldersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
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

  const handleAddFolder = () => {
    if (newFolderName.trim() && newFolderPath.trim()) {
      addFolderMutation.mutate({
        path: newFolderPath.trim(),
        name: newFolderName.trim(),
      })
    }
  }

  return (
    <div className="min-h-screen bg-vn-bg safe-area-inset">
      <header className="sticky top-0 z-50 bg-vn-bg/80 backdrop-blur-xl border-b border-vn-panel">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(`/home/${profileId}`)}
            className="p-2 rounded-xl hover:bg-vn-panel transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-heading font-semibold">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vn-panel rounded-2xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-heading font-semibold">Folders</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scanMutation.mutate()}
              disabled={isScanning || folders.length === 0}
              className="px-3 py-1.5 bg-vn-card rounded-lg text-sm font-medium
                         hover:bg-vn-accent transition-colors disabled:opacity-50
                         flex items-center gap-2"
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Rescan</span>
            </motion.button>
          </div>
          
          <div className="space-y-3 mb-4">
            {folders.map((folder: any) => (
              <div
                key={folder.id}
                className="flex items-center justify-between p-3 bg-vn-card rounded-xl"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-vn-text font-medium">{folder.name}</p>
                  <p className="text-xs sm:text-sm text-vn-text-secondary truncate">
                    {folder.path}
                  </p>
                </div>
                <button
                  onClick={() => removeFolderMutation.mutate(folder.id)}
                  className="p-2 rounded-lg hover:bg-vn-panel transition-colors text-vn-text-secondary
                             hover:text-vn-accent shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {folders.length === 0 && (
              <p className="text-vn-text-secondary text-sm text-center py-4">
                No folders added yet. Add a folder to start watching.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Name (e.g. Movies)"
              className="flex-1 px-4 py-3 sm:py-2 bg-vn-card rounded-xl text-vn-text
                         placeholder:text-vn-text-secondary outline-none focus:ring-2 
                         focus:ring-vn-accent"
            />
            <input
              type="text"
              value={newFolderPath}
              onChange={(e) => setNewFolderPath(e.target.value)}
              placeholder="C:\Videos\Movies"
              className="flex-1 px-4 py-3 sm:py-2 bg-vn-card rounded-xl text-vn-text
                         placeholder:text-vn-text-secondary outline-none focus:ring-2 
                         focus:ring-vn-accent"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddFolder}
              disabled={!newFolderName.trim() || !newFolderPath.trim()}
              className="px-4 py-3 sm:py-2 bg-vn-accent rounded-xl font-medium
                         hover:bg-vn-hover transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Add
            </motion.button>
          </div>
        </motion.section>
      </main>
    </div>
  )
}
