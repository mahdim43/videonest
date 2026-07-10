import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Player from './pages/Player'
import Settings from './pages/Settings'
import InstallPrompt from './components/InstallPrompt'
import OfflineFallback from './components/OfflineFallback'

const queryClient = new QueryClient()

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOffline) {
    return <OfflineFallback />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home/:profileId" element={<Home />} />
          <Route path="/watch/:videoId" element={<Player />} />
          <Route path="/settings/:profileId" element={<Settings />} />
        </Routes>
      </BrowserRouter>
      <InstallPrompt />
    </QueryClientProvider>
  )
}

export default App
