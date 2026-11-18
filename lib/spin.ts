/**
 * Matemática del giro de la ruleta.
 *
 * Convención (la misma del <canvas>): ángulo 0 = las 3 en punto, crece en sentido horario.
 * La rebanada i ocupa [i*arc, (i+1)*arc). La ruleta se gira con CSS `rotate(rotation rad)`,
 * así que un punto de la rueda en el ángulo θ se ve en θ + rotation.
 * La flecha está ARRIBA (las 12 en punto) = 3π/2.
 */

const TAU = Math.PI * 2;
export const POINTER_ANGLE = Math.PI * 1.5;

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Índice de la rebanada que está justo debajo de la flecha para una rotación dada. */
export function indexAtRotation(rotation: number, len: number): number {
  if (len <= 0) return -1;
  const arc = TAU / len;
  const theta = mod(POINTER_ANGLE - rotation, TAU);
  return Math.min(len - 1, Math.floor(theta / arc));
}

/** Entero aleatorio en [0, n) usando el generador criptográfico (sin sesgo). */
export function secureRandomInt(n: number): number {
  if (n <= 1) return 0;
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) return Math.floor(Math.random() * n);
  const max = Math.floor(0x100000000 / n) * n; // descarta el sobrante para no sesgar
  const buf = new Uint32Array(1);
  let x: number;
  do {
    cryptoObj.getRandomValues(buf);
    x = buf[0];
  } while (x >= max);
  return x % n;
}

/** Número real aleatorio en [0, 1). */
export function secureRandom(): number {
  return secureRandomInt(1_000_000) / 1_000_000;
}

/**
 * Rotación final (siempre mayor que la actual, girando hacia adelante) para que la
 * rebanada `winnerIndex` quede bajo la flecha. `offsetFrac` (0..1) elige el punto dentro
 * de la rebanada; se recorta a [0.15, 0.85] para no caer en la orilla y evitar dudas.
 */
export function targetRotation(
  current: number,
  winnerIndex: number,
  len: number,
  fullTurns: number,
  offsetFrac: number,
): number {
  const arc = TAU / len;
  const frac = 0.15 + Math.min(1, Math.max(0, offsetFrac)) * 0.7;
  const theta = (winnerIndex + frac) * arc;
  const desired = mod(POINTER_ANGLE - theta, TAU);
  const delta = mod(desired - mod(current, TAU), TAU);
  return current + fullTurns * TAU + delta;
}

/** Curva de frenado: arranca rápido y se detiene lento (suspenso al final). */
export function easeOutQuart(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u * u;
}

/** Normaliza una rotación a [0, 2π) para que los números no crezcan sin fin. */
export function normalizeRotation(r: number): number {
  return mod(r, TAU);
}
