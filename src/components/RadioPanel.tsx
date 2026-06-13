import { useState, useMemo } from 'react';
import { X, Search, Play, Pause, Volume2, VolumeX, Loader2, AlertCircle, RefreshCw, Radio, Heart, Share2 } from 'lucide-react';
import { useRadio } from '@/contexts/RadioContext';
import { radioStations, radioCountries, type RadioStation } from '@/data/radioStations';
import AudioVisualizer from '@/components/radio/AudioVisualizer';
import ShareSheet from '@/components/radio/ShareSheet';
import { nativeShareStation } from '@/lib/radioShare';

export default function RadioPanel() {
  const {
    panelOpen, closePanel, currentStation, isPlaying, isBuffering, error,
    volume, isMuted, play, pause, setVolume, toggleMute, retry,
    favorites, toggleFavoriteStation, isFavorite, flashingId,
  } = useRadio();
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [shareTarget, setShareTarget] = useState<RadioStation | null>(null);

  const handleShare = async (e: React.MouseEvent, station: RadioStation) => {
    e.stopPropagation();
    const used = await nativeShareStation(station);
    if (!used) setShareTarget(station);
  };

  const filtered = useMemo(() => {
    let list = radioStations;
    if (activeTab === 'favorites') {
      list = list.filter(s => favorites.includes(s.id));
    } else if (selectedCountry) {
      list = list.filter(s => s.country === selectedCountry);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.country.toLowerCase().includes(q));
    }
    return list;
  }, [search, selectedCountry, activeTab, favorites]);

  if (!panelOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[998]" onClick={closePanel} />

      <div className="fixed bottom-0 left-0 right-0 z-[999] bg-card border-t border-border rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 h-[50vh] sm:h-[50vh] max-h-[80vh] flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-destructive" />
            <h2 className="font-arabic font-bold text-lg text-card-foreground">راديو مباشر</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{radioStations.length} محطة</span>
          </div>
          <button onClick={closePanel} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Now Playing Bar */}
        {currentStation && (
          <div className="px-4 py-2.5 bg-destructive/10 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => isPlaying ? pause() : play(currentStation)} className="w-9 h-9 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shrink-0">
                {isBuffering ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 mr-[-2px]" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-arabic font-bold text-sm truncate text-card-foreground">{currentStation.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentStation.country} • {currentStation.city}</p>
              </div>
              {error && (
                <button onClick={retry} className="flex items-center gap-1 text-xs text-destructive hover:underline shrink-0">
                  <RefreshCw className="w-3 h-3" /> إعادة
                </button>
              )}
              <button
                onClick={() => toggleFavoriteStation(currentStation.id)}
                className="p-1.5 rounded-full hover:bg-muted transition-colors shrink-0"
              >
                <Heart className={`w-4 h-4 transition-colors ${isFavorite(currentStation.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
              </button>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={toggleMute} className="p-1">
                  {isMuted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                </button>
                <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-16 h-1 accent-destructive" dir="ltr" />
              </div>
            </div>
            {/* Audio Visualizer */}
            <AudioVisualizer isPlaying={isPlaying} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-destructive/5 text-destructive text-xs shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 px-4 pt-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-arabic font-bold transition-colors ${activeTab === 'all' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            جميع المحطات
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-arabic font-bold transition-colors flex items-center gap-1.5 ${activeTab === 'favorites' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <Heart className="w-3.5 h-3.5" />
            المفضلات
            {favorites.length > 0 && (
              <span className="text-[10px] bg-card/20 px-1.5 py-0.5 rounded-full">{favorites.length}</span>
            )}
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 px-4 py-2.5 border-b border-border shrink-0">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الدولة أو المدينة..."
              className="w-full bg-muted rounded-lg pr-9 pl-3 py-2 text-sm outline-none text-card-foreground placeholder:text-muted-foreground font-arabic"
            />
          </div>
          {activeTab === 'all' && (
            <select
              value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
              className="bg-muted rounded-lg px-2 py-2 text-sm outline-none text-card-foreground font-arabic min-w-[100px]"
            >
              <option value="">كل الدول</option>
              {radioCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {/* Station List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Radio className="w-8 h-8 mb-2 opacity-50" />
              <p className="font-arabic text-sm">{activeTab === 'favorites' ? 'لا توجد محطات مفضلة بعد' : 'لا توجد نتائج'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(station => {
                const isActive = currentStation?.id === station.id;
                const isThisPlaying = isActive && isPlaying;
                const isFlashing = flashingId === station.id;
                return (
                  <div key={station.id} className={`flex items-center gap-3 px-4 py-3 transition-all hover:bg-muted/50 ${isActive ? 'bg-destructive/5' : ''} ${isFlashing ? 'radio-flash' : ''}`}>
                    <button
                      onClick={() => isThisPlaying ? pause() : play(station)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {isActive && isBuffering ? <Loader2 className="w-4 h-4 animate-spin" /> : isThisPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 mr-[-2px]" />}
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => isThisPlaying ? pause() : play(station)}>
                      <p className={`font-arabic text-sm font-bold truncate ${isActive ? 'text-destructive' : 'text-card-foreground'}`}>{station.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{station.country} • {station.city}</p>
                    </div>
                    <button
                      onClick={(e) => handleShare(e, station)}
                      className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
                      aria-label="مشاركة"
                    >
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => toggleFavoriteStation(station.id)}
                      className="p-2 rounded-full hover:bg-muted transition-colors shrink-0"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFavorite(station.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                    </button>
                    {isThisPlaying && (
                      <div className="flex gap-0.5 items-end h-4 shrink-0">
                        <span className="w-1 bg-destructive rounded-full animate-pulse" style={{ height: '60%' }} />
                        <span className="w-1 bg-destructive rounded-full animate-pulse" style={{ height: '100%', animationDelay: '0.2s' }} />
                        <span className="w-1 bg-destructive rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0.4s' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {shareTarget && <ShareSheet station={shareTarget} onClose={() => setShareTarget(null)} />}
    </>
  );
}
