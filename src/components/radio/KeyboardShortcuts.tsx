import { useEffect } from 'react';
import { useRadio } from '@/contexts/RadioContext';
import { radioStations } from '@/data/radioStations';

export default function KeyboardShortcuts() {
  const { togglePlay, setVolume, volume, toggleMute, currentStation, play, openPanel } = useRadio();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (currentStation) {
            e.preventDefault();
            const idx = radioStations.findIndex(s => s.id === currentStation.id);
            play(radioStations[(idx + 1) % radioStations.length]);
          }
          break;
        case 'ArrowLeft':
          if (currentStation) {
            e.preventDefault();
            const idx = radioStations.findIndex(s => s.id === currentStation.id);
            play(radioStations[(idx - 1 + radioStations.length) % radioStations.length]);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(volume + 0.05, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(volume - 0.05, 0));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          openPanel();
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, setVolume, volume, toggleMute, currentStation, play, openPanel]);

  return null;
}
