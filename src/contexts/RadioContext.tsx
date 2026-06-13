import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { RadioStation } from '@/data/radioStations';
import { getFavorites, toggleFavorite } from '@/lib/radioFavorites';
import { radioStations } from '@/data/radioStations';
import { trackRadioHeartbeat } from '@/lib/analytics';

interface RadioState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  isBuffering: boolean;
  error: string | null;
  volume: number;
  isMuted: boolean;
  panelOpen: boolean;
  favorites: number[];
  flashingId: number | null;
}

interface RadioContextType extends RadioState {
  play: (station: RadioStation) => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  retry: () => void;
  openPanel: () => void;
  closePanel: () => void;
  toggleFavoriteStation: (id: number) => void;
  isFavorite: (id: number) => boolean;
  flashStation: (id: number) => void;
}

const RadioContext = createContext<RadioContextType | null>(null);

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error('useRadio must be used within RadioProvider');
  return ctx;
}

const LS_STATION = 'radio_last_station';
const LS_VOLUME = 'radio_volume';
const LS_MUTED = 'radio_muted';

function updateMediaSession(station: RadioStation | null, playing: boolean) {
  if (!('mediaSession' in navigator) || !station) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: station.name,
    artist: `${station.country} • ${station.city}`,
    album: 'شبام24 - راديو مباشر',
  });
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

export function RadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<RadioState>({
    currentStation: null,
    isPlaying: false,
    isBuffering: false,
    error: null,
    volume: parseFloat(localStorage.getItem(LS_VOLUME) || '0.7'),
    isMuted: localStorage.getItem(LS_MUTED) === 'true',
    panelOpen: false,
    favorites: getFavorites(),
    flashingId: null,
  });

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    audio.addEventListener('waiting', () => setState(s => ({ ...s, isBuffering: true })));
    audio.addEventListener('playing', () => {
      setState(s => {
        updateMediaSession(s.currentStation, true);
        return { ...s, isBuffering: false, isPlaying: true, error: null };
      });
    });
    audio.addEventListener('pause', () => {
      setState(s => {
        updateMediaSession(s.currentStation, false);
        return { ...s, isPlaying: false };
      });
    });
    audio.addEventListener('error', () => {
      setState(s => ({ ...s, isBuffering: false, isPlaying: false, error: 'فشل تحميل البث. تحقق من الاتصال.' }));
    });

    return () => { audio.pause(); audio.src = ''; };
  }, []);

  // Media session actions
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => {
      if (state.currentStation) playStation(state.currentStation);
    });
    navigator.mediaSession.setActionHandler('pause', () => { audioRef.current?.pause(); });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (state.currentStation) {
        const idx = radioStations.findIndex(s => s.id === state.currentStation!.id);
        playStation(radioStations[(idx + 1) % radioStations.length]);
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (state.currentStation) {
        const idx = radioStations.findIndex(s => s.id === state.currentStation!.id);
        playStation(radioStations[(idx - 1 + radioStations.length) % radioStations.length]);
      }
    });
  }, [state.currentStation]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : state.volume;
    }
    localStorage.setItem(LS_VOLUME, String(state.volume));
    localStorage.setItem(LS_MUTED, String(state.isMuted));
  }, [state.volume, state.isMuted]);

  // Radio listener heartbeat: ping analytics every 30s while playing.
  useEffect(() => {
    if (!state.isPlaying || !state.currentStation) return;
    trackRadioHeartbeat(state.currentStation.id);
    const t = window.setInterval(() => {
      trackRadioHeartbeat(state.currentStation?.id ?? null);
    }, 30_000);
    return () => window.clearInterval(t);
  }, [state.isPlaying, state.currentStation?.id]);

  const playStation = useCallback((station: RadioStation) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = station.stream_url;
    audio.volume = state.isMuted ? 0 : state.volume;
    audio.play().catch(() => {});
    setState(s => ({ ...s, currentStation: station, isBuffering: true, error: null }));
    localStorage.setItem(LS_STATION, JSON.stringify(station));
  }, [state.volume, state.isMuted]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) pause();
    else if (state.currentStation) playStation(state.currentStation);
  }, [state.isPlaying, state.currentStation, playStation, pause]);

  const setVolume = useCallback((v: number) => {
    setState(s => ({ ...s, volume: v, isMuted: false }));
  }, []);

  const toggleMute = useCallback(() => {
    setState(s => ({ ...s, isMuted: !s.isMuted }));
  }, []);

  const retry = useCallback(() => {
    if (state.currentStation) playStation(state.currentStation);
  }, [state.currentStation, playStation]);

  const openPanel = useCallback(() => setState(s => ({ ...s, panelOpen: true })), []);
  const closePanel = useCallback(() => setState(s => ({ ...s, panelOpen: false })), []);

  const toggleFavoriteStation = useCallback((id: number) => {
    const updated = toggleFavorite(id);
    setState(s => ({ ...s, favorites: updated }));
  }, []);

  const isFavorite = useCallback((id: number) => {
    return state.favorites.includes(id);
  }, [state.favorites]);

  const flashStation = useCallback((id: number) => {
    setState(s => ({ ...s, flashingId: id }));
    setTimeout(() => setState(s => (s.flashingId === id ? { ...s, flashingId: null } : s)), 2400);
  }, []);

  // Handle ?station=ID deep link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('station');
    if (!sid) return;
    const id = Number(sid);
    const station = radioStations.find(s => s.id === id);
    if (!station) return;
    setTimeout(() => {
      setState(s => ({ ...s, panelOpen: true }));
      playStation(station);
      flashStation(id);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('station');
      window.history.replaceState({}, '', url.toString());
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RadioContext.Provider value={{
      ...state,
      play: playStation,
      pause,
      togglePlay,
      setVolume,
      toggleMute,
      retry,
      openPanel,
      closePanel,
      toggleFavoriteStation,
      isFavorite,
      flashStation,
    }}>
      {children}
    </RadioContext.Provider>
  );
}
