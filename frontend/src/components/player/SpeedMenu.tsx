import { motion } from 'framer-motion'

interface SpeedMenuProps {
  show: boolean
  playbackSpeed: number
  onSelectSpeed: (speed: number) => void
}

export default function SpeedMenu({ show, playbackSpeed, onSelectSpeed }: SpeedMenuProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      className="absolute bottom-full right-0 mb-2 p-3 bg-black/95 backdrop-blur-xl 
                 rounded-2xl min-w-[160px] shadow-2xl"
    >
      <p className="text-[10px] text-white/50 mb-2 uppercase tracking-wider">Speed</p>
      <div className="grid grid-cols-3 gap-1">
        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
          <motion.button
            key={speed}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectSpeed(speed)}
            className={`px-2 py-1.5 rounded-lg text-xs transition-all ${
              playbackSpeed === speed
                ? 'bg-vn-accent text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {speed}x
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
