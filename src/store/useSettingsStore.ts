import { create } from 'zustand'

interface SettingsState {
  // Visuals
  enableMorphing: boolean;
  enableShake: boolean;
  shakeIntensity: number; // 0.0 to 1.0 (default 0.2)
  useHighQualityTexture: boolean;
  rotationSpeed: number; // 0.0 to 2.0 (default 0.2)
  bassBoost: number; // 1.0 to 3.0, bass response multiplier (default 1.5)
  bassThreshold: number; // 0.0 to 0.5, minimum bass level to trigger effects (default 0.2)
  morphingIntensity: number; // 1.0 to 10.0, how much bass affects morphing (default 5.0)
  pulseIntensity: number; // 0.1 to 2.0, bass pulse strength when morphing is off (default 0.8)
  
  // Customization
  colorTheme: number; // 0.0 to 1.0 Hue offset
  bloomStrength: number; // 0.0 to 3.0
  particleSize: number; // 0.5 to 2.0
  sphereRadius: number; // 2.0 to 10.0
  visualShape: 'sphere' | 'cube' | 'pyramid' | 'flower' | 'dna' | 'spiral' | 'shell' | 'mobius' | 'tree'; // All 9 shapes
  autoShapeSwitch: boolean; // Auto switch shapes
  autoShapeInterval: number; // Seconds between shape switches (default 10)
  audioSensitivity: number; // 0.5 to 2.0
  particleResetTime: number; // 0.5 to 5.0 seconds, controls transition duration (default 2.0)
  shapeTransitionTime: number; // 0.5 to 5.0 seconds, controls shape morphing duration (default 1.5)

  // Behavior
  enableImmersiveMode: boolean; // Auto-hide UI
  immersiveDelay: number; // seconds, default 3
  
  // State for UI Visibility (updated by interaction)
  isUIVisible: boolean;

  // Language
  language: 'en' | 'zh';

  // Actions
  setSetting: (key: keyof SettingsState, value: any) => void;
  setUIVisibility: (visible: boolean) => void;
  setLanguage: (lang: 'en' | 'zh') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  enableMorphing: true,
  enableShake: false,
  shakeIntensity: 0.2,
  useHighQualityTexture: true,
  rotationSpeed: 0.2,
  bassBoost: 1.0, // Default: no boost (original behavior)
  bassThreshold: 0.5, // Default: higher threshold (less sensitive)
  morphingIntensity: 3.0, // Default: original morphing intensity
  pulseIntensity: 0.5, // Default: original pulse intensity

  colorTheme: 0.6, // Default to Cyan (0.6)
  bloomStrength: 1.5,
  particleSize: 1.0,
  sphereRadius: 3.5,
  visualShape: 'sphere', // Default
  autoShapeSwitch: false, // Auto switch disabled by default
  autoShapeInterval: 10, // Switch every 10 seconds
  audioSensitivity: 0.7,
  particleResetTime: 2.0, // Default 2 seconds transition
  shapeTransitionTime: 1.5, // Default 1.5 seconds for shape transitions

  enableImmersiveMode: false,
  immersiveDelay: 3,
  
  isUIVisible: true,
  language: 'zh', // Default to Chinese as requested by user context (communicating in Chinese)

  setSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
  setUIVisibility: (visible) => set({ isUIVisible: visible }),
  setLanguage: (lang) => set({ language: lang }),
}))
