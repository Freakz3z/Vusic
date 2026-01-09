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

// Cube Points - distributed on surface
const getCubePoints = (samples: number, size: number) => {
    const points = new Float32Array(samples * 3);
    const halfSize = size; // Usually radius is half size, but let's keep scale similar
    
    for (let i = 0; i < samples; i++) {
        // Pick a face (0=x+, 1=x-, 2=y+, 3=y-, 4=z+, 5=z-)
        const face = Math.floor(Math.random() * 6);
        const u = (Math.random() * 2 - 1) * halfSize;
        const v = (Math.random() * 2 - 1) * halfSize;
        
        let x, y, z;
        switch(face) {
             case 0: x = halfSize; y = u; z = v; break;
             case 1: x = -halfSize; y = u; z = v; break;
             case 2: x = u; y = halfSize; z = v; break;
             case 3: x = u; y = -halfSize; z = v; break;
             case 4: x = u; y = v; z = halfSize; break;
             case 5: x = u; y = v; z = -halfSize; break;
             default: x=0; y=0; z=0;
        }
        points[i * 3] = x;
        points[i * 3 + 1] = y;
        points[i * 3 + 2] = z;
    }
    return points;
}

// Torus Points
const getTorusPoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);
    const tubeRadius = radius * 0.4; // Tube thickness relative to radius
    const ringRadius = radius; 
    
    for (let i = 0; i < samples; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        
        const x = (ringRadius + tubeRadius * Math.cos(v)) * Math.cos(u);
        const y = (ringRadius + tubeRadius * Math.cos(v)) * Math.sin(u);
        const z = tubeRadius * Math.sin(v);
        
        points[i * 3] = x;
        points[i * 3 + 1] = y;
        points[i * 3 + 2] = z;
    }
    return points;
}

// Random Cloud
const getCloudPoints = (samples: number, radius: number) => {
  const points = new Float32Array(samples * 3);
  for(let i=0; i<samples; i++){
      // Random direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // Random distance with bias to center
      const r = Math.pow(Math.random(), 1/3) * radius * 1.5;
      
      points[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      points[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      points[i * 3 + 2] = r * Math.cos(phi);
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

// DNA Helix
const getDNAPoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);
    const height = radius * 4;
    const turns = 4;
    
    for (let i = 0; i < samples; i++) {
        // -0.5 to 0.5
        const t = (i / samples) - 0.5; 
        const angle = t * Math.PI * 2 * turns;
        
        // Split into two strands
        const isStrandA = i % 2 === 0;
        const currentAngle = isStrandA ? angle : angle + Math.PI;
        
        const x = Math.cos(currentAngle) * radius;
        const z = Math.sin(currentAngle) * radius;
        const y = t * height;
        
        // Add some "nucleotides" connecting them occasionally
        if (i % 20 === 0) {
           // random noise offset to fill the middle
           points[i * 3] = (Math.random()-0.5) * radius * 0.5;
           points[i * 3 + 1] = y;
           points[i * 3 + 2] = (Math.random()-0.5) * radius * 0.5;
        } else {
           points[i * 3] = x;
           points[i * 3 + 1] = y;
           points[i * 3 + 2] = z;
        }
    }
    return points;
}

// Pyramid - 4-sided pyramid
const getPyramidPoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);
    const height = radius * 2;

    for (let i = 0; i < samples; i++) {
        const face = Math.floor(Math.random() * 4); // 4 triangular faces
        const t1 = Math.random();
        const t2 = Math.random();

        // Barycentric coordinates on triangle
        const sqrtT1 = Math.sqrt(t1);
        const a = 1 - sqrtT1;
        const b = sqrtT1 * (1 - t2);
        const c = sqrtT1 * t2;

        // Base vertices of this face
        let v1, v2, v3;
        const halfSize = radius;

        switch(face) {
            case 0: // Front
                v1 = { x: -halfSize, y: -halfSize, z: halfSize };
                v2 = { x: halfSize, y: -halfSize, z: halfSize };
                v3 = { x: 0, y: halfSize, z: 0 };
                break;
            case 1: // Right
                v1 = { x: halfSize, y: -halfSize, z: halfSize };
                v2 = { x: halfSize, y: -halfSize, z: -halfSize };
                v3 = { x: 0, y: halfSize, z: 0 };
                break;
            case 2: // Back
                v1 = { x: halfSize, y: -halfSize, z: -halfSize };
                v2 = { x: -halfSize, y: -halfSize, z: -halfSize };
                v3 = { x: 0, y: halfSize, z: 0 };
                break;
            case 3: // Left
                v1 = { x: -halfSize, y: -halfSize, z: -halfSize };
                v2 = { x: -halfSize, y: -halfSize, z: halfSize };
                v3 = { x: 0, y: halfSize, z: 0 };
                break;
        }

        points[i * 3] = v1.x * a + v2.x * b + v3.x * c;
        points[i * 3 + 1] = v1.y * a + v2.y * b + v3.y * c;
        points[i * 3 + 2] = v1.z * a + v2.z * b + v3.z * c;
    }
    return points;
}

