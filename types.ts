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

// Vibrant / Valentine palette for Dark Mode
// Pairs of [Background Color, Text Color]
export const WHEEL_COLORS: { bg: string; text: string }[] = [
  { bg: '#FF0055', text: '#FFFFFF' }, // Hot Pink
  { bg: '#FFCCD5', text: '#590d22' }, // Pale Pink
  { bg: '#C9184A', text: '#FFFFFF' }, // Deep Red
  { bg: '#FF758F', text: '#590d22' }, // Salmon Pink
  { bg: '#800F2F', text: '#FFFFFF' }, // Burgundy
  { bg: '#FF4D6D', text: '#FFFFFF' }, // Rose
  { bg: '#FFF0F3', text: '#590d22' }, // Lavender Blush
  { bg: '#A4133C', text: '#FFFFFF' }, // Crimson
];

export const CONFETTI_COLORS = [
  '#FF0055',
  '#FFCCD5',
  '#C9184A',
  '#FF758F',
  '#800F2F',
  '#FFFFFF'
];