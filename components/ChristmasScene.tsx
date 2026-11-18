import React, { memo } from 'react';
import { Snowfall } from './Snowfall';

/*
 * Escena de fondo. Todo es estático (SVG + degradados) salvo:
 *  - la nieve (un canvas ligero),
 *  - Santa cruzando el cielo (solo transform),
 *  - capas que "respiran" (solo opacity).
 * Así el navegador casi no trabaja y la ruleta queda fluida.
 */

// Estrellas fijas (posiciones deterministas para que no cambien en cada carga).
const STARS = Array.from({ length: 70 }, (_, i) => {
  const x = (i * 137.508) % 100;
  const y = ((i * 61.803) % 55) + 1;
  const r = i % 7 === 0 ? 1.6 : i % 3 === 0 ? 1.1 : 0.7;
  return { x, y, r, layer: i % 2 };
});

const Reindeer = ({ x, nose = false, bobClass }: { x: number; nose?: boolean; bobClass: string }) => (
  <g transform={`translate(${x} 0)`}>
    <g className={bobClass}>
      <ellipse cx="20" cy="24" rx="13" ry="5.5" />
      <path d="M30 21 L37 11 L41 12.5 L35.5 23 Z" />
      <ellipse cx="41" cy="11" rx="5.2" ry="3" />
      <path d="M39 8 L36.5 1.5 M37.3 4 L33.5 2 M42 8 L44 1.5 M43.2 4 L47 2.5" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M29 27 L39 31 M27 28 L35 35 M11 27 L1 30 M13 28 L5 35" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M7 22 L3 19 L6 23 Z" />
      {nose && <circle cx="46.2" cy="11.4" r="1.9" fill="#ff3b4a" stroke="none" className="breathe" />}
    </g>
  </g>
);

const SantaSleigh = () => (
  <svg viewBox="0 0 330 60" className="w-[min(46vw,440px)] h-auto" aria-hidden>
    <defs>
      <radialGradient id="trail" cx="0" cy="0.5" r="1">
        <stop offset="0" stopColor="#fff6d6" stopOpacity="0.9" />
        <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Estela mágica */}
    <ellipse cx="18" cy="40" rx="30" ry="3" fill="url(#trail)" opacity="0.6" />
    {[6, 16, 26, 36].map((cx, i) => (
      <circle key={cx} cx={cx} cy={34 + (i % 2) * 8} r={1.4 - i * 0.2} fill="#fff6d6" className="twinkle" style={{ animationDelay: `${i * 0.3}s` }} />
    ))}
    <g fill="#fde7a6" stroke="#fde7a6">
      {/* Trineo y Santa */}
      <g className="bob-delay">
        <path d="M44 36 Q46 46 58 46 L96 46 Q104 46 106 40" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M50 22 L92 22 Q100 22 100 30 L98 40 L54 40 Q48 40 48 32 Z" />
        <circle cx="66" cy="12" r="6" />
        <path d="M60 10 Q66 0 74 4 L78 8 L71 9 Z" />
        <circle cx="79" cy="8" r="2" />
        <path d="M58 22 Q66 14 74 22 Z" />
        <ellipse cx="88" cy="16" rx="9" ry="8" />
      </g>
      {/* Riendas */}
      <path d="M100 26 L320 22" strokeWidth="0.8" fill="none" opacity="0.8" />
      <Reindeer x={118} bobClass="bob" />
      <Reindeer x={170} bobClass="bob-delay" />
      <Reindeer x={222} bobClass="bob" />
      <Reindeer x={274} bobClass="bob-delay" nose />
    </g>
  </svg>
);

