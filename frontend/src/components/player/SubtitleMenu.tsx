import { motion } from 'framer-motion'

interface SubtitleMenuProps {
  show: boolean
  onClose: () => void
  subtitleTracks: any[]
  activeSubtitle: number | null
  localPrefs: any
  onSelectTrack: (index: number | null) => void
  onUpdatePrefs: (data: any) => void
}

export default function SubtitleMenu({
  show,
  onClose,
  subtitleTracks,
  activeSubtitle,
  localPrefs,
  onSelectTrack,
  onUpdatePrefs,
}: SubtitleMenuProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-20 right-12 z-50"
    >
      <div className="bg-black/95 backdrop-blur-xl rounded-2xl p-4 w-64 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-white/80">Subtitles</p>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xs"
          >
            Close
          </button>
        </div>

        {/* Track Selection */}
        <div className="space-y-1 mb-4">
          <button
            onClick={() => onSelectTrack(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
              activeSubtitle === null ? 'bg-vn-accent text-white' : 'hover:bg-white/10 text-white/80'
            }`}
          >
            Off
          </button>
          {subtitleTracks.map((track: any) => (
            <button
              key={track.index}
              onClick={() => onSelectTrack(track.index)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                activeSubtitle === track.index ? 'bg-vn-accent text-white' : 'hover:bg-white/10 text-white/80'
              }`}
            >
              {track.title || track.language || `Track ${track.index}`}
            </button>
          ))}
          {subtitleTracks.length === 0 && (
            <p className="text-xs text-white/40 px-3 py-2">No subtitles found</p>
          )}
        </div>

        <hr className="border-white/10 my-3" />

        {/* Appearance Settings */}
        <div className="space-y-4">
          {/* Font Size */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">Font Size</label>
              <span className="text-[10px] text-white/40">{localPrefs?.font_size || 24}px</span>
            </div>
            <input
              type="range" min="12" max="48" step="2"
              value={localPrefs?.font_size || 24}
              onChange={(e) => onUpdatePrefs({ font_size: parseInt(e.target.value) })}
              className="w-full accent-vn-accent h-1"
            />
          </div>

          {/* Background */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">Background</label>
              <button
                onClick={() => {
                  const val = (localPrefs?.background_opacity ?? 0.5) > 0 ? 0 : 0.5
                  onUpdatePrefs({ background_opacity: val })
                }}
                className={`w-8 h-4 rounded-full transition-colors ${(localPrefs?.background_opacity ?? 0.5) > 0 ? 'bg-vn-accent' : 'bg-white/20'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${(localPrefs?.background_opacity ?? 0.5) > 0 ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {(localPrefs?.background_opacity ?? 0.5) > 0 && (
              <input
                type="range" min="0.1" max="1" step="0.1"
                value={localPrefs?.background_opacity ?? 0.5}
                onChange={(e) => onUpdatePrefs({ background_opacity: parseFloat(e.target.value) })}
                className="w-full accent-vn-accent h-1"
              />
            )}
          </div>

          {/* Position from Bottom */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">Position from Bottom</label>
              <span className="text-[10px] text-white/40">{localPrefs?.position ?? 60}px</span>
            </div>
            <input
              type="range" min="10" max="300" step="5"
              value={localPrefs?.position ?? 60}
              onChange={(e) => onUpdatePrefs({ position: parseInt(e.target.value) })}
              className="w-full accent-vn-accent h-1"
            />
          </div>

          {/* Outline */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">Outline</label>
              <button
                onClick={() => onUpdatePrefs({ outline: !localPrefs?.outline })}
                className={`w-8 h-4 rounded-full transition-colors ${localPrefs?.outline ? 'bg-vn-accent' : 'bg-white/20'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${localPrefs?.outline ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {localPrefs?.outline && (
              <input
                type="range" min="1" max="4" step="1"
                value={localPrefs?.outline_width || 2}
                onChange={(e) => onUpdatePrefs({ outline_width: parseInt(e.target.value) })}
                className="w-full accent-vn-accent h-1"
              />
            )}
          </div>

          {/* Shadow */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] text-white/50 uppercase tracking-wider">Shadow</label>
              <button
                onClick={() => onUpdatePrefs({ shadow: !localPrefs?.shadow })}
                className={`w-8 h-4 rounded-full transition-colors ${localPrefs?.shadow ? 'bg-vn-accent' : 'bg-white/20'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${localPrefs?.shadow ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
