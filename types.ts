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

// Elegant Mother's Day palette for Dark Mode
// Pairs of [Background Color, Text Color]
export const WHEEL_COLORS: { bg: string; text: string }[] = [
  { bg: '#FF69B4', text: '#FFFFFF' }, // Hot Pink
  { bg: '#DDA0DD', text: '#FFFFFF' }, // Plum
  { bg: '#FFB6C1', text: '#000000' }, // Light Pink
  { bg: '#BA55D3', text: '#FFFFFF' }, // Medium Orchid
  { bg: '#FFC0CB', text: '#000000' }, // Pink
  { bg: '#DB7093', text: '#FFFFFF' }, // Pale Violet Red
  { bg: '#FFE4E1', text: '#000000' }, // Misty Rose
  { bg: '#C71585', text: '#FFFFFF' }, // Medium Violet Red
];

export const CONFETTI_COLORS = [
  '#FF69B4',
  '#DDA0DD',
  '#FFB6C1',
  '#BA55D3',
  '#FFC0CB',
  '#FFD700', // Gold accent
  '#FFFFFF'
];