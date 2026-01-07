import { AnimatePresence, motion } from 'framer-motion'
import { useAudioStore } from '../../store/useAudioStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { translations } from '../../utils/translations'

export default function IntroOverlay() {
  const { initializeAudio, hasInteracted } = useAudioStore()
  const { language } = useSettingsStore()
  const t = translations[language]

  return (
    <AnimatePresence>
      {!hasInteracted && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-transparent text-white pointer-events-none"
        >
          <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 1 }}
             className="relative group cursor-pointer pointer-events-auto" 
             onClick={() => initializeAudio()}
          >
            <div className="absolute -inset-8 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-60 blur-2xl transition duration-500"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-200"></div>
            
            <button className="relative px-12 py-6 bg-black rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition duration-1000 ease-in-out" />
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 text-4xl font-bold tracking-[0.3em] pl-2'>{t.enter}</span>
            </button>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-cyan-500/50 text-xs font-mono tracking-widest uppercase"
          >
            {t.subtitle}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
