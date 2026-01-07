// src/components/UI/Controls.tsx
import React, { useRef } from 'react'
import { useAudioStore } from '../../store/useAudioStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { translations } from '../../utils/translations'
import { Play, Pause, Upload, Volume2, ListMusic, Mic, Monitor } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Controls() {
  const { 
      isPlaying, 
      togglePlay, 
      setVolume, 
      volume, 
      hasInteracted,
      togglePlaylist, 
      isPlaylistOpen,
      addTracks,
      playTrack,
      playlist,
      setInputSource,
      activeInput
  } = useAudioStore()
  
  const { language, enableImmersiveMode } = useSettingsStore()
  const t = translations[language]

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!hasInteracted) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newTracks = Array.from(files).map((file, i) => ({
          id: `${file.name}-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Local File",
          url: URL.createObjectURL(file), // Create object URL for playback
      }));

      const startIndex = playlist.length;
      addTracks(newTracks);
      
      // If nothing matches/plays, play the first one imported
      // Wait for state update is tricky in strict mode, but local synchronous set is okay-ish usually with zustand
      // Better to use the known index.
      setTimeout(() => playTrack(startIndex), 100);
    }
  }

  return (
    <div className={`absolute bottom-12 left-0 right-0 z-40 flex justify-center items-center pointer-events-none transition-opacity duration-300 ${enableImmersiveMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ delay: 0.2 }}
        >
        <div className="bg-black/60 backdrop-blur-xl px-8 py-4 rounded-full flex items-center gap-8 border border-white/10 pointer-events-auto shadow-2xl shadow-cyan-900/10">
        
        {/* Play/Pause Button - Prominent */}
        <button 
          onClick={togglePlay}
          className={`w-14 h-14 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg ${activeInput !== 'file' ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-white text-black hover:bg-cyan-400 shadow-white/10'}`}
          disabled={activeInput !== 'file'}
          title={activeInput !== 'file' ? "Disabled in Input Mode" : "Play/Pause"}
        >
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>

        <div className="h-8 w-[1px] bg-white/10" />

        {/* Volume & Playlist Group */}
        <div className="flex items-center gap-6">
            
            {/* Input Toggles */}
            <div className="flex gap-2">
                {/* Mic Switch */}
                <button
                    onClick={() => setInputSource(activeInput === 'mic' ? 'file' : 'mic')}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${activeInput === 'mic' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    title={t.micMode}
                >
                    <Mic size={20} className={activeInput === 'mic' ? "animate-pulse" : ""} />
                </button>

                 {/* System Audio Switch */}
                 <button
                    onClick={() => setInputSource(activeInput === 'system' ? 'file' : 'system')}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${activeInput === 'system' ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    title={t.sysMode}
                >
                    <Monitor size={20} className={activeInput === 'system' ? "animate-pulse" : ""} />
                </button>
            </div>


            {/* Volume (Hidden in Input Mode usually) */}
            {activeInput === 'file' && (
              <div className="group flex items-center gap-3">
                  <Volume2 size={20} className="text-white/70" />
                  <div className="w-0 group-hover:w-24 overflow-hidden transition-all duration-300 flex items-center">
                      <input 
                          type="range" 
                          min="0" max="1" step="0.01" 
                          value={volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
                      />
                  </div>
              </div>
            )}

            {/* Playlist Toggle */}
            <button 
                onClick={togglePlaylist}
                className={`p-2 rounded-full transition-all ${isPlaylistOpen ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                title={t.playlist}
            >
                <ListMusic size={22} />
            </button>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        {/* Import Button */}
        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="audio/*"
            multiple
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-white/50 hover:text-white transition group"
          >
            <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition">
                 <Upload size={16} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">{t.import}</span>
          </button>
        </div>
        </div>
        </motion.div>
    </div>
  )
}