// Galaxy/Spiral - Multi-armed spiral galaxy
const getSpiralPoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);
    const arms = 5;
    const armSpread = 0.5;

    for (let i = 0; i < samples; i++) {
        const armIndex = i % arms;
        const t = (i / samples);

        // Spiral angle for this arm
        const baseAngle = (armIndex / arms) * Math.PI * 2;
        const spiralAngle = baseAngle + t * Math.PI * 4; // 2 full rotations

        // Radius increases with distance along the arm
        const r = t * radius;

        // Add some spread around the arm center
        const spreadAngle = (Math.random() - 0.5) * armSpread;
        const spreadRadius = (Math.random() - 0.5) * radius * 0.15 * t;

        const x = Math.cos(spiralAngle + spreadAngle) * (r + spreadRadius);
        const z = Math.sin(spiralAngle + spreadAngle) * (r + spreadRadius);
        const y = (Math.random() - 0.5) * radius * 0.1; // Slight vertical scatter

        points[i * 3] = x;
        points[i * 3 + 1] = y;
        points[i * 3 + 2] = z;
    }
    return points;
}

// Flower - Petals arranged in flower pattern with enhanced depth
const getFlowerPoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);
    const petals = 8;
    const layers = 8; // Increased from 5 for more depth

    for (let i = 0; i < samples; i++) {
        const petalIndex = i % petals;
        const layer = Math.floor(i / petals) % layers;

        const angle = (petalIndex / petals) * Math.PI * 2;
        const layerRadius = radius * (0.2 + layer * 0.1); // More gradual layers
        const petalLength = radius * 0.7; // Longer petals

        // Enhanced petal shape with more variation
        const layerPhase = layer / layers;
        const petalAngle = angle + Math.sin(layerPhase * Math.PI * 2) * 0.4;

        // Wave modulation for more organic petal shape
        const wave1 = Math.cos(petalAngle * 3) * 0.2;
        const wave2 = Math.sin(petalAngle * 5) * 0.1;
        const r = layerRadius + (wave1 + wave2 + 1) * petalLength * (0.3 + layerPhase * 0.4);

        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        // Curved petals - height varies by layer
        const petalCurve = Math.sin(layerPhase * Math.PI) * radius * 0.4;
        const y = (layerPhase - 0.5) * radius * 0.8 + petalCurve;

        // Add center detail particles
        if (layer < 2 && Math.random() > 0.7) {
            const centerR = radius * 0.15 * Math.random();
            const centerAngle = Math.random() * Math.PI * 2;
            points[i * 3] = Math.cos(centerAngle) * centerR;
            points[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.1;
            points[i * 3 + 2] = Math.sin(centerAngle) * centerR;
        } else {
            points[i * 3] = x;
            points[i * 3 + 1] = y;
            points[i * 3 + 2] = z;
        }
    }
    return points;
}

// Sonic Rings - Three concentric rings representing bass/mid/high frequencies
const getSpiralShellPoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);
    const rings = 3;
    const samplesPerRing = Math.floor(samples / rings);

    for (let ring = 0; ring < rings; ring++) {
        const ringRadius = radius * (0.4 + ring * 0.35); // Different radii for each ring
        const ringParticles = samplesPerRing;

        for (let i = 0; i < ringParticles; i++) {
            const index = ring * ringParticles + i;
            if (index >= samples) break;

            const angle = (i / ringParticles) * Math.PI * 2;

            // Add some thickness to the ring
            const thickness = ringRadius * 0.08;
            const thicknessAngle = Math.random() * Math.PI * 2;
            const thicknessR = Math.random() * thickness;

            const x = Math.cos(angle) * (ringRadius + thicknessR);
            const z = Math.sin(angle) * (ringRadius + thicknessR);

            // Vertical position varies by ring
            const yOffset = (ring - 1) * radius * 0.25;
            const y = yOffset + (Math.random() - 0.5) * radius * 0.05;

            points[index * 3] = x;
            points[index * 3 + 1] = y;
            points[index * 3 + 2] = z;
        }
    }

    return points;
}

// Möbius Strip - Twisted ring
const getMobiusStripPoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);

    for (let i = 0; i < samples; i++) {
        const t = (i / samples) * Math.PI * 2; // One full loop
        const u = t; // Angle around the strip

        // Möbius strip parametric equations
        const v = ((i % 20) - 10) / 10; // Width of strip (-1 to 1)
        const stripWidth = radius * 0.4;

        const x = (radius + stripWidth * v * Math.cos(u / 2)) * Math.cos(u);
        const y = stripWidth * v * Math.sin(u / 2);
        const z = (radius + stripWidth * v * Math.cos(u / 2)) * Math.sin(u);

        points[i * 3] = x;
        points[i * 3 + 1] = y;
        points[i * 3 + 2] = z;
    }
    return points;
}

