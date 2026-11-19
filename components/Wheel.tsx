import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Participant, WHEEL_COLORS } from '../types';
import {
  easeOutQuart,
  indexAtRotation,
  normalizeRotation,
  secureRandom,
  secureRandomInt,
  targetRotation,
} from '../lib/spin';

const CANVAS_SIZE = 1200;
const RADIUS = CANVAS_SIZE / 2 - 4;
const TAU = Math.PI * 2;
const BULB_COUNT = 28;

export interface WheelHandle {
  /** Gira y resuelve con el índice ganador (el que queda bajo la flecha). null si no se pudo girar. */
  spin: () => Promise<number> | null;
  isSpinning: () => boolean;
}

interface WheelProps {
  participants: Participant[];
  /** Se llama cada vez que una rebanada nueva pasa por la flecha (para el nombre en vivo y el "tic"). */
  onTick?: (index: number) => void;
}

/** Elige el color de cada rebanada evitando que dos vecinas (incluida la última con la primera) repitan. */
// Con muchísimas personas cada rebanada mide 1-3 px y los colores se mezclan en un dorado borroso.
// Entonces se pintan en franjas de varias rebanadas seguidas del mismo color (la flecha sigue eligiendo una sola persona).
const BAND_THRESHOLD = 240;
export function bandSize(len: number): number {
  return len > BAND_THRESHOLD ? Math.ceil(len / 48) : 1;
}

function sliceColorIndex(i: number, len: number): number {
  const n = WHEEL_COLORS.length;
  const g = bandSize(len);
  const bands = Math.ceil(len / g);
  const b = Math.floor(i / g);
  let c = b % n;
  if (bands > 1 && b === bands - 1 && c === 0) c = (bands - 2) % n === 1 ? 2 : 1;
  return c;
}

function drawWheel(canvas: HTMLCanvasElement, participants: Participant[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const c = CANVAS_SIZE / 2;
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const len = participants.length;

  if (len === 0) {
    const g = ctx.createRadialGradient(c, c, 40, c, c, RADIUS);
    g.addColorStop(0, '#1a2e63');
    g.addColorStop(1, '#0a1430');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, RADIUS, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe08a';
    ctx.font = '600 46px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Agrega participantes', c, c - 150);
    ctx.font = '500 34px Fredoka, sans-serif';
    ctx.fillStyle = '#c9d8ee';
    ctx.fillText('para empezar el sorteo', c, c - 100);
    return;
  }

  // Un degradado radial por color: sirve para todas las rebanadas de ese color.
  const gradients = WHEEL_COLORS.map(col => {
    const g = ctx.createRadialGradient(c, c, RADIUS * 0.12, c, c, RADIUS);
    g.addColorStop(0, col.light);
    g.addColorStop(0.72, col.light);
    g.addColorStop(1, col.dark);
    return g;
  });

  const arc = TAU / len;
  for (let i = 0; i < len; i++) {
    const a = i * arc;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, RADIUS, a, a + arc);
    ctx.closePath();
    ctx.fillStyle = gradients[sliceColorIndex(i, len)];
    ctx.fill();
  }

  // Divisiones doradas (si hay demasiadas rebanadas se vuelven ruido: se adelgazan).
  // Con muchas personas solo se dibuja la línea entre franjas, no entre cada rebanada.
  if (len > 1) {
    const g = bandSize(len);
    ctx.strokeStyle = len > 160 && g === 1 ? 'rgba(196,134,15,0.35)' : 'rgba(196,134,15,0.85)';
    ctx.lineWidth = len > 80 && g === 1 ? 1.5 : 3;
    ctx.beginPath();
    for (let i = 0; i < len; i += g) {
      const a = i * arc;
      ctx.moveTo(c, c);
      ctx.lineTo(c + Math.cos(a) * RADIUS, c + Math.sin(a) * RADIUS);
    }
    ctx.stroke();
  }

  // Pequeñas estrellas cerca de la orilla cuando hay pocas rebanadas (adorno).
  if (len <= 40) {
    for (let i = 0; i < len; i++) {
      const a = (i + 0.5) * arc;
      const r = RADIUS * 0.86;
      drawStar(ctx, c + Math.cos(a) * r, c + Math.sin(a) * r, len <= 16 ? 16 : 10, sliceColorIndex(i, len) === 3 ? '#e63946' : '#ffffff');
    }
  }

  // Anillo interior decorativo
  ctx.beginPath();
  ctx.arc(c, c, RADIUS * 0.2, 0, TAU);
  ctx.strokeStyle = 'rgba(255,224,138,0.9)';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Sombra interna en la orilla para dar volumen
  const shade = ctx.createRadialGradient(c, c, RADIUS * 0.8, c, c, RADIUS);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(c, c, RADIUS, 0, TAU);
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const rr = k % 2 === 0 ? r : r * 0.45;
    const a = (k * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.restore();
}

