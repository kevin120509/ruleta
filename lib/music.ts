/**
 * Música navideña sintetizada en el navegador (sin archivos ni internet).
 * Melodías de dominio público: "Jingle Bells" (1857) y "We Wish You a Merry Christmas" (tradicional).
 * Se programa con anticipación sobre el reloj de audio, así un giro pesado no la hace trabarse.
 */

type Note = [freq: number, beats: number]; // freq 0 = silencio
type Song = { bpm: number; melody: Note[]; bass: Note[]; bells: boolean };

const N: Record<string, number> = {
  G2: 98.0, A2: 110.0, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, 'F#3': 185.0, G3: 196.0, A3: 220.0, B3: 246.94,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5,
};
const n = (s: string, b: number): Note => [N[s], b];

// --- Jingle Bells (estribillo), Do mayor, 4/4 ---
const jingleHalf1: Note[] = [
  n('E5', 1), n('E5', 1), n('E5', 2),
  n('E5', 1), n('E5', 1), n('E5', 2),
  n('E5', 1), n('G5', 1), n('C5', 1.5), n('D5', 0.5),
  n('E5', 4),
  n('F5', 1), n('F5', 1), n('F5', 1.5), n('F5', 0.5),
  n('F5', 1), n('E5', 1), n('E5', 1), n('E5', 0.5), n('E5', 0.5),
];
const JINGLE: Song = {
  bpm: 128,
  bells: true,
  melody: [
    ...jingleHalf1, n('E5', 1), n('D5', 1), n('D5', 1), n('E5', 1), n('D5', 2), n('G5', 2),
    ...jingleHalf1, n('G5', 1), n('G5', 1), n('F5', 1), n('D5', 1), n('C5', 4),
  ],
  // Bajo: raíz y quinta por compás (16 compases)
  bass: ['C3', 'C3', 'C3', 'C3', 'F3', 'C3', 'D3', 'G2', 'C3', 'C3', 'C3', 'C3', 'F3', 'C3', 'G2', 'C3'].flatMap(r => {
    const fifth: Record<string, string> = { C3: 'G3', F3: 'C3', D3: 'A3', G2: 'D3' };
    return [n(r, 2), n(fifth[r], 2)];
  }),
};

// --- We Wish You a Merry Christmas, Sol mayor, 3/4 ---
const WISH: Song = {
  bpm: 150,
  bells: false,
  melody: [
    n('D5', 1),
    n('G5', 1), n('G5', 0.5), n('A5', 0.5), n('G5', 0.5), n('F#5', 0.5),
    n('E5', 1), n('E5', 1), n('E5', 1),
    n('A5', 1), n('A5', 0.5), n('B5', 0.5), n('A5', 0.5), n('G5', 0.5),
    n('F#5', 1), n('D5', 1), n('D5', 1),
    n('B5', 1), n('B5', 0.5), n('C6', 0.5), n('B5', 0.5), n('A5', 0.5),
    n('G5', 1), n('E5', 1), n('D5', 0.5), n('D5', 0.5),
    n('E5', 1), n('A5', 1), n('F#5', 1),
    n('G5', 3),
    [0, 2],
  ],
  bass: [
    [0, 1],
    n('G3', 3), n('C3', 3), n('A2', 3), n('D3', 3), n('B2', 3), n('E3', 3), n('C3', 1.5), n('D3', 1.5), n('G2', 3), [0, 2],
  ],
};

const SONGS = [JINGLE, WISH, JINGLE];

export class ChristmasMusic {
  private ctx: AudioContext;
  private out: GainNode;
  private noise: AudioBuffer;
  private timer: number | null = null;
  private songIdx = 0;
  private nextSongAt = 0;
  private queue: { at: number; fn: (t: number) => void }[] = [];
  private baseVolume = 0.42;
  playing = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(ctx.destination);
    // Ruido blanco corto para los cascabeles
    const len = Math.floor(ctx.sampleRate * 0.25);
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  start() {
    if (this.playing) return;
    this.playing = true;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(this.baseVolume, t + 1.2);
    this.nextSongAt = t + 0.15;
    this.queue = [];
    this.timer = window.setInterval(() => this.pump(), 120);
    this.pump();
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.queue = [];
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(0, t + 0.6);
  }

