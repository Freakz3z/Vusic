import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { OrbitControls } from '@react-three/drei'
import { Vector2 } from 'three'
import { useRef } from 'react'
import AudioReactiveScene from './AudioReactiveScene.tsx'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useAudioStore } from '../../store/useAudioStore'

// Helper component to animate effects
const AudioReactiveEffects = () => {
  const aberrationRef = useRef<any>(null)
  const { enableAberration, audioSensitivity } = useSettingsStore()
  
  useFrame(() => {
    if (!aberrationRef.current) return;
    
    // Default low offset
    const baseOffset = 0.002;
    
    if (enableAberration) {
       const { analyser } = useAudioStore.getState();
       if (analyser) {
           const dataArray = new Uint8Array(4); // Only need a tiny sample for bass
           // Get lowest frequencies (0-4 bins) roughly
           analyser.getByteFrequencyData(dataArray);
           const avgBass = dataArray[0] / 255.0; // 0.0 to 1.0
           
           // If bass hit (threshold > 0.5), spike the offset
           const impact = avgBass * avgBass * avgBass; // Sharpen the curve
           const dynamicOffset = baseOffset + (impact * 0.02 * audioSensitivity); 
           
           aberrationRef.current.offset.set(dynamicOffset, dynamicOffset);
       }
    } else {
        aberrationRef.current.offset.set(baseOffset, baseOffset);
    }
  });

  return (
      <ChromaticAberration 
          ref={aberrationRef}
          offset={new Vector2(0.002, 0.002)} 
          radialModulation={false}
          modulationOffset={0}
       />
  )
}

export default function VisualizerCanvas() {
  const { rotationSpeed, bloomStrength } = useSettingsStore()

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} gl={{ antialias: false }}>
        <color attach="background" args={['#050505']} />
        
        <AudioReactiveScene />

        <EffectComposer>
           <Bloom luminanceThreshold={0.2} mipmapBlur intensity={bloomStrength} radius={0.4} />
           <AudioReactiveEffects />
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
