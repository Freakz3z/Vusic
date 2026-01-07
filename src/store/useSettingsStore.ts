import { create } from 'zustand'

interface SettingsState {
  // Visuals
  enableMorphing: boolean;
  enableShake: boolean;
  shakeIntensity: number; // 0.0 to 1.0 (default 0.2)
  useHighQualityTexture: boolean;
  rotationSpeed: number; // 0.0 to 2.0 (default 0.2)
  
  // Customization
  colorTheme: number; // 0.0 to 1.0 Hue offset
  bloomStrength: number; // 0.0 to 3.0
  particleSize: number; // 0.5 to 2.0
  sphereRadius: number; // 2.0 to 10.0
  audioSensitivity: number; // 0.5 to 2.0

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
  enableShake: true,
  shakeIntensity: 0.2,
  useHighQualityTexture: true,
  rotationSpeed: 0.2,

  colorTheme: 0.6, // Default to Cyan (0.6)
  bloomStrength: 1.5,
  particleSize: 1.0,
  sphereRadius: 5.0,
  audioSensitivity: 1.0,

  enableImmersiveMode: true,
  immersiveDelay: 3,
  
  isUIVisible: true,
  language: 'zh', // Default to Chinese as requested by user context (communicating in Chinese)

  setSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
  setUIVisibility: (visible) => set({ isUIVisible: visible }),
  setLanguage: (lang) => set({ language: lang }),
}))
