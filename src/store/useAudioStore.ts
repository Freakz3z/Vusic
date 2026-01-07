import { create } from 'zustand';

export interface Track {
    id: string | number;
    name: string;
    artist: string;
    url: string;
    cover?: string;
}

interface AudioState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  audioElement: HTMLAudioElement | null;
  sourceNode: MediaElementAudioSourceNode | null;
  
  // Input Mode state
  activeInput: 'file' | 'mic' | 'system';
  mediaStream: MediaStream | null;
  inputStreamNode: MediaStreamAudioSourceNode | null;

  isPlaying: boolean;
  hasInteracted: boolean;
  volume: number;
  
  // Playlist
  playlist: Track[];
  currentTrackIndex: number;
  isPlaylistOpen: boolean;
  
  initializeAudio: () => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  togglePlaylist: () => void;
  
  // Input switching
  setInputSource: (mode: 'file' | 'mic' | 'system') => Promise<void>; 
  
  setSource: (fileOrUrl: string | File) => void;
  setVolume: (val: number) => void;
  
  // Playlist actions
  addToPlaylist: (track: Track) => void;
  addTracks: (tracks: Track[]) => void;
  playTrack: (index: number) => void;
  playNext: () => void;
  playPrev: () => void;

  // Data access
  getFrequencyData: (dataArray: Uint8Array) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  audioContext: null,
  analyser: null,
  audioElement: null,
  sourceNode: null,
  
  activeInput: 'file',
  mediaStream: null,
  inputStreamNode: null,

  isPlaying: false,
  hasInteracted: false,
  volume: 0.5,
  
  playlist: [],
  currentTrackIndex: 0,
  isPlaylistOpen: false,

  initializeAudio: () => {
    if (get().audioContext) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048; // Increased for better resolution
    analyser.smoothingTimeConstant = 0.85; // Smoother

    const audioElement = new Audio();
    audioElement.crossOrigin = "anonymous";
    const sourceNode = audioContext.createMediaElementSource(audioElement);
    sourceNode.connect(analyser);
    sourceNode.connect(audioContext.destination);
    // analyser.connect(audioContext.destination); // Avoid feedback loops for Mic/System inputs

    // Auto play next track
    audioElement.addEventListener('ended', () => {
        const { playlist, currentTrackIndex, playNext } = get();
        if (playlist.length > 0 && currentTrackIndex < playlist.length - 1) {
            playNext();
        } else {
            set({ isPlaying: false });
        }
    });
    audioElement.volume = get().volume;

    set({ audioContext, analyser, audioElement, sourceNode, hasInteracted: true });
  },

  play: () => {
    const { audioElement, audioContext, activeInput, setInputSource } = get();
    
    // If we are in stream mode, switch back to file first
    if (activeInput !== 'file') {
        setInputSource('file'); 
        // setInputSource handles the cleanup, but it's async. 
        // For simplicity, we assume user clicks play = they want file mode.
        // We'll let the async switch happen then play.
        // Ideally we await it but play is sync. 
        // Let's rely on setInputSource('file') to also trigger play or ready state.
        return; 
    }

    if (!audioElement || !audioContext) return;
    
    // Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    audioElement.play().then(() => {
        set({ isPlaying: true });
    }).catch(e => console.error("Play failed", e));
  },

  pause: () => {
    const { audioElement } = get();
    if (!audioElement) return;
    audioElement.pause();
    set({ isPlaying: false });
  },

  togglePlay: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) pause();
    else play();
  },

  togglePlaylist: () => set((state) => ({ isPlaylistOpen: !state.isPlaylistOpen })),

  setInputSource: async (mode) => {
    const { activeInput, mediaStream, inputStreamNode, pause, hasInteracted, initializeAudio } = get();
    
    // 0. Init if needed
    if (!hasInteracted) initializeAudio();
    const ctx = get().audioContext; 
    const analyser = get().analyser;
    
    if (!ctx || !analyser) return;

    // 1. Cleanup current stream if any
    if (activeInput !== 'file') {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (inputStreamNode) {
            inputStreamNode.disconnect();
        }
        set({ mediaStream: null, inputStreamNode: null });
    } else {
        // Leaving file mode
        pause(); // Stop file playback
        if (get().sourceNode) {
            try {
               get().sourceNode!.disconnect();
            } catch(e) { /* ignore disconnected */ }
        }
    }

    // 2. Switch to new mode
    if (mode === 'file') {
        // Reconnect file player
        if (get().sourceNode) {
             get().sourceNode!.connect(analyser);
             get().sourceNode!.connect(ctx.destination);
        }
        set({ activeInput: 'file' });
        // Optional: Auto resume? User probably clicked play.
        // If this was called explicitly, we just set state.
    } 
    else {
        // Mic or System
        try {
            let stream: MediaStream;
            
            if (mode === 'mic') {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } else {
                // System Audio (Display Media)
                // @ts-ignore - getDisplayMedia exists
                stream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true, // Required for getDisplayMedia usually
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                    }
                });
            }

            const streamSource = ctx.createMediaStreamSource(stream);
            streamSource.connect(analyser);
            
            set({ activeInput: mode, mediaStream: stream, inputStreamNode: streamSource });
            
            if (ctx.state === 'suspended') ctx.resume();
            
            // Listen for stream end (user clicked "stop sharing")
            stream.getTracks()[0].onended = () => {
                get().setInputSource('file'); // Revert to file on stop
            };

        } catch (err) {
            console.error("Input access denied:", err);
            // Fallback to file
            get().setInputSource('file');
            // Notify ui? can't easily from here without toast.
        }
    }
  },

  setSource: (fileOrUrl) => {
    const { initializeAudio, hasInteracted, play } = get();
    if (!hasInteracted) initializeAudio();
    
    if (!get().audioElement) return; // Should be init by now

    const url = typeof fileOrUrl === 'string' 
      ? fileOrUrl 
      : URL.createObjectURL(fileOrUrl);

    get().audioElement!.src = url;
    play(); // Auto play on new source
  },

  setVolume: (val) => {
    const { audioElement } = get();
    if (audioElement) audioElement.volume = val;
    set({ volume: val });
  },

  addToPlaylist: (track) => {
      set(state => ({ playlist: [...state.playlist, track] }));
  },

  addTracks: (tracks) => {
      set(state => ({ playlist: [...state.playlist, ...tracks] }));
  },

  playTrack: (index) => {
      const { playlist, setSource } = get();
      if (index >= 0 && index < playlist.length) {
          const track = playlist[index];
          setSource(track.url);
          set({ currentTrackIndex: index });
      }
  },

  playNext: () => {
      const { playlist, currentTrackIndex, playTrack } = get();
      if (currentTrackIndex < playlist.length - 1) {
          playTrack(currentTrackIndex + 1);
      }
  },

  playPrev: () => {
      const { currentTrackIndex, playTrack } = get();
      if (currentTrackIndex > 0) {
          playTrack(currentTrackIndex - 1);
      }
  },

  getFrequencyData: (dataArray) => {
    const { analyser } = get();
    if (analyser) {
      analyser.getByteFrequencyData(dataArray as any);
    }
  }
}));
