export interface Participant {
  id: string;
  name: string;
  colonia: string;
}

export interface Winner {
  id: string;
  name: string;
  colonia: string;
  prize: string;
  timestamp: Date;
}

export interface Eliminated {
  id: string;
  name: string;
  colonia: string;
  timestamp: Date;
}

export interface Prize {
  id: string;
  name: string;
}

export enum GameMode {
  IDLE = 'IDLE',
  PREP_ELIMINATION = 'PREP_ELIMINATION',
  PREP_PRIZE = 'PREP_PRIZE',
  SPINNING = 'SPINNING',
  RESULT = 'RESULT',
}

// Paleta navideña para las rebanadas de la ruleta.
// light = centro de la rebanada, dark = orilla (se pinta como degradado radial).
export const WHEEL_COLORS: { light: string; dark: string }[] = [
  { light: "#ef4a57", dark: "#a80f1c" }, // rojo Santa
  { light: "#2fbf6f", dark: "#0d5e33" }, // verde pino
  { light: "#ffe08a", dark: "#d8961a" }, // dorado
  { light: "#ffffff", dark: "#c9d8ee" }, // nieve
];

export const CONFETTI_COLORS = ["#e63946", "#1fa85c", "#f9c74f", "#ffffff", "#ffe08a", "#3ecf7a"];