// Fractal Tree - Branching structure
const getFractalTreePoints = (samples: number, radius: number) => {
    const points = new Float32Array(samples * 3);

    let index = 0;
    const addBranch = (originX, originY, originZ, length, angle, depth, maxDepth) => {
        if (depth > maxDepth || index >= samples) return;

        const endX = originX + Math.sin(angle) * length;
        const endY = originY + Math.cos(angle) * length;
        const endZ = originZ;

        // Add points along this branch
        const pointsPerBranch = Math.max(1, Math.floor(samples / 63)); // ~63 branches in binary tree to depth 6
        for (let i = 0; i < pointsPerBranch && index < samples; i++) {
            const t = i / pointsPerBranch;
            points[index * 3] = originX + (endX - originX) * t;
            points[index * 3 + 1] = originY + (endY - originY) * t;
            points[index * 3 + 2] = originZ + (Math.random() - 0.5) * radius * 0.1;
            index++;
        }

        // Recursive branching
        const newLength = length * 0.7;
        const angleOffset = 0.5;
        addBranch(endX, endY, endZ, newLength, angle + angleOffset, depth + 1, maxDepth);
        addBranch(endX, endY, endZ, newLength, angle - angleOffset, depth + 1, maxDepth);
    };

    addBranch(0, -radius, 0, radius * 0.5, 0, 0, 5);

    // Fill remaining with random points near tree
    while (index < samples) {
        points[index * 3] = (Math.random() - 0.5) * radius;
        points[index * 3 + 1] = (Math.random() - 0.5) * radius * 2;
        points[index * 3 + 2] = (Math.random() - 0.5) * radius;
        index++;
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
  const visualShape = useSettingsStore(state => state.visualShape);
  const shapeTransitionTime = useSettingsStore(state => state.shapeTransitionTime);
  const { setSetting } = useSettingsStore();
  
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
  const targetPositions = useMemo(() => {
    switch(visualShape) {
        case 'cube': return getCubePoints(count, radius);
        case 'pyramid': return getPyramidPoints(count, radius);
        case 'flower': return getFlowerPoints(count, radius);
        case 'dna': return getDNAPoints(count, radius);
        case 'spiral': return getSpiralPoints(count, radius);
        case 'shell': return getSpiralShellPoints(count, radius);
        case 'mobius': return getMobiusStripPoints(count, radius);
        case 'tree': return getFractalTreePoints(count, radius);
        case 'sphere':
        default: return getFibonacciSpherePoints(count, radius);
    }
  }, [radius, visualShape]);

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

  // Shape morphing state
  const previousTargetPositions = useRef<Float32Array | null>(null);
  const shapeTransitionProgress = useRef(0); // 0 = old shape, 1 = new shape
  const currentVisualShape = useRef(visualShape);

  // Auto shape switch state
  const shapes: Array<'sphere' | 'cube' | 'pyramid' | 'flower' | 'dna' | 'spiral' | 'shell' | 'mobius' | 'tree'> = ['sphere', 'cube', 'pyramid', 'flower', 'dna', 'spiral', 'shell', 'mobius', 'tree'];
  const lastShapeSwitchTime = useRef(0); 

  // Custom time accumulator for speed control
  const simulatedTime = useRef(0);

  useFrame((state, delta) => {
    const { getFrequencyData, isPlaying, hasInteracted } = useAudioStore.getState();

    // Get auto switch settings
    const autoShapeSwitch = useSettingsStore.getState().autoShapeSwitch;
    const autoShapeInterval = useSettingsStore.getState().autoShapeInterval;

    // Auto shape switch logic
    if (autoShapeSwitch && hasInteracted) {
      lastShapeSwitchTime.current += delta;
      if (lastShapeSwitchTime.current >= autoShapeInterval) {
        lastShapeSwitchTime.current = 0;
        const currentIndex = shapes.indexOf(visualShape);
        const nextIndex = (currentIndex + 1) % shapes.length;
        setSetting('visualShape', shapes[nextIndex]);
      }
    } else {
      lastShapeSwitchTime.current = 0;
    }

    // Global Speed Control
    // Improve: If speed is 0, time stops. We use a base multiplier + bass boost for the time flow itself?
    // Actually, userSpeed is the "rotationSpeed" setting. Let's treat it as the "Simulation Speed".
    // 0 = Frozen time (except audio reactivity amplitude), 1 = Normal speed.
    const {
        enableShake, shakeIntensity, useHighQualityTexture, enableMorphing, rotationSpeed: userSpeed,
        colorTheme, particleSize, audioSensitivity, particleResetTime,
        bassBoost, bassThreshold, morphingIntensity, pulseIntensity
    } = useSettingsStore.getState();
    
    // Scale delta by userSpeed. 
    // The visualizer relies on "time" for noise scrolling and rotation.
    // We'll use this custom time instead of state.clock.getElapsedTime()
    simulatedTime.current += delta * userSpeed;
    const time = simulatedTime.current;

    // Update Transition Progress
    const targetProgress = hasInteracted ? 1 : 0;
    // Convert seconds (user-friendly) to per-frame speed
    // At 60fps: speed = 1 / (seconds * 60)
    const speed = 1 / (particleResetTime * 60);

    // Check for shape changes and trigger transition
    if (currentVisualShape.current !== visualShape) {
      // Store old target positions if we have a previous transition
      if (shapeTransitionProgress.current >= 0.99) {
        previousTargetPositions.current = new Float32Array(targetPositions);
      }
      currentVisualShape.current = visualShape;
      shapeTransitionProgress.current = 0;
    }

    // Update shape transition progress
    const shapeSpeed = 1 / (shapeTransitionTime * 60);
    if (shapeTransitionProgress.current < 1) {
      shapeTransitionProgress.current = Math.min(shapeTransitionProgress.current + shapeSpeed, 1);
    } 
    
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
             // Enhanced bass detection - wider frequency range and weighted
             for (let i = 0; i < 20; i++) {
                 const weight = 1.0 - (i / 40); // Weighted more heavily for lower frequencies
                 bassSum += dataArray[i] * weight;
             }
             for (let i = 20; i < 100; i++) midSum += dataArray[i];
             for (let i = 100; i < 500; i++) highSum += dataArray[i];

             // Apply audio sensitivity
             bassSum *= audioSensitivity;
             midSum *= audioSensitivity;
             highSum *= audioSensitivity;
        }

        // Normalize with actual sample counts
        const bassSamples = 14.5; // Approximate weighted average (sum of weights 1.0 to 0.5)
        const targetBass = Math.min(bassSum / (bassSamples * 255), 2.0) * bassBoost; // Apply bass boost multiplier
        const targetMid = Math.min(midSum / (80 * 255), 1.5);
        const targetHigh = Math.min(highSum / (400 * 255), 1.5);

        // Faster smoothing for more responsive bass
        smoothedBass.current += (targetBass - smoothedBass.current) * 0.4; // Increased from 0.2
        smoothedMid.current += (targetMid - smoothedMid.current) * 0.15;
        smoothedHigh.current += (targetHigh - smoothedHigh.current) * 0.1;

        const bassVal = smoothedBass.current;
        const midVal = smoothedMid.current;
        const highVal = smoothedHigh.current;

        // --- CAMERA SHAKE ---
        if (groupRef.current && hasInteracted && enableShake) {
             const shakeAmp = Math.max(0, (bassVal - bassThreshold) * shakeIntensity * 1.5);
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

            // Current shape target position
            let tx = targetPositions[i3];
            let ty = targetPositions[i3 + 1];
            let tz = targetPositions[i3 + 2];

            // Apply shape morphing if transitioning
            if (previousTargetPositions.current && shapeTransitionProgress.current < 1) {
              const shapeProgress = easeInOutCubic(shapeTransitionProgress.current);
              const px = previousTargetPositions.current[i3];
              const py = previousTargetPositions.current[i3 + 1];
              const pz = previousTargetPositions.current[i3 + 2];

              // Lerp between old and new shape
              tx = px + (tx - px) * shapeProgress;
              ty = py + (ty - py) * shapeProgress;
              tz = pz + (tz - pz) * shapeProgress;
            }

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
                    const nAmp = 0.3 + bassVal * morphingIntensity;
                    const nFreq = 0.3 + midVal * 1.5;

                    const noise = noise3D(nx * nFreq + time * 0.5, ny * nFreq + time * 0.5, nz * nFreq);
                    const noiseSpike = (highVal > 0.3 && Math.random() > 0.95) ? (highVal * 1.5) : 0;

                    const wave = (noise * nAmp + noiseSpike) * progress;
                    dist += wave;
                } else {
                    // Simple Bass Pulse instead of Morphing - customizable intensity
                    dist += bassVal * pulseIntensity * progress;
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

        const targetHue = (baseHue + (bassVal * 0.15 * progress)) % 1.0; // Increased from 0.1 to 0.15
        const mat = pointsRef.current.material as THREE.PointsMaterial;
        mat.color.setHSL(targetHue, 0.8, 0.4 + bassVal * 0.4 * progress); // Increased from 0.3 to 0.4

        const baseSize = useHighQualityTexture ? 0.3 : 0.12;
        mat.size = (baseSize * Math.max(0.5, progress) + bassVal * 0.15) * particleSize; // Increased from 0.1 to 0.15 
        
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
