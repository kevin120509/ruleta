import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const Heart = ({ delay, duration, x, scale }: { delay: number; duration: number; x: number; scale: number }) => (
  <motion.path
    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
    fill="currentColor"
    initial={{ y: "110vh", opacity: 0, scale: 0 }}
    animate={{ 
      y: "-10vh", 
      opacity: [0, 0.8, 0], 
      scale: [0, scale, scale * 1.2],
      rotate: [0, 10, -10, 0]
    }}
    transition={{
      duration: duration,
      ease: "linear",
      repeat: Infinity,
      delay: delay,
    }}
    className="text-rose-500/20"
    style={{ x: `${x}vw`, position: 'absolute' }}
  />
);

export const HeartsBackground = React.memo(() => {
  const hearts = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      x: Math.random() * 100,
      scale: 0.5 + Math.random() * 1.5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Gradient Overlay for warm feeling */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-950/20 to-rose-950/40"></div>
      
      <svg className="absolute inset-0 w-full h-full">
        {hearts.map((h) => (
          <Heart key={h.id} delay={h.delay} duration={h.duration} x={h.x} scale={h.scale} />
        ))}
      </svg>
    </div>
  );
});
