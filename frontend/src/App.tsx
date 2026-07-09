import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Player from './pages/Player'
import Settings from './pages/Settings'

const queryClient = new QueryClient()

function App() {
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
    </QueryClientProvider>
  )
}

export default App
