import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ChevronDown,
  FileText,
  Gift,
  Loader2,
  MapPin,
  Music,
  Snowflake,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Eliminated, GameMode, Participant, Winner, CONFETTI_COLORS } from './types';
import Dashboard from './Dashboard';
import { ChristmasScene } from './components/ChristmasScene';
import { Wheel, WheelHandle } from './components/Wheel';
import { loadJSON, reviveDates, saveJSON } from './lib/storage';
import { secureRandomInt } from './lib/spin';
import { detectLowPowerGraphics } from './lib/perf';
import { ChristmasMusic, makeNoise, playClack, playSpinStart } from './lib/music';
import fallaMp3 from './sonido/falla.mp3';
import winMp3 from './sonido/premiado.mp3';
import { extractParticipantsFromText } from './gemini';

// Llaves de guardado. Las "legacy" permiten recuperar la lista del tema anterior.
const KEY_PARTICIPANTS = 'ruleta_participants';
const KEY_PRIZES = 'ruleta_prizes';
const KEY_WINNERS = 'ruleta_winners';
const KEY_ELIMINATED = 'ruleta_eliminated';
const KEY_MUTED = 'ruleta_muted';
const KEY_EFFECTS = 'ruleta_effects';

type Tab = 'PLAYERS' | 'WINNERS' | 'ELIMINATED';
type SoundType = 'pop' | 'tick' | 'spin' | 'win' | 'elimination';
interface Toast { id: number; text: string; tone: 'info' | 'error' | 'success' }

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);

function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
}

