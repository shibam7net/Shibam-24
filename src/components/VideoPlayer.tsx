import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

/** Lightweight, fast HTML5 video player with auto poster fallback. Supports mp4/webm/m3u8 (native on Safari). */
export default function VideoPlayer({ src, poster, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | undefined>(poster);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setFailed(false);

    const isHls = /\.m3u8(?:\?|$)/i.test(src);
    let hls: Hls | null = null;
    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setFailed(true);
      });
    } else {
      video.src = src;
    }

    return () => {
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [src]);

  // Capture a poster frame from the video itself if none provided
  const handleLoadedData = () => {
    if (generatedPoster || !videoRef.current) return;
    const v = videoRef.current;
    try {
      v.currentTime = Math.min(0.5, (v.duration || 1) * 0.1);
    } catch {}
  };

  const handleSeeked = () => {
    if (generatedPoster || !videoRef.current) return;
    const v = videoRef.current;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx && canvas.width && canvas.height) {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        setGeneratedPoster(canvas.toDataURL('image/jpeg', 0.7));
      }
    } catch {}
  };

  if (failed) {
    return (
      <div className={`flex min-h-44 w-full items-center justify-center rounded-lg border border-border bg-muted text-sm text-muted-foreground ${className}`}>
        تعذر تشغيل الفيديو
      </div>
    );
  }

  return (
    <div className={`relative w-full bg-muted rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        poster={generatedPoster}
        controls
        playsInline
        preload="metadata"
        className="w-full h-auto max-h-[600px] bg-muted"
        onLoadedData={handleLoadedData}
        onSeeked={handleSeeked}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