  /** Baja la música mientras gira la ruleta para que se escuche el clac-clac. */
  duck(on: boolean) {
    if (!this.playing) return;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(on ? this.baseVolume * 0.3 : this.baseVolume, t + (on ? 0.4 : 1.5));
  }

  // Programa ~1 s hacia adelante. Cada canción se encola completa cuando le toca.
  private pump() {
    const now = this.ctx.currentTime;
    if (this.nextSongAt < now + 1.0) {
      const song = SONGS[this.songIdx % SONGS.length];
      this.songIdx++;
      this.nextSongAt = this.enqueueSong(song, Math.max(this.nextSongAt, now + 0.05)) + 0.8;
    }
    const horizon = now + 0.6;
    const due = this.queue.filter(e => e.at < horizon);
    if (due.length) {
      this.queue = this.queue.filter(e => e.at >= horizon);
      for (const e of due) if (e.at >= now - 0.02) e.fn(e.at);
    }
  }

  private enqueueSong(song: Song, start: number): number {
    const beat = 60 / song.bpm;
    let t = start;
    for (const [f, b] of song.melody) {
      if (f) this.queue.push({ at: t, fn: at => this.bell(f, at, Math.min(1.6, b * beat * 1.8)) });
      t += b * beat;
    }
    const end = t;
    let tb = start;
    for (const [f, b] of song.bass) {
      if (f) this.queue.push({ at: tb, fn: at => this.bassNote(f, at, b * beat * 0.9) });
      tb += b * beat;
    }
    if (song.bells) {
      for (let tt = start; tt < end - 0.01; tt += beat / 2) {
        const strong = Math.round((tt - start) / beat) % 2 === 0 && Math.abs(((tt - start) / beat) % 1) < 0.01;
        this.queue.push({ at: tt, fn: at => this.sleigh(at, strong ? 0.05 : 0.025) });
      }
    }
    return end;
  }

  // Campana tipo carillón: fundamental + armónicos con caída rápida
  private bell(freq: number, t: number, dur: number) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.connect(this.out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const partials: [number, number][] = [[1, 1], [2, 0.35], [3.01, 0.12]];
    for (const [mult, amp] of partials) {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq * mult;
      og.gain.value = amp;
      o.connect(og);
      og.connect(g);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  private bassNote(freq: number, t: number, dur: number) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.2, dur));
    o.connect(g);
    g.connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private sleigh(t: number, vol: number) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'highpass';
    bp.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.out);
    src.start(t);
    src.stop(t + 0.1);
  }
}

/** Sonidos de la ruleta: arranque con cascabeles y clac de la lengüeta en cada rebanada. */
export function makeNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export function playClack(ctx: AudioContext, noise: AudioBuffer, volume = 1) {
  const t = ctx.currentTime;
  // Golpe de madera/plástico
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2600;
  bp.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9 * volume, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  src.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.04);
  // Cuerpo del clic
  const o = ctx.createOscillator();
  const og = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(1700, t);
  o.frequency.exponentialRampToValueAtTime(500, t + 0.03);
  og.gain.setValueAtTime(0.35 * volume, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
  o.connect(og);
  og.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.05);
}

export function playSpinStart(ctx: AudioContext, noise: AudioBuffer) {
  const t = ctx.currentTime;
  // Cascabeles que se agitan
  for (let i = 0; i < 10; i++) {
    const at = t + i * 0.055 + Math.random() * 0.015;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 5500;
    const g = ctx.createGain();
    const v = 0.35 * (1 - i / 12);
    g.gain.setValueAtTime(v, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.08);
    src.connect(hp);
    hp.connect(g);
    g.connect(ctx.destination);
    src.start(at);
    src.stop(at + 0.09);
  }
  // "Whoosh" que sube
  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 2;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(2200, t + 0.7);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.4, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  src.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.95);
  // Campanita brillante
  for (const [f, d] of [[1318.5, 0], [1568, 0.09], [2093, 0.18]] as const) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    og.gain.setValueAtTime(0.0001, t + d);
    og.gain.exponentialRampToValueAtTime(0.18, t + d + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.6);
    o.connect(og);
    og.connect(ctx.destination);
    o.start(t + d);
    o.stop(t + d + 0.65);
  }
}