export default function App() {
  // --- Estado guardado ---
  const [participants, setParticipants] = useState<Participant[]>(() =>
    loadJSON<Participant[]>(KEY_PARTICIPANTS, [], ['participants_mothers_day']),
  );
  const [prizes, setPrizes] = useState<string[]>(() => loadJSON<string[]>(KEY_PRIZES, [], ['prizes_mothers_day']));
  const [winners, setWinners] = useState<Winner[]>(() => reviveDates(loadJSON<Winner[]>(KEY_WINNERS, [])));
  const [eliminated, setEliminated] = useState<Eliminated[]>(() => reviveDates(loadJSON<Eliminated[]>(KEY_ELIMINATED, [])));
  const [muted, setMuted] = useState<boolean>(() => loadJSON<boolean>(KEY_MUTED, false));
  // Efectos: 'auto' = ligero solo si el equipo no tiene tarjeta gráfica.
  const [effects, setEffects] = useState<'auto' | 'full' | 'lite'>(() => loadJSON(KEY_EFFECTS, 'auto'));
  const [lowPower] = useState(() => detectLowPowerGraphics());
  const lite = effects === 'lite' || (effects === 'auto' && lowPower);
  useEffect(() => saveJSON(KEY_EFFECTS, effects), [effects]);

  useEffect(() => saveJSON(KEY_PARTICIPANTS, participants), [participants]);
  useEffect(() => saveJSON(KEY_PRIZES, prizes), [prizes]);
  useEffect(() => saveJSON(KEY_WINNERS, winners), [winners]);
  useEffect(() => saveJSON(KEY_ELIMINATED, eliminated), [eliminated]);
  useEffect(() => saveJSON(KEY_MUTED, muted), [muted]);
  const [musicOn, setMusicOn] = useState<boolean>(() => loadJSON<boolean>('ruleta_music', true));
  useEffect(() => saveJSON('ruleta_music', musicOn), [musicOn]);

  // --- Estado de la sesión ---
  const [mode, setMode] = useState<GameMode>(GameMode.IDLE);
  const [prizeName, setPrizeName] = useState('');
  const [selectedResult, setSelectedResult] = useState<Participant | null>(null);
  const [resultIsPrize, setResultIsPrize] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('PLAYERS');
  const [showAllPrizes, setShowAllPrizes] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [prizeInput, setPrizeInput] = useState('');
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const wheelRef = useRef<WheelHandle>(null);
  const tickerNameRef = useRef<HTMLParagraphElement>(null);
  const tickerColoniaRef = useRef<HTMLParagraphElement>(null);
  const resolvingRef = useRef(false); // evita doble clic en Aceptar/Rechazar
  const spinListRef = useRef<Participant[]>([]); // copia de la lista con la que se giró

  const locked = mode === GameMode.SPINNING || mode === GameMode.RESULT;

  // --- Avisos (reemplazan a alert(), que congela la pantalla) ---
  const toast = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text, tone }]);
    window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);

  // --- Sonido ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const failAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTickRef = useRef(0);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const musicRef = useRef<ChristmasMusic | null>(null);
  const noiseRef = useRef<AudioBuffer | null>(null);
  const wantMusicRef = useRef(musicOn && !muted);
  wantMusicRef.current = musicOn && !muted;
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    winAudioRef.current = new Audio(winMp3);
    failAudioRef.current = new Audio(fallaMp3);
    winAudioRef.current.preload = 'auto';
    failAudioRef.current.preload = 'auto';
    // El navegador solo deja sonar audio después de un toque/clic: lo "despertamos" ahí.
    const unlock = () => {
      try {
        if (!audioCtxRef.current) {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current;
        if (!noiseRef.current) noiseRef.current = makeNoise(ctx, 0.3);
        if (!musicRef.current) musicRef.current = new ChristmasMusic(ctx);
        const go = () => {
          setAudioReady(true);
          if (wantMusicRef.current) musicRef.current?.start();
        };
        if (ctx.state === 'suspended') ctx.resume().then(go, () => undefined);
        else go();
      } catch {
        /* sin audio */
      }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Música navideña: arranca con el primer toque (regla del navegador) y responde al botón y al silencio.
  useEffect(() => {
    if (!audioReady || !musicRef.current) return;
    if (musicOn && !muted) musicRef.current.start();
    else musicRef.current.stop();
  }, [audioReady, musicOn, muted]);
  useEffect(() => () => musicRef.current?.stop(), []);

  const playSound = useCallback((type: SoundType) => {
    if (mutedRef.current) return;
    try {
      if (type === 'win' || type === 'elimination') {
        const a = type === 'win' ? winAudioRef.current : failAudioRef.current;
        if (a) {
          a.currentTime = 0;
          a.play().catch(() => undefined);
        }
        return;
      }
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      if (type === 'tick') {
        // Máximo ~22 tics por segundo para que suene limpio y no cargue el navegador.
        const now = performance.now();
        if (now - lastTickRef.current < 45) return;
        lastTickRef.current = now;
        if (noiseRef.current) {
          playClack(ctx, noiseRef.current);
          return;
        }
      }
      if (type === 'spin') {
        if (noiseRef.current) playSpinStart(ctx, noiseRef.current);
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime;
      if (type === 'tick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(700, t + 0.03);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.start(t);
        osc.stop(t + 0.045);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.13);
      }
    } catch {
      /* sin audio no pasa nada */
    }
  }, []);

  // --- Nombre en vivo bajo la flecha (se escribe directo al DOM: cero re-renders mientras gira) ---
  const handleTick = useCallback((index: number) => {
    const p = spinListRef.current[index];
    if (p) {
      if (tickerNameRef.current) tickerNameRef.current.textContent = p.name;
      if (tickerColoniaRef.current) tickerColoniaRef.current.textContent = p.colonia || ' ';
    }
    playSound('tick');
  }, [playSound]);

  const celebrate = useCallback(() => {
    try {
      const flake = confetti.shapeFromText({ text: '❄', scalar: 2 });
      const base = { zIndex: 300, colors: CONFETTI_COLORS, disableForReducedMotion: true, ticks: lite ? 180 : 260 };
      const k = lite ? 0.4 : 1; // menos papelitos en equipos sin tarjeta gráfica
      confetti({ ...base, particleCount: Math.round(120 * k), spread: 90, startVelocity: 48, origin: { x: 0.5, y: 0.55 } });
      confetti({ ...base, particleCount: Math.round(60 * k), angle: 60, spread: 60, origin: { x: 0, y: 0.75 } });
      confetti({ ...base, particleCount: Math.round(60 * k), angle: 120, spread: 60, origin: { x: 1, y: 0.75 } });
      confetti({ ...base, particleCount: Math.round(30 * k), spread: 120, scalar: 2, shapes: [flake], origin: { x: 0.5, y: 0.4 } });
    } catch {
      /* el confeti es decorativo */
    }
  }, [lite]);

  // --- Girar ---
  const startSpin = useCallback(async () => {
    if (!wheelRef.current || wheelRef.current.isSpinning()) return;
    if (participants.length === 0) return toast('Primero agrega participantes.', 'error');
    if (mode !== GameMode.PREP_PRIZE && mode !== GameMode.PREP_ELIMINATION) {
      return toast('Elige primero: PREMIAR o ELIMINAR.', 'info');
    }
    if (mode === GameMode.PREP_PRIZE && !prizeName) return toast('Selecciona un premio antes de girar.', 'error');

    const isPrize = mode === GameMode.PREP_PRIZE;
    spinListRef.current = participants;
    const spinning = wheelRef.current.spin();
    if (!spinning) return;
    playSound('spin');
    musicRef.current?.duck(true);
    setMode(GameMode.SPINNING);
    const index = await spinning;
    // La música vuelve poco a poco después del sonido de premio.
    window.setTimeout(() => {
      if (!wheelRef.current?.isSpinning()) musicRef.current?.duck(false);
    }, 3500);
    const person = spinListRef.current[index];
    if (!person) {
      setMode(GameMode.IDLE);
      return;
    }
    resolvingRef.current = false;
    setResultIsPrize(isPrize);
    setSelectedResult(person);
    setMode(GameMode.RESULT);
    if (isPrize) {
      playSound('win');
      celebrate();
    } else {
      playSound('elimination');
    }
  }, [participants, mode, prizeName, toast, playSound, celebrate]);

  const closeModal = useCallback(() => {
    setSelectedResult(null);
    setMode(GameMode.IDLE);
    setPrizeName('');
    setShowAllPrizes(false);
  }, []);

  const confirmResult = useCallback(() => {
    if (resolvingRef.current || !selectedResult) return;
    resolvingRef.current = true;
    playSound('pop');
    const person = selectedResult;
    if (resultIsPrize && prizeName) {
      setWinners(prev => [{ ...person, prize: prizeName, timestamp: new Date() }, ...prev]);
      setPrizes(prev => {
        const i = prev.indexOf(prizeName);
        if (i < 0) return prev;
        const next = [...prev];
        next.splice(i, 1);
        return next;
      });
    } else {
      setEliminated(prev => [{ ...person, timestamp: new Date() }, ...prev]);
    }
    setParticipants(prev => prev.filter(p => p.id !== person.id));
    closeModal();
  }, [selectedResult, resultIsPrize, prizeName, playSound, closeModal]);

  const rejectResult = useCallback(() => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    playSound('pop');
    closeModal();
  }, [playSound, closeModal]);

  // --- Modos ---
  const choosePrizeMode = () => {
    if (locked) return;
    if (prizes.length === 0) {
      toast("No hay premios. Agrégalos en 'Gestión de premios'.", 'error');
      return;
    }
    playSound('pop');
    setMode(GameMode.PREP_PRIZE);
    setShowAllPrizes(false);
    setPrizeName(prizes[secureRandomInt(prizes.length)]);
  };

  const chooseEliminationMode = () => {
    if (locked) return;
    playSound('pop');
    setMode(GameMode.PREP_ELIMINATION);
    setPrizeName('');
  };

  // Si se borran todos los premios estando en modo premio, salir del modo.
  useEffect(() => {
    if (mode === GameMode.PREP_PRIZE && prizeName && !prizes.includes(prizeName)) {
      setPrizeName(prizes.length ? prizes[0] : '');
      if (!prizes.length) setMode(GameMode.IDLE);
    }
  }, [prizes, prizeName, mode]);

  // --- Atajos de teclado: Espacio = girar · Enter = aceptar · Esc = rechazar ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (mode === GameMode.RESULT) {
        // Si el foco está en un botón (p. ej. RECHAZAR con Tab), Enter debe activar ESE botón.
        if (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName === 'BUTTON') return;
        if (e.key === 'Enter') { e.preventDefault(); confirmResult(); }
        if (e.key === 'Escape') { e.preventDefault(); rejectResult(); }
        return;
      }
      if (e.code === 'Space') {
        // Siempre evitamos que Espacio baje la página: en el escenario confunde.
        e.preventDefault();
        if (e.repeat || mode === GameMode.SPINNING) return;
        startSpin(); // si falta modo, premio o participantes, muestra el aviso
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, startSpin, confirmResult, rejectResult]);

  // --- Gestión de jugadores y premios ---
  const handleManualImport = () => {
    if (locked) return;
    const names = manualInput.split('\n').map(n => n.trim()).filter(Boolean);
    if (!names.length) return;
    playSound('pop');
    setParticipants(prev => [...prev, ...names.map(name => ({ id: newId(), name, colonia: '' }))]);
    setManualInput('');
    toast(`Se agregaron ${names.length} participante${names.length === 1 ? '' : 's'}.`, 'success');
  };

  const handlePrizeImport = () => {
    if (locked) return;
    const list = prizeInput.split('\n').map(p => p.trim()).filter(Boolean);
    if (!list.length) return;
    playSound('pop');
    setPrizes(prev => [...prev, ...list]);
    setPrizeInput('');
  };

  const handleRemoveParticipant = useCallback((id: string) => {
    if (locked) return;
    playSound('pop');
    setParticipants(prev => prev.filter(p => p.id !== id));
  }, [locked, playSound]);

  const handleReturnToWheel = useCallback((id: string, from: 'WINNERS' | 'ELIMINATED') => {
    if (locked) return;
    playSound('pop');
    const found = from === 'WINNERS' ? winners.find(w => w.id === id) : eliminated.find(e => e.id === id);
    if (!found) return;
    if (from === 'WINNERS') {
      setWinners(prev => prev.filter(w => w.id !== id));
      const prize = (found as Winner).prize;
      if (prize) setPrizes(prev => [...prev, prize]);
    } else {
      setEliminated(prev => prev.filter(e => e.id !== id));
    }
    setParticipants(prev => (prev.some(p => p.id === id) ? prev : [{ id: found.id, name: found.name, colonia: found.colonia }, ...prev]));
  }, [locked, winners, eliminated, playSound]);

  const handleRemovePrize = (index: number) => {
    if (locked) return; // no tocar premios mientras gira o hay un resultado abierto
    playSound('pop');
    setPrizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearParticipants = () => {
    if (locked) return;
    if (window.confirm('¿Seguro que quieres borrar a TODOS los participantes?')) {
      playSound('pop');
      setParticipants([]);
      if (mode !== GameMode.IDLE) setMode(GameMode.IDLE);
    }
  };

  const handleClearHistory = useCallback(() => {
    if (locked) return;
    if (window.confirm('¿Borrar la lista de ganadores y eliminados? (No regresan a la ruleta)')) {
      setWinners([]);
      setEliminated([]);
    }
  }, [locked]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || locked) return;
    if (!window.pdfjsLib) {
      toast('No se pudo cargar el lector de PDF. Revisa la conexión a internet.', 'error');
      input.value = '';
      return;
    }
    playSound('pop');
    setIsExtractingPDF(true);
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join('\n') + '\n';
      }
      const extracted = await extractParticipantsFromText(text);
      const list: Participant[] = (Array.isArray(extracted) ? extracted : [])
        .filter((p: any) => p && String(p.name || '').trim())
        .map((p: any) => ({ id: newId(), name: String(p.name).trim(), colonia: String(p.colonia || '').trim() }));
      if (list.length) {
        setParticipants(prev => [...prev, ...list]);
        toast(`La IA importó ${list.length} participantes.`, 'success');
      } else {
        toast('La IA no encontró participantes en este PDF.', 'error');
      }
    } catch (error: any) {
      console.error('Error leyendo PDF con IA:', error);
      toast(error?.message?.includes('clave') ? error.message : 'Error procesando el PDF (revisa internet o la clave de la IA).', 'error');
    } finally {
      setIsExtractingPDF(false);
      input.value = '';
    }
  };

  // --- Textos de estado ---
  const statusText =
    mode === GameMode.SPINNING ? '¡Girando… que la magia decida!' :
    mode === GameMode.PREP_PRIZE ? 'Modo premio · listo para girar' :
    mode === GameMode.PREP_ELIMINATION ? 'Modo eliminar · listo para girar' :
    mode === GameMode.RESULT ? 'Resultado' :
    'Elige un modo para empezar';

  const canSpin = participants.length > 0 && (mode === GameMode.PREP_ELIMINATION || (mode === GameMode.PREP_PRIZE && !!prizeName));

  return (
    <div className={`relative min-h-screen font-body text-snow flex flex-col ${lite ? 'lite' : ''}`}>
      <ChristmasScene lite={lite} />

      {/* ENCABEZADO */}
      <header className="relative z-20 w-full px-4 md:px-8 pt-4 pb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 shrink-0">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#9fd3ff_45%,#3b82f6)] shadow-[0_0_18px_rgba(124,198,255,0.5)]" />
            <svg viewBox="0 0 40 30" className="absolute -top-3 -right-2 w-8 rotate-[18deg]" aria-hidden>
              <path d="M4 26 Q14 2 30 6 L36 22 Z" fill="#e63946" />
              <rect x="1" y="22" width="36" height="7" rx="3.5" fill="#f4f8ff" />
              <circle cx="31" cy="6" r="4" fill="#f4f8ff" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-lg md:text-xl tracking-wide leading-none truncate">
            LA BURBUJA <span className="text-gold-300">FELIZ</span>
          </h1>
        </div>

        <h2 className="hidden md:block font-xmas font-bold text-4xl lg:text-5xl text-gold-gradient drop-shadow-[0_2px_0_rgba(0,0,0,0.35)] whitespace-nowrap">
          ¡Feliz Navidad!
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-night-900/80 border border-gold-400/25 px-3 py-1.5 text-xs font-bold">
            <Users className="w-3.5 h-3.5 text-gold-300" /> {participants.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setEffects(lite ? 'full' : 'lite');
              toast(lite ? 'Efectos completos: nieve, Santa y luces animadas.' : 'Modo ligero: fondo fijo para máxima fluidez.', 'info');
            }}
            className={`h-10 px-3 rounded-full border flex items-center gap-1.5 text-xs font-extrabold transition-colors ${lite ? 'bg-night-900/80 border-night-700 text-snow/60 hover:bg-night-800' : 'bg-gold-400/15 border-gold-400/50 text-gold-200 hover:bg-gold-400/25'}`}
            title={lite ? 'Modo ligero (toca para efectos completos)' : 'Efectos completos (toca para modo ligero)'}
            aria-label="Cambiar efectos"
          >
            <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">{lite ? 'LIGERO' : 'EFECTOS'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !musicOn;
              setMusicOn(next);
              if (next && muted) setMuted(false);
              toast(next ? 'Música navideña encendida.' : 'Música apagada.', 'info');
            }}
            className={`h-10 px-3 rounded-full border flex items-center gap-1.5 text-xs font-extrabold transition-colors ${musicOn && !muted ? 'bg-holly-500/20 border-holly-400/50 text-snow hover:bg-holly-500/30' : 'bg-night-900/80 border-night-700 text-snow/60 hover:bg-night-800'}`}
            title={musicOn ? 'Apagar música navideña' : 'Encender música navideña'}
            aria-label={musicOn ? 'Apagar música navideña' : 'Encender música navideña'}
            data-testid="music-button"
          >
            <Music className="w-4 h-4" /> <span className="hidden sm:inline">{musicOn && !muted ? 'MÚSICA' : 'SIN MÚSICA'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            className="w-10 h-10 rounded-full bg-night-900/80 border border-gold-400/25 flex items-center justify-center hover:bg-night-800 transition-colors"
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            title={muted ? 'Activar sonido' : 'Silenciar'}
          >
            {muted ? <VolumeX className="w-5 h-5 text-snow/70" /> : <Volume2 className="w-5 h-5 text-gold-300" />}
          </button>
        </div>
      </header>

      {/* ESCENARIO: ruleta + controles */}
      <section className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4 pb-6 pt-6 lg:pt-2 min-h-[calc(100vh-72px)]">
        <h2 className="md:hidden font-xmas font-bold text-4xl text-gold-gradient -mt-2">¡Feliz Navidad!</h2>

        <div className="w-[min(90vw,540px)] lg:w-[min(76vh,46vw,680px)] min-[2000px]:w-[min(76vh,46vw)] shrink-0 pt-4">
          <Wheel ref={wheelRef} participants={participants} onTick={handleTick} />
        </div>

        <div className="w-full max-w-md frost-panel rounded-[28px] p-5 md:p-6 flex flex-col gap-5">
          <p className={`text-center text-[0.6875rem] font-extrabold uppercase tracking-[0.3em] ${mode === GameMode.SPINNING ? 'text-gold-300 breathe' : 'text-snow/60'}`}>
            {statusText}
          </p>

          {/* Nombre en la flecha */}
          <div className="relative rounded-2xl bg-night-950/70 border border-gold-400/20 px-4 py-4 text-center overflow-hidden" aria-live="off">
            <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.3em] text-gold-300/80 mb-1">En la flecha</p>
            <p ref={tickerNameRef} className="font-display font-bold text-2xl md:text-3xl leading-tight text-snow truncate" data-testid="ticker-name">
              {participants.length ? '¿Quién será?' : 'Sin participantes'}
            </p>
            <p ref={tickerColoniaRef} className="text-xs font-bold uppercase tracking-[0.2em] text-snow/55 mt-1 truncate">&nbsp;</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={choosePrizeMode}
              disabled={locked}
              className={`group flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all disabled:opacity-50 ${mode === GameMode.PREP_PRIZE ? 'bg-gold-400/15 border-gold-400 text-gold-200 shadow-[0_0_24px_rgba(249,199,79,0.25)]' : 'bg-night-900/70 border-transparent text-snow/70 hover:border-gold-400/40'}`}
            >
              <Gift className="w-7 h-7 transition-transform group-hover:-rotate-6" />
              <span className="font-display font-semibold text-sm tracking-widest">PREMIAR</span>
            </button>
            <button
              type="button"
              onClick={chooseEliminationMode}
              disabled={locked}
              className={`group flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all disabled:opacity-50 ${mode === GameMode.PREP_ELIMINATION ? 'bg-sky-400/15 border-sky-300 text-sky-100 shadow-[0_0_24px_rgba(124,198,255,0.25)]' : 'bg-night-900/70 border-transparent text-snow/70 hover:border-sky-300/40'}`}
            >
              <Snowflake className="w-7 h-7 transition-transform group-hover:rotate-45" />
              <span className="font-display font-semibold text-sm tracking-widest">ELIMINAR</span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {mode === GameMode.PREP_PRIZE && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                {!showAllPrizes ? (
                  <div className="relative text-center p-4 rounded-2xl bg-[linear-gradient(135deg,rgba(193,18,31,0.35),rgba(15,107,57,0.35))] border border-gold-400/30">
                    <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.3em] text-gold-300/80">Premio en juego</p>
                    <p className="font-display font-bold text-xl text-gold-200 mt-1 break-words">{prizeName}</p>
                    <button
                      type="button"
                      onClick={() => { playSound('pop'); setShowAllPrizes(true); }}
                      className="mt-2 text-[0.6875rem] font-bold uppercase tracking-widest text-snow/70 hover:text-snow underline underline-offset-4"
                    >
                      Cambiar premio
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto custom-scrollbar p-1">
                    {prizes.map((p, i) => (
                      <button
                        type="button"
                        key={`${p}-${i}`}
                        onClick={() => { playSound('pop'); setPrizeName(p); setShowAllPrizes(false); }}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-colors break-words ${prizeName === p ? 'bg-gold-400 text-night-950 border-gold-300' : 'bg-night-900/80 text-snow/80 border-night-700 hover:border-gold-400/50'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={startSpin}
            disabled={!canSpin || locked}
            data-testid="spin-button"
            className={`relative overflow-hidden w-full py-5 rounded-2xl font-display font-bold text-2xl tracking-[0.15em] transition-transform ${canSpin && !locked
              ? 'btn-shine text-white bg-[linear-gradient(180deg,#ff5a67,#c1121f)] shadow-[0_8px_0_#7a0b15,0_18px_30px_rgba(193,18,31,0.45)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_3px_0_#7a0b15]'
              : 'bg-night-800/80 text-snow/35 cursor-not-allowed'}`}
          >
            {mode === GameMode.SPINNING ? 'GIRANDO…' : '¡GIRAR!'}
          </button>
          <p className="text-center text-[0.6875rem] text-snow/45 -mt-2">
            Atajo: <kbd className="px-1.5 py-0.5 rounded bg-night-800 border border-night-700 text-snow/70">Espacio</kbd> para girar
          </p>
          <a href="#gestion" className="-mt-2 flex items-center justify-center gap-1 text-[0.6875rem] font-bold tracking-widest text-snow/50 hover:text-snow/85 transition-colors">
            LISTAS Y GESTIÓN <ChevronDown className="w-4 h-4 bob" />
          </a>
        </div>
      </section>

      {/* LISTAS Y GESTIÓN */}
      <section id="gestion" className="relative z-10 w-full py-14 px-4 md:px-8 bg-[linear-gradient(180deg,rgba(5,10,26,0.0),rgba(5,10,26,0.92)_80px)]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-start gap-8">
          <Dashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            participants={participants}
            winners={winners}
            eliminated={eliminated}
            locked={locked}
            handleRemoveParticipant={handleRemoveParticipant}
            handleReturnToWheel={handleReturnToWheel}
            handleClearHistory={handleClearHistory}
            playSound={playSound}
          />

          <div className="w-full lg:w-80 space-y-6 shrink-0">
            {/* Jugadores */}
            <div className="frost-panel rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-holly-400" />
                <h3 className="font-display font-semibold text-sm tracking-widest">GESTIÓN DE JUGADORES</h3>
              </div>
              <textarea
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder="Pega nombres aquí (uno por línea)…"
                className="w-full bg-night-950/80 border border-night-700 rounded-xl p-3 text-sm text-snow placeholder:text-snow/35 focus:border-holly-400 focus:ring-1 focus:ring-holly-400 outline-none resize-none h-24"
              />
              <button
                type="button"
                onClick={handleManualImport}
                disabled={locked || !manualInput.trim()}
                className="w-full py-3 rounded-xl bg-holly-600 hover:bg-holly-500 disabled:opacity-40 disabled:hover:bg-holly-600 text-white text-xs font-extrabold tracking-wider transition-colors"
              >
                AGREGAR MANUALMENTE
              </button>
              <div className="flex items-center gap-3 text-[0.625rem] font-bold uppercase tracking-widest text-snow/40">
                <div className="h-px flex-1 bg-night-700" /> o importar <div className="h-px flex-1 bg-night-700" />
              </div>
              <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-colors ${isExtractingPDF || locked ? 'border-night-700 opacity-60 cursor-wait' : 'border-night-700 hover:border-gold-400/60 hover:bg-gold-400/5 cursor-pointer'}`}>
                {isExtractingPDF ? <Loader2 className="w-6 h-6 text-gold-300 mb-2 animate-spin" /> : <FileText className="w-6 h-6 text-snow/50 mb-2" />}
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-snow/60">
                  {isExtractingPDF ? 'Leyendo PDF con IA…' : 'Subir PDF'}
                </span>
                <input type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload} disabled={isExtractingPDF || locked} className="hidden" />
              </label>
              {participants.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearParticipants}
                  disabled={locked}
                  className="w-full py-3 border border-berry-600/60 hover:bg-berry-900/60 text-berry-400 text-xs font-extrabold rounded-xl transition-colors tracking-wider flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" /> BORRAR TODOS
                </button>
              )}
            </div>

            {/* Premios */}
            <div className="frost-panel rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-400" />
                <h3 className="font-display font-semibold text-sm tracking-widest">GESTIÓN DE PREMIOS</h3>
                <span className="ml-auto text-xs font-bold text-snow/50">{prizes.length}</span>
              </div>
              <textarea
                value={prizeInput}
                onChange={e => setPrizeInput(e.target.value)}
                placeholder="Escribe premios (uno por línea)…"
                className="w-full bg-night-950/80 border border-night-700 rounded-xl p-3 text-sm text-snow placeholder:text-snow/35 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 outline-none resize-none h-24"
              />
              <button
                type="button"
                onClick={handlePrizeImport}
                disabled={locked || !prizeInput.trim()}
                className="w-full py-3 rounded-xl bg-gold-400 hover:bg-gold-300 disabled:opacity-40 disabled:hover:bg-gold-400 text-night-950 text-xs font-extrabold tracking-wider transition-colors"
              >
                AGREGAR PREMIOS
              </button>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {prizes.map((prize, idx) => (
                  <div key={`${prize}-${idx}`} className="flex justify-between items-center gap-2 bg-night-950/70 px-3 py-2 rounded-lg border border-night-700">
                    <span className="text-sm text-snow/85 break-words min-w-0"><Gift className="inline w-3.5 h-3.5 mr-1.5 text-berry-400 -mt-0.5" />{prize}</span>
                    <button type="button" onClick={() => handleRemovePrize(idx)} disabled={locked} className="text-snow/40 hover:text-berry-400 p-1 shrink-0 disabled:opacity-30" aria-label={`Quitar premio ${prize}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {prizes.length === 0 && <p className="text-xs text-snow/40 text-center italic py-2">No hay premios registrados</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADO */}
      <AnimatePresence>
        {mode === GameMode.RESULT && selectedResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-night-950/85"
            role="dialog"
            aria-modal="true"
            data-testid="result-modal"
          >
            <motion.div
              initial={{ scale: 0.6, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`relative w-full max-w-lg rounded-[32px] p-8 text-center overflow-hidden border-2 ${resultIsPrize ? 'border-gold-400 bg-[linear-gradient(180deg,#1a2e63,#0a1430)]' : 'border-sky-300/60 bg-[linear-gradient(180deg,#11204a,#050a1a)]'}`}
            >
              {/* Rayos de luz girando (solo transform) */}
              <div className={`rays absolute left-1/2 top-[22%] w-[160%] aspect-square -translate-x-1/2 -translate-y-1/2 pointer-events-none ${resultIsPrize ? 'opacity-40' : 'opacity-15'}`}>
                <div className="w-full h-full rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(255,224,138,0.55)_0deg_10deg,transparent_10deg_24deg)]" />
              </div>

              <div className="relative">
                {resultIsPrize ? (
                  <>
                    <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}>
                      <Gift className="w-20 h-20 mx-auto text-gold-300 drop-shadow-[0_0_20px_rgba(249,199,79,0.6)]" />
                    </motion.div>
                    <h2 className="font-xmas font-bold text-5xl text-gold-gradient mt-2">¡Tenemos ganador!</h2>
                  </>
                ) : (
                  <>
                    <motion.div initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}>
                      <Snowflake className="w-20 h-20 mx-auto text-sky-200 drop-shadow-[0_0_20px_rgba(124,198,255,0.6)]" />
                    </motion.div>
                    <h2 className="font-display font-bold text-4xl text-sky-100 mt-2 tracking-wide">¡Fuera de la ruleta!</h2>
                  </>
                )}

                <div className="mt-6 mb-7 rounded-2xl bg-night-950/70 border border-white/10 p-5">
                  <motion.h3
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="font-display font-bold text-3xl md:text-4xl text-snow break-words"
                    data-testid="result-name"
                  >
                    {selectedResult.name}
                  </motion.h3>
                  {selectedResult.colonia && (
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-bold uppercase tracking-widest text-snow/60">
                      <MapPin className="w-4 h-4" /> {selectedResult.colonia}
                    </p>
                  )}
                  {resultIsPrize && prizeName && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.3em] text-snow/50">Premio</p>
                      <p className="font-display font-bold text-2xl text-gold-300 break-words">{prizeName}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={rejectResult}
                    className="flex-1 py-4 rounded-2xl bg-night-800 hover:bg-night-700 border border-white/10 text-snow font-display font-bold text-lg tracking-widest transition-colors"
                  >
                    RECHAZAR
                  </button>
                  <button
                    type="button"
                    onClick={confirmResult}
                    autoFocus
                    className="flex-1 py-4 rounded-2xl bg-holly-500 hover:bg-holly-400 text-white font-display font-bold text-lg tracking-widest shadow-[0_6px_0_#0a3a22] active:translate-y-1 active:shadow-[0_2px_0_#0a3a22] transition-all"
                  >
                    ACEPTAR
                  </button>
                </div>
                <p className="mt-3 text-[0.6875rem] text-snow/45">
                  Rechazar = la persona sigue en la ruleta · <kbd className="px-1 rounded bg-night-800">Enter</kbd> aceptar · <kbd className="px-1 rounded bg-night-800">Esc</kbd> rechazar
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AVISOS */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center gap-2 pointer-events-none w-[min(92vw,420px)]" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className={`w-full px-5 py-3 rounded-2xl text-sm font-bold text-center shadow-xl border ${t.tone === 'error' ? 'bg-berry-700 border-berry-400/50' : t.tone === 'success' ? 'bg-holly-700 border-holly-400/50' : 'bg-night-800 border-gold-400/30'}`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