const Snowman = () => (
  <g transform="translate(170 0)">
    <ellipse cx="0" cy="286" rx="62" ry="10" fill="#9fb4d8" opacity="0.5" />
    <circle cx="0" cy="246" r="44" fill="#f4f8ff" />
    <circle cx="0" cy="186" r="33" fill="#f4f8ff" />
    <circle cx="0" cy="138" r="24" fill="#f4f8ff" />
    {/* sombras suaves */}
    <path d="M-30 270 A44 44 0 0 0 40 262" stroke="#c9d8ee" strokeWidth="6" fill="none" opacity="0.7" />
    {/* bufanda */}
    <path d="M-24 158 Q0 170 24 158 L24 166 Q0 178 -24 166 Z" fill="#e63946" />
    <path d="M12 164 L20 196 L10 196 L4 166 Z" fill="#c1121f" />
    {/* sombrero */}
    <rect x="-26" y="112" width="52" height="7" rx="2" fill="#111827" />
    <rect x="-16" y="80" width="32" height="34" rx="3" fill="#111827" />
    <rect x="-16" y="104" width="32" height="6" fill="#1fa85c" />
    <circle cx="10" cy="107" r="3" fill="#e63946" />
    {/* cara */}
    <circle cx="-8" cy="133" r="2.6" fill="#111827" />
    <circle cx="8" cy="133" r="2.6" fill="#111827" />
    <path d="M0 140 L22 144 L0 145 Z" fill="#f77f00" />
    {[-10, -4, 3, 9].map((x, i) => (
      <circle key={x} cx={x} cy={151 + (i === 0 || i === 3 ? -1 : 1)} r="1.6" fill="#111827" />
    ))}
    {/* botones */}
    {[176, 190, 204].map(y => <circle key={y} cx="0" cy={y} r="3" fill="#111827" />)}
    {/* brazos */}
    <path d="M-30 182 L-74 160 M-60 167 L-66 154" stroke="#6b4423" strokeWidth="4" strokeLinecap="round" fill="none" />
    <g className="wave-arm">
      <path d="M30 182 L70 150 M58 160 L70 162" stroke="#6b4423" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  </g>
);

const XmasTree = ({ lights }: { lights: 'a' | 'b' }) => {
  const dots = [
    [0, 92], [-14, 120], [16, 128], [-26, 160], [4, 158], [28, 170], [-36, 206], [-8, 200], [18, 210], [40, 214],
    [-44, 246], [-16, 240], [10, 250], [36, 252],
  ];
  const colors = ['#ff4d5e', '#ffd65c', '#3ee07f', '#7cc6ff', '#ffffff'];
  return (
    <g>
      {dots.map(([x, y], i) =>
        (i % 2 === 0) === (lights === 'a') ? <circle key={i} cx={x} cy={y} r="4.2" fill={colors[i % colors.length]} /> : null,
      )}
    </g>
  );
};

const House = () => (
  <g transform="translate(1180 0)">
    <rect x="0" y="196" width="150" height="90" fill="#13224d" />
    <path d="M-14 200 L75 140 L164 200 Z" fill="#0d1838" />
    <path d="M-16 202 Q75 128 166 202 L160 208 Q75 142 -10 208 Z" fill="#f4f8ff" />
    <rect x="112" y="150" width="18" height="34" fill="#0d1838" />
    <rect x="109" y="146" width="24" height="7" rx="3" fill="#f4f8ff" />
    {/* ventanas cálidas */}
    <rect x="18" y="222" width="34" height="30" rx="3" fill="#ffcf6b" className="breathe" />
    <rect x="98" y="222" width="34" height="30" rx="3" fill="#ffcf6b" className="breathe" style={{ animationDelay: '1.2s' }} />
    <path d="M35 222 V252 M18 237 H52 M115 222 V252 M98 237 H132" stroke="#13224d" strokeWidth="3" />
    <rect x="62" y="236" width="26" height="50" rx="3" fill="#7a1f2b" />
    <circle cx="75" cy="248" r="8" fill="none" stroke="#1fa85c" strokeWidth="4" />
    <circle cx="75" cy="240" r="2.5" fill="#e63946" />
    {/* guirnalda de focos en el techo */}
    {Array.from({ length: 11 }, (_, i) => (
      <circle key={i} cx={4 + i * 14.3} cy={205 - Math.sin((i / 10) * Math.PI) * 52 + 4} r="3" fill={['#ff4d5e', '#ffd65c', '#3ee07f', '#7cc6ff'][i % 4]} className={i % 2 ? 'bulb-a' : 'bulb-b'} />
    ))}
  </g>
);

