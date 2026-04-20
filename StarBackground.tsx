import React, { useEffect, useRef } from 'react';

interface Heart {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedY: number;
  swayAmplitude: number;
  swayFrequency: number;
  swayOffset: number;
  color: string;
}

const HEART_COLORS = ['#FF0055', '#FF758F', '#C9184A', '#FF4D6D', '#FFF0F3', '#FFFFFF'];

export const StarBackground = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // --- HEARTS CONFIG ---
    const hearts: Heart[] = [];
    const numHearts = 150;

    for (let i = 0; i < numHearts; i++) {
      hearts.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 15 + 5,
        opacity: Math.random() * 0.5 + 0.1,
        speedY: Math.random() * 1 + 0.5,
        swayAmplitude: Math.random() * 20 + 10,
        swayFrequency: Math.random() * 0.02 + 0.01,
        swayOffset: Math.random() * Math.PI * 2,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]
      });
    }

    // --- CACHE HEART SHAPE ---
    // Optimization: Create a Cache of colored hearts
    // Map colors to cached canvases
    const heartCaches: Record<string, HTMLCanvasElement> = {};
    
    HEART_COLORS.forEach(color => {
         const hc = document.createElement('canvas');
         hc.width = 30; // Max size
         hc.height = 30;
         const hctx = hc.getContext('2d');
         if (hctx) {
             hctx.fillStyle = color;
             hctx.beginPath();
             const size = 20; // Base size for cache
             const x = 15;
             const y = 10;
             const topCurveHeight = size * 0.3;
             hctx.moveTo(x, y + topCurveHeight);
             hctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
             hctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
             hctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
             hctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
             hctx.closePath();
             hctx.fill();
         }
         heartCaches[color] = hc;
    });

    // --- ANIMATION LOOP ---
    let animationFrameId: number;
    let frame = 0;

    const render = () => {
      frame++;
      ctx.fillStyle = '#27000d'; 
      ctx.fillRect(0, 0, width, height);

      hearts.forEach(heart => {
        // Update position
        heart.y -= heart.speedY;
        const sway = Math.sin(frame * heart.swayFrequency + heart.swayOffset) * heart.swayAmplitude;
        
        // Wrap around
        if (heart.y < -50) {
          heart.y = height + 50;
          heart.x = Math.random() * width;
        }

        // Draw cached image
        const cached = heartCaches[heart.color];
        if (cached) {
            ctx.globalAlpha = heart.opacity;
            // Draw image with scale based on heart.size
            // The cached heart is size ~20. 
            // We want to draw at heart.size (5 to 20).
            const scale = heart.size / 20;
            ctx.drawImage(cached, heart.x + sway - 15 * scale, heart.y - 15 * scale, 30 * scale, 30 * scale);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none w-full h-full"
    />
  );
});