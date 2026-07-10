import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflineFallback() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-vn-bg flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-vn-panel rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-vn-text-secondary" />
        </div>
        <h1 className="text-2xl font-heading font-bold mb-2">You're offline</h1>
        <p className="text-vn-text-secondary mb-6">
          Check your internet connection and try again.
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-vn-accent hover:bg-vn-hover rounded-xl font-medium 
                     transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-5 h-5" />
          Try again
        </button>
      </div>
    </div>
  )
}
