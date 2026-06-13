import { useRadio } from '@/contexts/RadioContext';
import { Volume2, VolumeX, Play, Pause, Radio, Loader2, ChevronUp } from 'lucide-react';

export default function MiniPlayer() {
  const {
    currentStation,
    isPlaying,
    isBuffering,
    togglePlay,
    openPanel,
    panelOpen,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = useRadio();

  if (!currentStation || panelOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg z-[997] animate-in slide-in-from-bottom duration-200" dir="rtl">
      <div className="container mx-auto px-3 py-2">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shrink-0 hover:bg-destructive/90 transition-colors"
          >
            {isBuffering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 mr-[-2px]" />
            )}
          </button>

          {/* Station Info */}
          <div className="flex-1 min-w-0" onClick={openPanel} role="button" tabIndex={0}>
            <p className="font-arabic font-bold text-sm truncate text-card-foreground">{currentStation.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {currentStation.country} • {currentStation.city}
            </p>
          </div>

          {/* Visualizer bars */}
          {isPlaying && (
            <div className="flex gap-0.5 items-end h-4 shrink-0">
              <span className="w-1 bg-destructive rounded-full animate-pulse" style={{ height: '60%' }} />
              <span className="w-1 bg-destructive rounded-full animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }} />
              <span className="w-1 bg-destructive rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0.4s' }} />
            </div>
          )}

          {/* Volume - desktop only */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button onClick={toggleMute} className="p-1 text-muted-foreground hover:text-card-foreground">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range" min="0" max="1" step="0.05"
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-destructive" dir="ltr"
            />
          </div>

          {/* Open panel */}
          <button onClick={openPanel} className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0">
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
