import React from 'react';

export const ThreeWiseMen = React.memo(() => {
    return (
        <div className="absolute bottom-0 left-0 w-full h-80 pointer-events-none z-0 flex items-end justify-center overflow-hidden">
            <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-sky-900/20 to-transparent z-[-1]"></div>
            <svg
                viewBox="0 0 1200 400"
                preserveAspectRatio="xMidYMax meet"
                className="w-full h-full max-w-6xl opacity-90"
            >
                <defs>
                    <linearGradient id="desert-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" /> {/* slate-800 */}
                        <stop offset="100%" stopColor="#020617" /> {/* slate-950 */}
                    </linearGradient>
                    <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </linearGradient>
                    <radialGradient id="star-glow-gradient">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Horizon Glow (Backlight) */}
                <ellipse cx="600" cy="400" rx="600" ry="100" fill="url(#desert-gradient)" opacity="0.5" />

                {/* Dunes */}
                <path
                    d="M0,320 Q300,280 600,320 T1200,320 V400 H0 Z"
                    fill="url(#desert-gradient)"
                />

                {/* Wise Man 1 (Left) */}
                <g transform="translate(250, 240) scale(0.9)">
                    {/* Camel Body */}
                    <path d="M20,50 Q40,40 60,50 T100,50 L100,90 L20,90 Z" fill="#0f172a" />
                    {/* Camel Neck/Head */}
                    <path d="M100,50 Q110,20 130,30 L125,55 Z" fill="#0f172a" />
                    {/* Rider */}
                    <path d="M50,50 L50,10 Q60,0 70,10 L70,50 Z" fill="#0f172a" />
                    {/* Detail highlight */}
                    <circle cx="130" cy="30" r="1" fill="#fbbf24" opacity="0.5" />
                </g>

                {/* Wise Man 2 (Center) */}
                <g transform="translate(550, 220) scale(1.0)">
                    <path d="M20,50 Q40,40 60,50 T100,50 L100,90 L20,90 Z" fill="#0f172a" />
                    <path d="M100,50 Q110,20 130,30 L125,55 Z" fill="#0f172a" />
                    <path d="M50,50 L50,10 Q60,0 70,10 L70,50 Z" fill="#0f172a" />
                    <circle cx="130" cy="30" r="1" fill="#fbbf24" opacity="0.5" />
                </g>

                {/* Wise Man 3 (Right) */}
                <g transform="translate(850, 240) scale(0.9)">
                    <path d="M20,50 Q40,40 60,50 T100,50 L100,90 L20,90 Z" fill="#0f172a" />
                    <path d="M100,50 Q110,20 130,30 L125,55 Z" fill="#0f172a" />
                    <path d="M50,50 L50,10 Q60,0 70,10 L70,50 Z" fill="#0f172a" />
                    <circle cx="130" cy="30" r="1" fill="#fbbf24" opacity="0.5" />
                </g>

                {/* Star of Bethlehem */}
                <g transform="translate(1050, 40)">
                    {/* Static Glow behind - Replaced filter with radial gradient */}
                    <circle cx="0" cy="0" r="30" fill="url(#star-glow-gradient)" />
                    
                    {/* Animated Star Body - Removed pulse animation to reduce layout thrashing if any */}
                    <path d="M0,-25 L6, -6 L25,0 L6,6 L0,25 L-6,6 L-25,0 L-6,-6 Z" fill="#fbbf24" />
                    
                    {/* Inner glow - Replaced blur with simple opacity */}
                    <circle cx="0" cy="0" r="15" fill="#fbbf24" opacity="0.2" />
                    
                    <line x1="0" y1="0" x2="0" y2="400" stroke="url(#beam-gradient)" strokeWidth="50" opacity="0.1" />
                </g>
            </svg>
        </div>
    );
});
