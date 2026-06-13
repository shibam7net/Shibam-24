import { useEffect, useRef } from 'react';

interface Props {
  isPlaying: boolean;
}

export default function AudioVisualizer({ isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      const w = canvas.width = canvas.clientWidth * 2;
      const h = canvas.height = canvas.clientHeight * 2;
      ctx.clearRect(0, 0, w, h);

      const barW = 6;
      const gap = 3;
      const count = Math.floor(w / (barW + gap));

      for (let i = 0; i < count; i++) {
        const factor = Math.sin(time + i * 0.15) * 0.4 + 0.5;
        const rand = Math.random() * 0.2;
        const barH = Math.max(4, (factor + rand) * h * 0.8);
        const x = i * (barW + gap);

        const grad = ctx.createLinearGradient(x, h - barH, x, h);
        grad.addColorStop(0, 'hsl(0, 72%, 51%)');
        grad.addColorStop(1, 'hsl(0, 72%, 41%)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, h - barH, barW, barH);
      }

      time += 0.06;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  if (!isPlaying) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-10 rounded-lg opacity-60"
      style={{ display: 'block' }}
    />
  );
}
