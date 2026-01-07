import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { OrbitControls } from '@react-three/drei'
import AudioReactiveScene from './AudioReactiveScene.tsx'
import { useSettingsStore } from '../../store/useSettingsStore'

export default function VisualizerCanvas() {
  const { rotationSpeed, bloomStrength } = useSettingsStore()

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} gl={{ antialias: false }}>
        <color attach="background" args={['#050505']} />
        
        <AudioReactiveScene />

        <EffectComposer>
           <Bloom luminanceThreshold={0.2} mipmapBlur intensity={bloomStrength} radius={0.4} />
        </EffectComposer>
        
        <OrbitControls 
            makeDefault 
            autoRotate={rotationSpeed > 0}
            autoRotateSpeed={rotationSpeed * 2} // visualizer logic uses 0-2 range, orbitcontrols default is 2.0. scaling to match feel.
            enableZoom={false} 
        />
      </Canvas>
    </div>
  )
}
