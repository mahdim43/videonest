import { create } from 'zustand'

interface Profile {
  id: number
  name: string
  avatar: string | null
  created_at: string
}

interface ProfileStore {
  currentProfile: Profile | null
  profiles: Profile[]
  setProfiles: (profiles: Profile[]) => void
  setCurrentProfile: (profile: Profile | null) => void
}

export const useProfileStore = create<ProfileStore>((set) => ({
  currentProfile: null,
  profiles: [],
  setProfiles: (profiles) => set({ profiles }),
  setCurrentProfile: (profile) => set({ currentProfile: profile }),
}))
