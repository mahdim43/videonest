import { motion, AnimatePresence } from 'framer-motion'

interface GestureHintProps {
  text: string
}

export default function GestureHint({ text }: GestureHintProps) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
        >
          <div className="bg-black/80 backdrop-blur-md px-8 py-4 rounded-2xl">
            <span className="text-4xl font-bold text-white">{text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
