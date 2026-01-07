import VisualizerCanvas from './components/Visualizer/VisualizerCanvas'
import IntroOverlay from './components/UI/IntroOverlay'
import Controls from './components/UI/Controls'
import MusicPlayer from './components/UI/MusicPlayer'
import SettingsPanel from './components/UI/SettingsPanel'
import ImmersiveHandler from './components/UI/ImmersiveHandler'
import { useSettingsStore } from './store/useSettingsStore'

export default function App() {
  const { enableImmersiveMode } = useSettingsStore()

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <ImmersiveHandler />
      
      <VisualizerCanvas />
      <IntroOverlay />
      
      {/* UI Layer - Fades out in Immersive Mode (Controlled by individual components) */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto">
              <Controls />
              <MusicPlayer />
              
              {/* Disclaimer/Title overlay */}
              <div className={`absolute top-6 left-8 z-30 pointer-events-none opacity-50 mix-blend-difference transition-opacity duration-300 ${enableImmersiveMode ? 'opacity-0 hover:opacity-50' : ''}`}>
                  <h1 className="text-2xl font-bold tracking-[0.2em] text-white">VUSIC</h1>
                  <p className="text-xs text-white/60">AUDIO REACTIVE SYSTEM</p>
              </div>
          </div>
      </div>
      
      {/* Settings Panel gets its own visibility logic (button hides, panel stays if open) */}
      <div className="pointer-events-auto">
          <SettingsPanel /> 
      </div>
    </div>
  )
}
