import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Heart, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProfileStore } from '../stores/profileStore'

interface MobileNavProps {
  onSearch?: () => void
  onFavorites?: () => void
}

export default function MobileNav({ onSearch, onFavorites }: MobileNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentProfile } = useProfileStore()

  const profileId = currentProfile?.id?.toString() || location.pathname.match(/\/(\d+)/)?.[1]

  const items = [
    { 
      icon: Home, 
      label: 'Home', 
      onClick: () => navigate(profileId ? `/home/${profileId}` : '/'),
      active: location.pathname.startsWith('/home/')
    },
    { 
      icon: Search, 
      label: 'Search', 
      onClick: () => onSearch?.(),
      active: false
    },
    { 
      icon: Heart, 
      label: 'Favorites', 
      onClick: () => onFavorites?.(),
      active: false
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      onClick: () => navigate(profileId ? `/settings/${profileId}` : '/'),
      active: location.pathname.startsWith('/settings/')
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-vn-panel/95 backdrop-blur-xl border-t border-vn-card safe-area-inset">
      <div className="flex items-center justify-around px-2 py-1">
        {items.map(({ icon: Icon, label, onClick, active }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              active
                ? 'text-vn-accent'
                : 'text-vn-text-secondary active:text-vn-text'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </motion.button>
        ))}
      </div>
    </nav>
  )
}
