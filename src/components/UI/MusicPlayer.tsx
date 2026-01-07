import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ListMusic, Upload } from 'lucide-react'
import { useAudioStore } from '../../store/useAudioStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { translations } from '../../utils/translations'

export default function MusicPlayer() {
  const { 
    hasInteracted, 
    addTracks,
    playlist, 
    currentTrackIndex, 
    playTrack,
    isPlaylistOpen,
    togglePlaylist
  } = useAudioStore()

  const { language } = useSettingsStore()
  const t = translations[language]
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newTracks = Array.from(files).map((file, i) => ({
          id: `${file.name}-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Local File",
          url: URL.createObjectURL(file), // Create object URL for playback
      }));
      addTracks(newTracks);
    }
  }

  if (!hasInteracted) return null;

  return (
    <AnimatePresence>
        {isPlaylistOpen && (
            <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 h-full w-full md:w-[400px] z-50 bg-black/80 backdrop-blur-xl border-l border-white/10 flex flex-col p-6 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 font-mono tracking-tighter">
                        {t.playerTitle}
                    </h2>
                    <button onClick={togglePlaylist} className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-6">
                    {/* Playlist */}
                    <div className="space-y-2">
                         <div className="flex justify-between items-center pl-1">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">{t.playlist}</h3>
                            <span className="text-[10px] text-white/20">{playlist.length} {t.tracks}</span>
                         </div>
                         
                         {/* Local Import Button in Playlist */}
                         <div className="relative">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileImport} 
                                accept="audio/*"
                                multiple
                                className="hidden" 
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg text-xs text-white/60 hover:text-cyan-400 transition flex items-center justify-center gap-2 mb-2"
                            >
                                <Upload size={14} />
                                {t.import}
                            </button>
                         </div>
                         
                         {playlist.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-white/20 border border-dashed border-white/10 rounded-xl">
                                <ListMusic size={32} className="mb-2 opacity-50" />
                                <p className="text-xs">{t.noTracks}</p>
                            </div>
                         ) : (
                             playlist.map((track, i) => (
                                <div 
                                    key={`${track.id}-${i}`}
                                    className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition relative overflow-hidden ${currentTrackIndex === i ? 'bg-cyan-900/20 border border-cyan-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                    onClick={() => playTrack(i)}
                                >
                                    {/* Active Indicator Bar */}
                                    {currentTrackIndex === i && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />}
                                    
                                    <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-mono ${currentTrackIndex === i ? 'text-cyan-400 font-bold' : 'text-gray-600'}`}>
                                        {currentTrackIndex === i ? <Loader2 className="animate-spin" size={14}/> : i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${currentTrackIndex === i ? 'text-cyan-100' : 'text-gray-300'}`}>
                                            {track.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                                    </div>
                                </div>
                            ))
                         )}
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
  )
}
