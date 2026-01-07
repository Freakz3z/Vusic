import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'
import { useAudioStore } from '../../store/useAudioStore'
import { useSettingsStore } from '../../store/useSettingsStore'

// Helper to generate soft glow texture
const getGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; 
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();
    
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.15, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Transparent edge

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.premultiplyAlpha = true; // Fixes dark borders in additive blending
    return texture;
}

// Fibonacci Sphere Logic for even distribution
const getFibonacciSpherePoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < samples; i++) {
        const y = 1 - (i / (samples - 1)) * 2; // y goes from 1 to -1
        const r = Math.sqrt(1 - y * y); // radius at y
        const theta = phi * i;

        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;

        points[i * 3] = x * radius;
        points[i * 3 + 1] = y * radius;
        points[i * 3 + 2] = z * radius;
    }
    return points;
}

// Generate random points in a box volume for scatter effect
const getRandomScatterPoints = (samples: number, size: number) => {
    const points = new Float32Array(samples * 3);
    for (let i = 0; i < samples; i++) {
        points[i * 3] = (Math.random() - 0.5) * size;     // x
        points[i * 3 + 1] = (Math.random() - 0.5) * size; // y
        points[i * 3 + 2] = (Math.random() - 0.5) * size; // z
    }
    return points;
}

// Initial positions for flyers (Ambient Dust)
const getFlyerPositions = (samples: number) => {
    const points = new Float32Array(samples * 3);
    for (let i = 0; i < samples; i++) {
        // Spherical distribution around the center
        const r = 20 + Math.random() * 40; // Distance 20 to 60
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        points[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        points[i * 3 + 2] = r * Math.cos(phi);
    }
    return points;
}


// Cubic easing for smoother transition
const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function AudioReactiveScene() {
  const pointsRef = useRef<THREE.Points>(null)
  const flyersRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  // Settings
  // We sub to radius specifically to trigger geometry rebuild on change
  const sphereRadius = useSettingsStore(state => state.sphereRadius);
  
  // Texture
  const glowTexture = useMemo(() => getGlowTexture(), []);

  // Buffers
  const dataArray = useMemo(() => new Uint8Array(2048), [])
  
  // Main Sphere/Cloud Config
  const count = 4000;
  const radius = sphereRadius || 5;
  const scatterSize = 60;
  
  // Flyers Config
  const flyerCount = 800; // Increased for ambient dust
  
  // Geometries
  const targetPositions = useMemo(() => getFibonacciSpherePoints(count, radius), [radius]);

  const scatterPositions = useMemo(() => getRandomScatterPoints(count, scatterSize), [])
  const flyerBasePositions = useMemo(() => getFlyerPositions(flyerCount), [])
  
  // Store the base positions in a buffer we manipulate
  const currentBasePositions = useMemo(() => new Float32Array(count * 3), []);
  
  // Initialize to scatter positions
  useMemo(() => {
      currentBasePositions.set(scatterPositions);
  }, []);

  const noise3D = useMemo(() => createNoise3D(), []);

  // Smoothers
  const smoothedBass = useRef(0);
  const smoothedMid = useRef(0);
  const smoothedHigh = useRef(0);
  
  // Transition state (0 = scattered, 1 = gathered)
  const transitionProgress = useRef(0); 

  // Custom time accumulator for speed control
  const simulatedTime = useRef(0);

  useFrame((state, delta) => {
    const { getFrequencyData, isPlaying, hasInteracted } = useAudioStore.getState();
    
    // Global Speed Control
    // Improve: If speed is 0, time stops. We use a base multiplier + bass boost for the time flow itself?
    // Actually, userSpeed is the "rotationSpeed" setting. Let's treat it as the "Simulation Speed".
    // 0 = Frozen time (except audio reactivity amplitude), 1 = Normal speed.
    const { 
        enableShake, shakeIntensity, useHighQualityTexture, enableMorphing, rotationSpeed: userSpeed,
        colorTheme, particleSize, audioSensitivity
    } = useSettingsStore.getState();
    
    // Scale delta by userSpeed. 
    // The visualizer relies on "time" for noise scrolling and rotation.
    // We'll use this custom time instead of state.clock.getElapsedTime()
    simulatedTime.current += delta * userSpeed;
    const time = simulatedTime.current;

    // Update Transition Progress
    const targetProgress = hasInteracted ? 1 : 0;
    const speed = 0.005; 
    
    if (transitionProgress.current < targetProgress) {
        transitionProgress.current = Math.min(transitionProgress.current + speed, 1);
    } else if (transitionProgress.current > targetProgress) {
        transitionProgress.current = Math.max(transitionProgress.current - speed, 0);
    }
    
    const progress = easeInOutCubic(transitionProgress.current);

    // Audio Analysis
    if (pointsRef.current) {
        getFrequencyData(dataArray);
        
        let bassSum = 0, midSum = 0, highSum = 0;
        
        if (isPlaying || hasInteracted) {
             // Apply audio sensitivity
             for (let i = 0; i < 10; i++) bassSum += dataArray[i];
             for (let i = 10; i < 100; i++) midSum += dataArray[i];
             for (let i = 100; i < 500; i++) highSum += dataArray[i];
             
             bassSum *= audioSensitivity;
             midSum *= audioSensitivity;
             highSum *= audioSensitivity;
        }

        const targetBass = Math.min(bassSum / (10 * 255), 1.5); // Clamp slightly
        const targetMid = Math.min(midSum / (90 * 255), 1.5);
        const targetHigh = Math.min(highSum / (400 * 255), 1.5);

        smoothedBass.current += (targetBass - smoothedBass.current) * 0.2;
        smoothedMid.current += (targetMid - smoothedMid.current) * 0.15;
        smoothedHigh.current += (targetHigh - smoothedHigh.current) * 0.1;

        const bassVal = smoothedBass.current;
        const midVal = smoothedMid.current;
        const highVal = smoothedHigh.current;

        // --- CAMERA SHAKE ---
        if (groupRef.current && hasInteracted && enableShake) {
             const shakeAmp = Math.max(0, (bassVal - 0.5) * shakeIntensity); 
             if (shakeAmp > 0) {
                groupRef.current.position.x += (Math.random() - 0.5) * shakeAmp;
                groupRef.current.position.y += (Math.random() - 0.5) * shakeAmp;
                groupRef.current.position.z += (Math.random() - 0.5) * shakeAmp;
             }
             // Damper
             groupRef.current.position.lerp(new THREE.Vector3(0,0,0), 0.1);
        }

        // --- MAIN PARTICLE SYSTEM LOGIC ---
        
        // 1. Rotation 
        // userSpeed acts as a multiplier (0.1x to 2.0x)
        // Base rotation + music boost
        // Significantly reduced base speed for slower ambient motion
        const currentRotationSpeed = (0.05 + bassVal * 0.1) * userSpeed;
        
        pointsRef.current.rotation.y += currentRotationSpeed * 0.01;
        pointsRef.current.rotation.z += (currentRotationSpeed * 0.5) * 0.01;

        // 2. Compute Particles
        const positionsAttribute = pointsRef.current.geometry.attributes.position;
        const mouseX = (state.pointer.x * state.viewport.width) / 2;
        const mouseY = (state.pointer.y * state.viewport.height) / 2;
        
        for(let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Interpolate Base Position
            const sx = scatterPositions[i3];
            const sy = scatterPositions[i3 + 1];
            const sz = scatterPositions[i3 + 2];
            
            // Sphere Target Position
            const tx = targetPositions[i3];
            const ty = targetPositions[i3 + 1];
            const tz = targetPositions[i3 + 2];
            
            let bx = sx + (tx - sx) * progress;
            let by = sy + (ty - sy) * progress;
            let bz = sz + (tz - sz) * progress;
            
            // Interactive Repulsion (Only when SCATTERED)
            if (progress < 0.9) {
                const dx = bx - mouseX;
                const dy = by - mouseY;
                const distSq = dx*dx + dy*dy;
                const interactionRadiusSq = 49; // Radius 7
                
                if (distSq < interactionRadiusSq) {
                    const dist = Math.sqrt(distSq);
                    const maxRadius = 7;
                    const force = (maxRadius - dist) / maxRadius; 
                    const strength = 2 * (1 - progress); 
                    
                    const angle = Math.atan2(dy, dx);
                    bx += Math.cos(angle) * force * strength;
                    by += Math.sin(angle) * force * strength;
                }
            }

            // Normalize
            const len = Math.sqrt(bx*bx + by*by + bz*bz);
            const nx = len === 0 ? 0 : bx/len;
            const ny = len === 0 ? 0 : by/len;
            const nz = len === 0 ? 0 : bz/len;


            // Audio Reactive Distortion
            let dist = len; 
            
            if (progress > 0.01) {
                // Sphere Distortion logic
                if (enableMorphing) {
                    const nAmp = 0.5 + bassVal * 3; 
                    const nFreq = 0.5 + midVal; 
                    
                    const noise = noise3D(nx * nFreq + time * 0.5, ny * nFreq + time * 0.5, nz * nFreq);
                    const noiseSpike = (highVal > 0.4 && Math.random() > 0.95) ? (highVal * 1.5) : 0;
                    
                    const wave = (noise * nAmp + noiseSpike) * progress; 
                    dist += wave;
                } else {
                    // Simple Bass Pulse instead of Morphing
                    dist += bassVal * 0.5 * progress;
                }
            } else {
                 // Scatter Idle Motion
                 const t = time * 0.2;
                 const noise = noise3D(bx * 0.05 + t, by * 0.05, bz * 0.05);
                 dist += noise * 0.2; 
            }
            
            positionsAttribute.setXYZ(i, nx * dist, ny * dist, nz * dist);
        }
        positionsAttribute.needsUpdate = true;
        
        // Color Shift
        // Base Hue directly from settings (0-1)
        let baseHue = colorTheme; 
        
        const targetHue = (baseHue + (bassVal * 0.1 * progress)) % 1.0; 
        const mat = pointsRef.current.material as THREE.PointsMaterial;
        mat.color.setHSL(targetHue, 0.8, 0.5 + bassVal * 0.3 * progress);
        
        const baseSize = useHighQualityTexture ? 0.3 : 0.12;
        mat.size = (baseSize * Math.max(0.5, progress) + bassVal * 0.1) * particleSize; 
        
        // Update map if it changed (optimization: avoid setting every frame if possible, 
        // but react-three-fiber handles prop updates usually. Here we are manipulating raw material)
        if (mat.map !== (useHighQualityTexture ? glowTexture : null)) {
            mat.map = useHighQualityTexture ? glowTexture : null;
            mat.needsUpdate = true;
        }

        mat.opacity = 0.4 + (progress * 0.4); 

        // --- AMBIENT DUST LOGIC ---
        if (flyersRef.current && transitionProgress.current > 0.5) {
            const flyerMat = flyersRef.current.material as THREE.PointsMaterial;
            
            // Gentle Fade In (Max opacity 0.5)
            flyerMat.opacity = (transitionProgress.current - 0.5) * 2 * 0.5; 
            
            // Color Breathing (Cyan/Purple range)
            // Use complementary hue or similar
            const breathe = Math.sin(time * 0.5) * 0.1; 
            let dustHue = (baseHue + 0.1 + breathe) % 1.0; 
            
            flyerMat.color.setHSL(dustHue, 0.8, 0.8);

            // Audio Reactive Size (Sparkle on High Freq)
            flyerMat.size = (0.15 + (highVal * 0.2)) * particleSize;

            // Slow Group Rotation/Drift - Drifting Cloud effect
            // Also affected by userSpeed
            flyersRef.current.rotation.y += currentRotationSpeed * 0.005;
            flyersRef.current.rotation.x = Math.sin(time * 0.1) * 0.05;
        }
    }
  });

  return (
    <group ref={groupRef}>
        {/* Main Audio Reactive Cloud/Sphere */}
        <points ref={pointsRef}>
        <bufferGeometry>
            <bufferAttribute
            attach="attributes-position"
            count={count}
            array={currentBasePositions}
            itemSize={3}
            />
        </bufferGeometry>
        <pointsMaterial
            size={0.15}
            color="#00ffff"
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
        </points>

        {/* Flying Particles (Ambient Dust/Stars) */}
        <points ref={flyersRef}>
            <bufferGeometry>
                <bufferAttribute 
                    attach="attributes-position"
                    count={flyerCount}
                    array={flyerBasePositions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial 
                size={0.2}
                color="#ffffff"
                transparent
                opacity={0}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
            />
        </points>
    </group>
  )
}
