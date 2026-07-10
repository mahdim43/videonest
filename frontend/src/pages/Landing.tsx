import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profilesApi } from '../api/client'
import { useProfileStore } from '../stores/profileStore'
import { motion } from 'framer-motion'
import { Plus, User } from 'lucide-react'

export default function Landing() {
  const [newProfileName, setNewProfileName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setCurrentProfile = useProfileStore((s) => s.setCurrentProfile)

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const res = await profilesApi.getAll()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => profilesApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      setNewProfileName('')
      setShowInput(false)
    },
  })

  const handleSelect = (profile: typeof profiles[0]) => {
    setCurrentProfile(profile)
    navigate(`/home/${profile.id}`)
  }

  const handleCreate = () => {
    if (newProfileName.trim()) {
      createMutation.mutate(newProfileName.trim())
    }
  }

  return (
    <div className="min-h-screen bg-vn-bg flex items-center justify-center p-4 safe-area-inset">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center w-full max-w-md"
      >
        <motion.h1
          className="text-4xl sm:text-6xl font-heading font-bold mb-2 tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Video<span className="text-vn-accent">Nest</span>
        </motion.h1>
        <motion.p
          className="text-vn-text-secondary mb-8 sm:mb-12 text-base sm:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Choose Profile
        </motion.p>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 max-w-2xl mx-auto">
          {profiles.map((profile: any, i: number) => (
            <motion.button
              key={profile.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(profile)}
              className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-vn-panel 
                         hover:bg-vn-card transition-colors cursor-pointer group min-w-[100px]"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-vn-card flex items-center justify-center
                              group-hover:bg-vn-accent/20 transition-colors">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-vn-text-secondary group-hover:text-vn-accent" />
              </div>
              <span className="text-sm sm:text-vn-text font-medium">{profile.name}</span>
            </motion.button>
          ))}

          {showInput ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-vn-panel min-w-[100px]"
            >
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Name"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-vn-card text-center text-vn-text
                           outline-none focus:ring-2 focus:ring-vn-accent text-lg"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-vn-accent rounded-lg text-sm font-medium
                             hover:bg-vn-hover transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowInput(false)
                    setNewProfileName('')
                  }}
                  className="px-4 py-2 bg-vn-card rounded-lg text-sm font-medium
                             hover:bg-vn-panel transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + profiles.length * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInput(true)}
              className="flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-vn-panel 
                         hover:bg-vn-card transition-colors cursor-pointer group min-w-[100px]"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-vn-card flex items-center justify-center
                              group-hover:bg-vn-accent/20 transition-colors">
                <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-vn-text-secondary group-hover:text-vn-accent" />
              </div>
              <span className="text-sm text-vn-text-secondary font-medium group-hover:text-vn-text">
                New Profile
              </span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