export const Wheel = forwardRef<WheelHandle, WheelProps>(({ participants, onTick }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<SVGSVGElement>(null);
  const rotationRef = useRef(0);
  const spinningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastKickRef = useRef(0);
  const participantsRef = useRef(participants);
  participantsRef.current = participants;
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  // Si la lista cambia mientras gira (p. ej. termina de leerse un PDF), se redibuja al detenerse.
  const pendingRedrawRef = useRef(false);
  useEffect(() => {
    if (spinningRef.current) {
      pendingRedrawRef.current = true;
      return;
    }
    if (canvasRef.current) drawWheel(canvasRef.current, participants);
  }, [participants]);

  // Las fuentes locales pueden terminar de cargar después del primer dibujo.
  useEffect(() => {
    document.fonts?.ready.then(() => {
      if (canvasRef.current) drawWheel(canvasRef.current, participantsRef.current);
    });
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const applyRotation = (r: number) => {
    if (rotorRef.current) rotorRef.current.style.transform = `rotate(${r}rad)`;
  };

  const kickPointer = () => {
    const now = performance.now();
    if (now - lastKickRef.current < 50 || !pointerRef.current) return;
    lastKickRef.current = now;
    pointerRef.current.animate(
      [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(0deg)' }],
      { duration: 140, easing: 'ease-out' },
    );
  };

  const spin = useCallback((): Promise<number> | null => {
    const list = participantsRef.current;
    const len = list.length;
    if (spinningRef.current || len === 0) return null;
    spinningRef.current = true;
    stageRef.current?.classList.add('is-spinning');

    const winner = secureRandomInt(len);
    const start = rotationRef.current;
    const turns = 7 + secureRandomInt(3);
    const end = targetRotation(start, winner, len, turns, secureRandom());
    const duration = 7000 + secureRandom() * 1500;
    const t0 = performance.now();
    let lastIndex = -1;

    return new Promise<number>(resolve => {
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const r = start + (end - start) * easeOutQuart(t);
        applyRotation(r);
        const idx = indexAtRotation(r, len);
        if (idx !== lastIndex) {
          lastIndex = idx;
          kickPointer();
          onTickRef.current?.(idx);
        }
        if (t < 1) {
          rafRef.current = requestAnimationFrame(frame);
          return;
        }
        rafRef.current = null;
        const normalized = normalizeRotation(end);
        rotationRef.current = normalized;
        applyRotation(normalized);
        spinningRef.current = false;
        stageRef.current?.classList.remove('is-spinning');
        // La verdad es lo que se ve: el índice bajo la flecha (con la lista con la que se giró).
        const result = indexAtRotation(normalized, len);
        if (pendingRedrawRef.current) {
          pendingRedrawRef.current = false;
          if (canvasRef.current) drawWheel(canvasRef.current, participantsRef.current);
        }
        resolve(result);
      };
      rafRef.current = requestAnimationFrame(frame);
    });
  }, []);

  useImperativeHandle(ref, () => ({ spin, isSpinning: () => spinningRef.current }), [spin]);

  const bulbs = Array.from({ length: BULB_COUNT }, (_, i) => {
    const a = (i / BULB_COUNT) * TAU - Math.PI / 2;
    const colors = ['#ff4d5e', '#3ee07f', '#ffd65c', '#ffffff'];
    return { x: 50 + Math.cos(a) * 48.2, y: 50 + Math.sin(a) * 48.2, color: colors[i % 4], cls: i % 2 ? 'bulb-b' : 'bulb-a' };
  });

  return (
    <div ref={stageRef} className="relative w-full aspect-square select-none" data-testid="wheel-stage">
      {/* Aro dorado exterior (fijo) */}
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#c4860f,#ffe08a,#c4860f,#fff1c2,#c4860f,#ffe08a,#c4860f)] shadow-[0_0_0_6px_rgba(10,20,48,0.9),0_25px_60px_rgba(0,0,0,0.55)]" />
      <div className="absolute inset-[3.2%] rounded-full bg-night-950" />

      {/* Rueda que gira (solo se mueve con transform: no se redibuja en cada cuadro) */}
      <div ref={rotorRef} className="absolute inset-[4%] rounded-full overflow-hidden will-change-transform" data-testid="wheel-rotor">
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="w-full h-full block" data-testid="wheel-canvas" />
      </div>

      {/* Focos navideños en el aro */}
      {/* Dos capas que se alternan: se anima la opacidad de la capa entera (barato). */}
      {(['bulb-a', 'bulb-b'] as const).map(cls => (
        <svg key={cls} viewBox="0 0 100 100" className={`absolute inset-0 w-full h-full pointer-events-none ${cls}`} aria-hidden>
          {bulbs.filter(b => b.cls === cls).map((b, i) => (
            <g key={i}>
              <circle cx={b.x} cy={b.y} r={1.25} fill={b.color} />
              <circle cx={b.x - 0.35} cy={b.y - 0.35} r={0.4} fill="#fff" opacity={0.8} />
            </g>
          ))}
        </svg>
      ))}

      {/* Centro: esfera navideña con estrella */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[17%] aspect-square rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff6b77,#c1121f_55%,#6e0a13)] shadow-[0_0_0_5px_#f9c74f,0_0_0_9px_rgba(10,20,48,0.9),0_10px_25px_rgba(0,0,0,0.5)] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%] drop-shadow" aria-hidden>
          <path d="M12 1.8l2.95 6.3 6.85.8-5.08 4.68 1.38 6.77L12 16.9l-6.1 3.45 1.38-6.77L2.2 8.9l6.85-.8z" fill="#ffe08a" stroke="#c4860f" strokeWidth="0.8" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Flecha (adorno dorado arriba) */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[38%] w-[11%] z-20">
        <svg ref={pointerRef} viewBox="0 0 40 56" className="pointer-kick w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.55)]" aria-label="Flecha de la ruleta">
          <defs>
            <linearGradient id="ptr-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff1c2" />
              <stop offset="0.5" stopColor="#f9c74f" />
              <stop offset="1" stopColor="#c4860f" />
            </linearGradient>
          </defs>
          <path d="M20 55 L4 22 A16 16 0 1 1 36 22 Z" fill="url(#ptr-gold)" stroke="#8a5a06" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="20" cy="17" r="7.5" fill="#e63946" stroke="#fff1c2" strokeWidth="1.5" />
          <circle cx="17.5" cy="14.5" r="2.2" fill="#fff" opacity="0.75" />
        </svg>
      </div>
    </div>
  );
});
Wheel.displayName = 'Wheel';
