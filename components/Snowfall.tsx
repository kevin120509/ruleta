import React, { memo, useEffect, useRef } from 'react';

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
}

/**
 * Nieve ligera en un solo <canvas>. Se mueve por tiempo (no por cuadro), así va igual
 * en pantallas de 60 o 144 Hz, y se pausa sola cuando la pestaña no está visible.
 */
export const Snowfall = memo(({ density = 1 }: { density?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    // Resolución reducida a propósito: la nieve es borrosa y así cuesta muy poco.
    const scale = Math.min(window.devicePixelRatio || 1, 1.25);

    const makeFlake = (randomY: boolean): Flake => {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -10,
        r: 0.8 + depth * 2.6,
        speed: 18 + depth * 55,
        drift: 8 + Math.random() * 22,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.35 + depth * 0.6,
      };
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const target = Math.round(Math.min(220, (w * h) / 9000) * density);
      flakes = Array.from({ length: target }, () => makeFlake(true));
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      for (const f of flakes) {
        f.y += f.speed * dt;
        const x = f.x + Math.sin(elapsed * 0.8 + f.phase) * f.drift;
        if (f.y > h + 10) {
          f.y = -10;
          f.x = Math.random() * w;
        }
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(render);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (document.visibilityState === 'visible') {
        last = performance.now();
        raf = requestAnimationFrame(render);
      }
    };

    if (reduce) {
      render(performance.now());
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(render);
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" aria-hidden />;
});
Snowfall.displayName = 'Snowfall';
