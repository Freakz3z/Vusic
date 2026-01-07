export const translations = {
  en: {
    // Intro
    enter: "ENTER VUSIC",
    explore: "CLICK TO START",
    warning: "Photosensitivity Warning: Flashing Lights",
    
    // UI - Controls
    import: "Import", // Shortened for button
    importFull: "Import Audio",
    playlist: "Playlist",
    micMode: "Mic Input",
    sysMode: "System Audio",
    micActive: "Mic ON",
    sysActive: "System ON",

    // UI - Player
    playerTitle: "VUSIC PLAYER",
    searchPlaceholder: "Search Netease Cloud...",
    searchResults: "SEARCH RESULTS",
    currentPlaylist: "CURRENT PLAYLIST",
    noResults: "No results found.",
    noTracks: "No tracks added",
    errorConnection: "Connection failed. Ensure API is running.",
    vipError: "Could not play song (VIP or Unavailable).",
    tracks: "TRACKS",

    // UI - SettingsPanel
    settingsTitle: "SETTINGS",
    visuals: "VISUALS",
    morphing: "Geometry Morphing",
    glow: "Glow Textures",
    glowDesc: "Replaces dots with glow sprites",
    speed: "Rotation Speed",
    shake: "Bass Shake",
    intensity: "Intensity",
    
    // Customization
    baseColor: "Color Theme",
    bloom: "Bloom Strength",
    pSize: "Particle Size",
    sSize: "Geometry Scale",
    shape: "Geometry Shape",
    shapes: {
        sphere: "Sphere",
        cube: "Cube",
        torus: "Torus",
        particles: "Cloud",
        dna: "DNA Helix",
        spiral: "Galaxy"
    },
    sensitivity: "Audio Reactivity",

    immersion: "IMMERSION",
    autoHide: "Immersive Mode",
    autoHideDesc: "Hides UI, hover to show",
    language: "LANGUAGE",
    
    // Overlay
    subtitle: "AUDIO REACTIVE SYSTEM"
  },
  zh: {
    // Intro
    enter: "进入 VUSIC",
    explore: "点击开始体验",
    warning: "光敏性癫痫警告：包含闪烁画面",
    
    // UI - Controls
    import: "导入",
    importFull: "导入音频",
    playlist: "播放列表",
    micMode: "麦克风输入",
    sysMode: "系统音频",
    micActive: "麦克风开",
    sysActive: "监听中",

    // UI - Player
    playerTitle: "VUSIC 播放器",
    searchPlaceholder: "搜索网易云音乐...",
    searchResults: "搜索结果",
    currentPlaylist: "当前列表",
    noResults: "未找到结果",
    noTracks: "暂无曲目",
    errorConnection: "连接失败，请检查API服务",
    vipError: "无法播放 (VIP或不可用)",
    tracks: "首曲目",

    // UI - SettingsPanel
    settingsTitle: "设置",
    visuals: "视觉效果",
    morphing: "几何变形",
    glow: "光晕材质",
    glowDesc: "使用柔光粒子替代像素点",
    speed: "旋转速度",
    shake: "低音震动",
    intensity: "震动强度",
    
    // Customization
    baseColor: "主题色调",
    bloom: "发光强度",
    pSize: "粒子大小",
    sSize: "图形大小",
    shape: "粒子形状",
    shapes: {
        sphere: "球体",
        cube: "立方体",
        torus: "环面",
        particles: "星云",
        dna: "DNA螺旋",
        spiral: "银河"
    },
    sensitivity: "响应灵敏度",

    immersion: "沉浸体验",
    autoHide: "沉浸模式",
    autoHideDesc: "隐藏界面，鼠标悬停显示",
    language: "语言选择",

    // Overlay
    subtitle: "音频响应系统"
  }
};

export type Language = 'en' | 'zh';
export type TranslationKey = keyof typeof translations.en;
