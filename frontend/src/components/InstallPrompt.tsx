import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem('vn_install_dismissed')
      if (!dismissed) {
        setShowBanner(true)
      }
    }

    const installedHandler = () => {
      setIsInstalled(true)
      setShowBanner(false)
      localStorage.removeItem('vn_install_dismissed')
    }

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
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('vn_install_dismissed', 'true')
  }

  if (isInstalled || !showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-4 sm:max-w-sm"
      >
        <div className="bg-vn-panel border border-vn-card rounded-2xl p-4 shadow-2xl shadow-black/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-vn-accent/20 rounded-xl shrink-0">
              <Download className="w-5 h-5 text-vn-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-vn-text">Install VideoNest</p>
              <p className="text-xs text-vn-text-secondary mt-0.5">
                Add to your home screen for the best experience
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-vn-text-secondary" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 text-sm text-vn-text-secondary hover:bg-white/5 
                         rounded-xl transition-colors"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 text-sm font-medium bg-vn-accent hover:bg-vn-hover 
                         rounded-xl transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