export const ChristmasScene = memo(({ lite = false }: { lite?: boolean }) => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
    {lite ? (
      <>
        {/* Modo ligero: cielo + aurora en una sola capa, estrellas y copos fijos en otra
            (en equipos sin tarjeta gráfica cada capa de pantalla completa cuesta fluidez). */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_30%_18%,rgba(62,207,122,0.16),transparent_70%),radial-gradient(ellipse_50%_25%_at_70%_12%,rgba(124,198,255,0.14),transparent_70%),linear-gradient(180deg,#040817_0%,#0a1638_45%,#183066_78%,#2a4580_100%)]" />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {STARS.map((s, i) => (
            <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r * 0.12} fill="#fff" />
          ))}
          {STARS.map((s, i) => (
            <circle key={`f${i}`} cx={(s.x * 1.7) % 100} cy={(s.y * 1.6 + 12) % 100} r={0.18 + (i % 3) * 0.08} fill="#fff" opacity={0.55} />
          ))}
        </svg>
      </>
    ) : (
      <>
        {/* Cielo */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#040817_0%,#0a1638_45%,#183066_78%,#2a4580_100%)]" />
        {/* Aurora suave (estática; solo respira en opacidad) */}
        <div className="absolute inset-0 breathe bg-[radial-gradient(ellipse_60%_30%_at_30%_18%,rgba(62,207,122,0.16),transparent_70%),radial-gradient(ellipse_50%_25%_at_70%_12%,rgba(124,198,255,0.14),transparent_70%)]" />
        {/* Estrellas en dos capas que se alternan */}
        {[0, 1].map(layer => (
          <svg key={layer} className={`absolute inset-0 w-full h-full ${layer ? 'bulb-a' : 'bulb-b'}`} style={{ animationDuration: '4s' }} preserveAspectRatio="none" viewBox="0 0 100 100">
            {STARS.filter(s => s.layer === layer).map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.12} fill="#fff" />
            ))}
          </svg>
        ))}
      </>
    )}

    {/* Luna */}
    <div className="absolute right-[8%] top-[7%] w-[min(16vw,150px)] aspect-square">
      <div className="absolute -inset-[60%] rounded-full bg-[radial-gradient(circle,rgba(255,241,194,0.28),transparent_65%)]" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_35%,#fffdf2,#f6e7b8_60%,#e1c98a)] shadow-[0_0_40px_rgba(255,241,194,0.45)]" />
      <div className="absolute left-[55%] top-[30%] w-[16%] aspect-square rounded-full bg-[#e8d49a] opacity-70" />
      <div className="absolute left-[30%] top-[58%] w-[11%] aspect-square rounded-full bg-[#e8d49a] opacity-60" />
    </div>

    {/* Santa y sus renos cruzando el cielo */}
    <div className="absolute left-0 top-[9%] santa-fly drop-shadow-[0_0_10px_rgba(255,230,160,0.55)]">
      <SantaSleigh />
    </div>

    {/* Nieve cayendo (en modo ligero van copos fijos junto con las estrellas) */}
    {!lite && <Snowfall />}

    {/* Suelo nevado con pueblo, muñeco de nieve y árbol */}
    <svg className="absolute bottom-0 left-0 w-full h-[34vh] min-h-[180px]" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="snow-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9cbea" />
          <stop offset="1" stopColor="#8ea6d4" />
        </linearGradient>
        <linearGradient id="snow-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f8ff" />
          <stop offset="1" stopColor="#c9d8ee" />
        </linearGradient>
      </defs>
      <path d="M0 190 Q200 140 420 175 T860 160 T1300 170 T1600 150 V300 H0 Z" fill="url(#snow-far)" opacity="0.55" />
      {/* Pinos lejanos */}
      {[60, 300, 380, 560, 640, 900, 980, 1060, 1380, 1530].map((x, i) => {
        const s = 0.7 + (i % 3) * 0.18;
        return (
          <path key={x} transform={`translate(${x} ${178 - (i % 2) * 8}) scale(${s})`} d="M0 -70 L22 -30 L12 -30 L30 0 L-30 0 L-12 -30 L-22 -30 Z" fill="#0d3a2a" opacity="0.85" />
        );
      })}
      <House />
      <path d="M0 235 Q260 205 520 232 T1040 226 T1600 222 V300 H0 Z" fill="url(#snow-near)" />
      <Snowman />
      {/* Árbol de Navidad */}
      <g transform="translate(1460 0)">
        <rect x="-9" y="262" width="18" height="26" fill="#5b3a1e" />
        <path d="M0 72 L40 136 L22 136 L56 196 L34 196 L70 266 L-70 266 L-34 196 L-56 196 L-22 136 L-40 136 Z" fill="#167a45" />
        <path d="M0 72 L40 136 L22 136 L56 196 L34 196 L70 266 L0 266 Z" fill="#0f6b39" />
        <g className="bulb-a"><XmasTree lights="a" /></g>
        <g className="bulb-b"><XmasTree lights="b" /></g>
        <path d="M0 52 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2z" fill="#ffe08a" stroke="#c4860f" strokeWidth="2" className="breathe" />
        {/* regalos */}
        <rect x="-88" y="252" width="34" height="30" rx="3" fill="#e63946" />
        <rect x="-74" y="252" width="6" height="30" fill="#ffe08a" />
        <rect x="56" y="258" width="30" height="24" rx="3" fill="#7cc6ff" />
        <rect x="68" y="258" width="6" height="24" fill="#f4f8ff" />
      </g>
    </svg>
  </div>
));
ChristmasScene.displayName = 'ChristmasScene';
