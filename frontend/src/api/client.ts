import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const profilesApi = {
  getAll: () => api.get('/profiles/'),
  create: (name: string) => api.post('/profiles/', { name }),
  get: (id: number) => api.get(`/profiles/${id}`),
  delete: (id: number) => api.delete(`/profiles/${id}`),
}

export const foldersApi = {
  getAll: () => api.get('/folders/'),
  add: (path: string, name: string) => api.post('/folders/', { path, name }),
  remove: (id: number) => api.delete(`/folders/${id}`),
  getVideos: (id: number) => api.get(`/folders/${id}/videos`),
  scan: () => api.post('/folders/scan'),
}

export const videosApi = {
  getAll: (search?: string, folderId?: number) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (folderId) params.append('folder_id', folderId.toString())
    return api.get(`/videos/?${params.toString()}`)
  },
  get: (id: number) => api.get(`/videos/${id}`),
  getNeighbors: (id: number) => api.get(`/videos/${id}/neighbors`),
  streamUrl: (id: number) => `/api/videos/${id}/stream`,
  thumbnailUrl: (id: number) => `/api/videos/${id}/thumbnail`,
  getSubtitles: (id: number) => api.get(`/videos/${id}/subtitles`),
  subtitleUrl: (videoId: number, trackIndex: number) => `/api/videos/${videoId}/subtitles/${trackIndex}`,
}

export const historyApi = {
  get: (profileId: number) => api.get(`/history/${profileId}`),
  update: (profileId: number, data: {
    video_id: number
    position: number
    duration: number
    playback_speed?: number
    subtitle_language?: string
  }) => api.post(`/history/${profileId}`, data),
  delete: (profileId: number, videoId: number) =>
    api.delete(`/history/${profileId}/${videoId}`),
}

export const favoritesApi = {
  get: (profileId: number) => api.get(`/favorites/${profileId}`),
  add: (profileId: number, videoId: number) =>
    api.post(`/favorites/${profileId}`, { video_id: videoId }),
  remove: (profileId: number, videoId: number) =>
    api.delete(`/favorites/${profileId}/${videoId}`),
}

export const settingsApi = {
  get: (profileId: number) => api.get(`/settings/${profileId}`),
  update: (profileId: number, data: {
    theme?: string
    subtitle_font_size?: number
    subtitle_color?: string
    playback_speed?: number
    autoplay?: boolean
  }) => api.put(`/settings/${profileId}`, data),
}

export const subtitlePrefsApi = {
  get: (profileId: number) => api.get(`/subtitle-preferences/${profileId}`),
  update: (profileId: number, data: {
    font_size?: number
    color?: string
    background_opacity?: number
    background_color?: string
    outline?: boolean
    outline_color?: string
    outline_width?: number
    shadow?: boolean
    shadow_color?: string
    shadow_offset?: number
    position?: number
    delay?: number
  }) => api.put(`/subtitle-preferences/${profileId}`, data),
}

export default api
