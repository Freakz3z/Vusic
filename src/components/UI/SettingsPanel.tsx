import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, EyeOff, Box, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { translations } from '../../utils/translations'

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { 
    enableMorphing, enableShake, shakeIntensity, useHighQualityTexture,
    rotationSpeed, bassBoost, bassThreshold, morphingIntensity, pulseIntensity,
    colorTheme, bloomStrength, particleSize, sphereRadius, visualShape, audioSensitivity, particleResetTime, shapeTransitionTime,
    autoShapeSwitch, autoShapeInterval,
    enableImmersiveMode,
    language, setSetting, setLanguage 
  } = useSettingsStore()

  const t = translations[language];

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) &&
          !event.target.closest('button')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // If panel is open, always show.
  // If panel is closed, button visibility depends on immersive mode (hover logic handled by class)

  return (
    <>
      {/* Toggle Button */}
      <div className={`absolute top-6 right-8 z-40 transition-opacity duration-300 ${!isOpen && enableImmersiveMode ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <motion.button
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-all cursor-pointer pointer-events-auto"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            <Settings size={24} />
        </motion.button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
            <motion.div
                ref={panelRef}
                className="absolute top-0 right-0 h-full w-80 bg-black/80 backdrop-blur-xl z-50 p-6 border-l border-white/10 shadow-2xl overflow-y-auto"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 20 }}
            >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-white tracking-widest">{t.settingsTitle}</h2>
                    <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Language Section */}
                    <section>
                         <h3 className="text-sm text-white/50 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                             <Globe size={16} /> {t.language}
                        </h3>
                        <div className="flex bg-white/5 p-1 rounded-lg">
                            <button 
                                onClick={() => setLanguage('en')}
                                className={`flex-1 py-1 text-sm rounded transition ${language === 'en' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/80'}`}
                            >
                                English
                            </button>
                            <button 
                                onClick={() => setLanguage('zh')}
                                className={`flex-1 py-1 text-sm rounded transition ${language === 'zh' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/80'}`}
                            >
                                中文
                            </button>
                        </div>
                    </section>

                    {/* Visual Section */}
                    <section>
                        <h3 className="text-sm text-cyan-400 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                             <Box size={16} /> {t.visuals}
                        </h3>
                        
                        <div className="space-y-4">
                            <SettingToggle 
                                label={t.morphing} 
                                value={enableMorphing} 
                                onChange={(v) => setSetting('enableMorphing', v)} 
                            />
                            <SettingToggle 
                                label={t.glow} 
                                value={useHighQualityTexture} 
                                onChange={(v) => setSetting('useHighQualityTexture', v)}
                                description={t.glowDesc}
                            />
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-white/60">
                                    <span>{t.speed}</span>
                                    <span>{(rotationSpeed * 50).toFixed(0)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="2.0" step="0.01"
                                    value={rotationSpeed}
                                    onChange={(e) => setSetting('rotationSpeed', parseFloat(e.target.value))}
                                    className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            <SettingToggle 
                                label={t.shake} 
                                value={enableShake} 
                                onChange={(v) => setSetting('enableShake', v)} 
                            />
                            
                           {enableShake && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.intensity}</span>
                                        <span>{(shakeIntensity * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.05"
                                        value={shakeIntensity}
                                        onChange={(e) => setSetting('shakeIntensity', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                           )}

                           {/* Bass Enhancement Settings */}
                           <div className="pt-4 border-t border-white/5 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.bassBoost}</span>
                                        <span>{bassBoost.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1.0" max="3.0" step="0.1"
                                        value={bassBoost}
                                        onChange={(e) => setSetting('bassBoost', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.bassThreshold}</span>
                                        <span>{bassThreshold.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="0.5" step="0.05"
                                        value={bassThreshold}
                                        onChange={(e) => setSetting('bassThreshold', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.morphingIntensity}</span>
                                        <span>{morphingIntensity.toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1.0" max="10.0" step="0.5"
                                        value={morphingIntensity}
                                        onChange={(e) => setSetting('morphingIntensity', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.pulseIntensity}</span>
                                        <span>{pulseIntensity.toFixed(1)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1" max="2.0" step="0.1"
                                        value={pulseIntensity}
                                        onChange={(e) => setSetting('pulseIntensity', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                           </div>

                           {/* Customization Sliders */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.baseColor}</span>
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${colorTheme * 360}, 100%, 50%)` }}/>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.01"
                                        value={colorTheme}
                                        onChange={(e) => setSetting('colorTheme', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: `hsl(${colorTheme * 360}, 100%, 50%)` }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.bloom}</span>
                                        <span>{bloomStrength.toFixed(1)}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="3" step="0.1"
                                        value={bloomStrength}
                                        onChange={(e) => setSetting('bloomStrength', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.pSize}</span>
                                        <span>{particleSize.toFixed(1)}x</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.5" max="3.0" step="0.1"
                                        value={particleSize}
                                        onChange={(e) => setSetting('particleSize', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.shape}</span>
                                        <span className="uppercase text-cyan-400 font-bold">{t.shapes[visualShape || 'sphere']}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg">
                                        {(['sphere', 'cube', 'pyramid', 'flower', 'dna', 'spiral', 'shell', 'mobius', 'tree'] as const).map((shape) => (
                                            <button
                                                key={shape}
                                                onClick={() => setSetting('visualShape', shape)}
                                                className={`py-1.5 rounded-md text-[10px] uppercase tracking-wider transition-all ${
                                                    visualShape === shape
                                                    ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20'
                                                    : 'text-white/40 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {t.shapes[shape]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <SettingToggle
                                        label={t.autoShapeSwitch}
                                        value={autoShapeSwitch}
                                        onChange={(v) => setSetting('autoShapeSwitch', v)}
                                    />
                                </div>

                                {autoShapeSwitch && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-white/60">
                                            <span>{t.autoShapeInterval}</span>
                                            <span>{autoShapeInterval.toFixed(0)}s</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="3" max="30" step="1"
                                            value={autoShapeInterval}
                                            onChange={(e) => setSetting('autoShapeInterval', parseFloat(e.target.value))}
                                            className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                )}

                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-[10px] text-white/40 leading-relaxed">
                                        <span className="text-cyan-400 font-bold">{t.shortcuts}:</span> {t.shortcutsDesc}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.sSize}</span>
                                        <span>{sphereRadius ? sphereRadius.toFixed(1) : "5.0"}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="2" max="10" step="0.5"
                                        value={sphereRadius || 5}
                                        onChange={(e) => setSetting('sphereRadius', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.sensitivity}</span>
                                        <span>{audioSensitivity.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5" max="3.0" step="0.1"
                                        value={audioSensitivity}
                                        onChange={(e) => setSetting('audioSensitivity', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.resetTime}</span>
                                        <span>{particleResetTime.toFixed(1)}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5" max="5.0" step="0.1"
                                        value={particleResetTime}
                                        onChange={(e) => setSetting('particleResetTime', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-white/60">
                                        <span>{t.shapeTransition}</span>
                                        <span>{shapeTransitionTime.toFixed(1)}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5" max="5.0" step="0.1"
                                        value={shapeTransitionTime}
                                        onChange={(e) => setSetting('shapeTransitionTime', parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Behavior Section */}
                    <section>
                         <h3 className="text-sm text-purple-400 font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
                             <EyeOff size={16} /> {t.immersion}
                        </h3>
                         <div className="space-y-4">
                             <SettingToggle 
                                label={t.autoHide} 
                                value={enableImmersiveMode} 
                                onChange={(v) => setSetting('enableImmersiveMode', v)} 
                                description={t.autoHideDesc}
                            />
                         </div>
                    </section>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function SettingToggle({ label, value, onChange, description }: { label: string, value: boolean, onChange: (v: boolean) => void, description?: string }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => onChange(!value)}>
                <span className="text-white text-sm font-medium">{label}</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${value ? 'bg-cyan-500' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${value ? 'left-6' : 'left-1'}`} />
                </div>
            </div>
            {description && <p className="text-[10px] text-white/40 px-1">{description}</p>}
        </div>
    )
}