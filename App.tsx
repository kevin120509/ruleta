import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import confetti from 'canvas-confetti';
import {
  Trash2,
  Trophy,
  Upload,
  Users,
  History,
  X,
  Check,
  FileText,
  Sheet,
  Circle,
  ChevronDown,
  MapPin,
  Heart
} from 'lucide-react';
import {
  Participant,
  Winner,
  Eliminated,
  Prize,
  GameMode,
  WHEEL_COLORS,
  CONFETTI_COLORS
} from './types';
import { StarBackground } from './StarBackground';
import Dashboard from './Dashboard';
import fallaMp3 from './sonido/falla.mp3';
import winMp3 from './sonido/premiado.mp3';
import { extractParticipantsFromText } from './gemini';

// --- Constants ---
const CANVAS_SIZE = 1000;
const WHEEL_RADIUS = 480;

// --- Initial Data ---
const INITIAL_PARTICIPANTS: Participant[] = [
  {
    "id": "1",
    "name": "MERCEDES EUAN",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "2",
    "name": "SEYDI PECH",
    "colonia": "DOLORES OTERO"
  },
  {
    "id": "3",
    "name": "PILAR",
    "colonia": "SANTA ROSA"
  },
  {
    "id": "4",
    "name": "ANA GONZALEZ",
    "colonia": "SANTA ROSA"
  },
  {
    "id": "5",
    "name": "ROSY VERDE",
    "colonia": "DOLORES OTERO"
  },
  {
    "id": "6",
    "name": "LUCIA HAU",
    "colonia": "VICENTE SOLIS"
  },
  {
    "id": "7",
    "name": "ALICIA CAUICH",
    "colonia": "ROBLE AGRICOLA"
  },
  {
    "id": "8",
    "name": "CLEMENTINA VAZQUEZ",
    "colonia": "SANTA ROSA"
  },
  {
    "id": "9",
    "name": "DAMARIS POOL",
    "colonia": "CENTRO"
  },
  {
    "id": "10",
    "name": "ISABEL EUAN",
    "colonia": "VICENTE SOLIS"
  },
  {
    "id": "11",
    "name": "VANESSA COB",
    "colonia": "MERCEDES BARRERA"
  },
  {
    "id": "12",
    "name": "ROSY PALOMO",
    "colonia": "CENTRO"
  },
  {
    "id": "13",
    "name": "ROSA CETINA",
    "colonia": "OBRERA"
  },
  {
    "id": "14",
    "name": "VICTORIA AKE",
    "colonia": "SAMBULA"
  },
  {
    "id": "15",
    "name": "ALEJANDRO SUNZA",
    "colonia": "MANZANA 115"
  },
  {
    "id": "16",
    "name": "ISYEL LOZANO",
    "colonia": "SERAPIO RENDON"
  },
  {
    "id": "17",
    "name": "MARGARITA CARDEÑA",
    "colonia": "42 SUR"
  },
  {
    "id": "18",
    "name": "VERONICA MALDONADO",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "19",
    "name": "PEDRO MARTINEZ",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "20",
    "name": "WENDY RAVELL",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "21",
    "name": "MARTINA",
    "colonia": "DOLORES OTERO"
  },
  {
    "id": "22",
    "name": "ANDREA SANCHEZ",
    "colonia": "MERCEDES BARRERA"
  },
  {
    "id": "23",
    "name": "MARICRUZ CELIS",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "24",
    "name": "MARIA SANCHEZ",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "25",
    "name": "JAZMIN ORTIZ",
    "colonia": "CECICLIO CHI"
  },
  {
    "id": "26",
    "name": "FRANCIA",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "27",
    "name": "BERTHA VELEZ",
    "colonia": "OBRERA"
  },
  {
    "id": "28",
    "name": "VIVIANA MAY",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "29",
    "name": "MARIA CANTO",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "30",
    "name": "SAMNATTHA",
    "colonia": "DOLORES OTERO"
  },
  {
    "id": "31",
    "name": "JUAN PECH",
    "colonia": "MANZANA 115"
  },
  {
    "id": "32",
    "name": "ESMERALDA SOLIS",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "33",
    "name": "ANA BRISEÑO",
    "colonia": "CINCO COLONIAS"
  },
  {
    "id": "34",
    "name": "LETICIA CASTRO",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "35",
    "name": "MARIA JOSE",
    "colonia": "DOLORES OTERO"
  },
  {
    "id": "36",
    "name": "MARISOL LAYNES",
    "colonia": "JARDINES SUR"
  },
  {
    "id": "37",
    "name": "SILIA MARIN",
    "colonia": "OBRERA"
  },
  {
    "id": "38",
    "name": "ANAHI",
    "colonia": "CENTRO"
  },
  {
    "id": "39",
    "name": "JOSE CASTELLANOS",
    "colonia": "DOLORES OTERO"
  },
  {
    "id": "40",
    "name": "BEATRIZ PEREZ",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "41",
    "name": "EVERLINDA",
    "colonia": "AZCORRA"
  },
  {
    "id": "42",
    "name": "MONSERRAT",
    "colonia": "OBRERA"
  },
  {
    "id": "43",
    "name": "LIZET MACHORRO",
    "colonia": "VILLA MAGNA"
  },
  {
    "id": "44",
    "name": "DOÑA GABY",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "45",
    "name": "LETICIA",
    "colonia": "OBRERA"
  },
  {
    "id": "46",
    "name": "REBECA PEREZ",
    "colonia": "MANZANA 115"
  },
  {
    "id": "47",
    "name": "ADDY YOLANDA",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "48",
    "name": "ADRIANA CEBALLOS",
    "colonia": "CENTRO PEDRO INFANTE"
  },
  {
    "id": "49",
    "name": "DANIEL GUZMAN",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "50",
    "name": "JOAQUIN",
    "colonia": "CENTRO"
  },
  {
    "id": "51",
    "name": "LIZETH PALACIOS",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "52",
    "name": "NELLY",
    "colonia": "OBRERA"
  },
  {
    "id": "53",
    "name": "ROSANA GOROCICA",
    "colonia": "CENTRO"
  },
  {
    "id": "54",
    "name": "CLAUDIA ARCILA",
    "colonia": "CENTRO"
  },
  {
    "id": "55",
    "name": "LIGIA AKE",
    "colonia": "CANTO"
  },
  {
    "id": "56",
    "name": "ESTEFANY VALDEZ",
    "colonia": "CINCO COLONIAS"
  },
  {
    "id": "57",
    "name": "KATTY XOOL",
    "colonia": "CENTRO"
  },
  {
    "id": "58",
    "name": "SUGELY VERA",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "59",
    "name": "CRISTIAN",
    "colonia": "OBRERA"
  },
  {
    "id": "60",
    "name": "MARIEN PEREIRA",
    "colonia": "OBRERA"
  },
  {
    "id": "61",
    "name": "ANDY VALLE",
    "colonia": "MANZANA 115"
  },
  {
    "id": "62",
    "name": "GABRIELA PERAZA",
    "colonia": "CENTRO HERMITA"
  },
  {
    "id": "63",
    "name": "MARIBEL CASTILLO",
    "colonia": "PEDRO INFANTE"
  },
  {
    "id": "64",
    "name": "TERE CERVANTES",
    "colonia": "CENTRO"
  },
  {
    "id": "65",
    "name": "DELIA ALTAMIRANO",
    "colonia": "DOLORES OTERO"
  },
  {
    "id": "66",
    "name": "ALMA RODRIGUEZ",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "67",
    "name": "ANA GONZALEZ",
    "colonia": "SANTA ROSA"
  },
  {
    "id": "68",
    "name": "SARA",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "69",
    "name": "GORETY",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "70",
    "name": "ROSITA",
    "colonia": "MANZANA 115"
  },
  {
    "id": "71",
    "name": "MERCEDES EUAN",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "72",
    "name": "LISET CELIS",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "73",
    "name": "SELENE JIMENEZ DIAZ",
    "colonia": "MERCEDES BARRERA"
  },
  {
    "id": "74",
    "name": "DOÑA GLADYS",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "75",
    "name": "ROSA ISELA",
    "colonia": "MERCEDES BARRERA"
  },
  {
    "id": "76",
    "name": "ROSY SANCHEZ",
    "colonia": "CENTRO"
  },
  {
    "id": "77",
    "name": "LEYDI VAZQUEZ",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "78",
    "name": "KARINA MARTIN",
    "colonia": "DELIO MORENO"
  },
  {
    "id": "79",
    "name": "MONSE AGUILAR",
    "colonia": "CINCO COLONIAS"
  },
  {
    "id": "80",
    "name": "TETE ITZA",
    "colonia": "CEMENTERIO GENERAL"
  },
  {
    "id": "81",
    "name": "JOEL PALMA",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "82",
    "name": "FATIMA DAZA",
    "colonia": "MERCEDES BARRERA"
  },
  {
    "id": "83",
    "name": "GABRIELA DEL SOCORRO CAAMAL",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "84",
    "name": "ELIZABETH PEREZ",
    "colonia": "CENTRO"
  },
  {
    "id": "85",
    "name": "SANDRA OXTE",
    "colonia": "OBRERA"
  },
  {
    "id": "86",
    "name": "GABRIEL MEDINA",
    "colonia": "CENTRO"
  },
  {
    "id": "87",
    "name": "ALEXANDRA PEREZ",
    "colonia": "SAN JOSE TEOCH (PENAL)"
  },
  {
    "id": "88",
    "name": "BERTHA MARTIN",
    "colonia": "DELIO MORENO"
  },
  {
    "id": "89",
    "name": "ARELY LARA",
    "colonia": "MERCEDES BARRERA"
  },
  {
    "id": "90",
    "name": "ANGELICA",
    "colonia": "HACIENDA"
  },
  {
    "id": "91",
    "name": "ADRIANA SANDORES",
    "colonia": "DELIO MORENO"
  },
  {
    "id": "92",
    "name": "BETY PALMA",
    "colonia": "SERAPIO RENDON"
  },
  {
    "id": "93",
    "name": "VENUS MONRROY",
    "colonia": "VILLA MAGNA"
  },
  {
    "id": "94",
    "name": "TRINI",
    "colonia": "DELIO MORENO"
  },
  {
    "id": "95",
    "name": "MAYRA PEREZ",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "96",
    "name": "FRANCIA",
    "colonia": "SAN JOSE TEOCH"
  },
  {
    "id": "97",
    "name": "HEIDI CANCHE",
    "colonia": "CENTRO"
  },
  {
    "id": "98",
    "name": "LIZBET ZAPATA",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "99",
    "name": "EDWIN OXTE",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "100",
    "name": "LIZET NARVAEZ",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "101",
    "name": "ENRIQUE GARMA",
    "colonia": "CENTRO"
  },
  {
    "id": "102",
    "name": "BERENICE BLANCARTE",
    "colonia": "FRACC DEL SUR"
  },
  {
    "id": "103",
    "name": "MANUEL PECH DELIO MORENO",
    "colonia": " (CEIBA)"
  },
  {
    "id": "104",
    "name": "BERTHA VELEZ",
    "colonia": "OBRERA"
  },
  {
    "id": "105",
    "name": "JEANINE ALONZO",
    "colonia": "MERCEDES BARRERA"
  },
  {
    "id": "106",
    "name": "CINTHIA CAAMAL",
    "colonia": "DOLORES OTERO"
  },
  {
    "id": "107",
    "name": "MARIA DEL SOCORRO",
    "colonia": "CHUMINOPOLIS"
  },
  {
    "id": "108",
    "name": "NORMA ROSSEL",
    "colonia": "CENTRO"
  },
  {
    "id": "109",
    "name": "MAYA PECH",
    "colonia": "VILLA MAGNA"
  },
  {
    "id": "110",
    "name": "SARA CANTO",
    "colonia": "HERMITA"
  },
  {
    "id": "111",
    "name": "GUADALUPE TRUJILLO",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "112",
    "name": "FLOR TRUJILLO",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "113",
    "name": "GABRIELA PERAZA CENTRO",
    "colonia": "HERMITA"
  },
  {
    "id": "114",
    "name": "MARISOL NARVAEZ",
    "colonia": "MANZANA 115"
  },
  {
    "id": "115",
    "name": "GUADALUPE MELENDEZ",
    "colonia": "CENTRO"
  },
  {
    "id": "116",
    "name": "JESSICA PECH",
    "colonia": "OBRERA"
  },
  {
    "id": "117",
    "name": "MISHEO JIMENEZ",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "118",
    "name": "GUADALUPE ROSSEL",
    "colonia": "CENTRO"
  },
  {
    "id": "119",
    "name": "MARTHA MARTIN",
    "colonia": "VILLA MAGNA"
  },
  {
    "id": "120",
    "name": "MARIA CANTO",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "121",
    "name": "BEATRIZ AMPARO",
    "colonia": "VILLA MAGNA"
  },
  {
    "id": "122",
    "name": "SIRENA",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "123",
    "name": "MARIANA CAN",
    "colonia": "CANTO"
  },
  {
    "id": "124",
    "name": "ROSITA",
    "colonia": "MANZANA 115"
  },
  {
    "id": "125",
    "name": "GABRIELA AGUILAR",
    "colonia": "MORELOS"
  },
  {
    "id": "126",
    "name": "KARELY VIANA",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "127",
    "name": "LUCY YAMA",
    "colonia": "SANTA ROSA"
  },
  {
    "id": "128",
    "name": "ELDA PINTO",
    "colonia": "CASTILLA CAMARA"
  },
  {
    "id": "129",
    "name": "NAYELI BURGOS",
    "colonia": "MELITON SALAZAR"
  },
  {
    "id": "130",
    "name": "VERONICA PEREIRA",
    "colonia": "SANTA ROSA"
  }
];

export default function App() {
  console.log("App rendering");
  // --- State ---
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      // Changed storage key to force new list from code
      const saved = localStorage.getItem('participants_mothers_day');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading participants from localStorage", e);
      return [];
    }
  });

  const [winners, setWinners] = useState<Winner[]>([]);
  const [eliminated, setEliminated] = useState<Eliminated[]>([]);

  const [mode, setMode] = useState<GameMode>(GameMode.IDLE);
  const [prizeName, setPrizeName] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<Participant | null>(null);
  const [activeTab, setActiveTab] = useState<'PLAYERS' | 'WINNERS' | 'ELIMINATED'>('PLAYERS');
  const [showAllPrizes, setShowAllPrizes] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [prizeInput, setPrizeInput] = useState('');
  const [prizes, setPrizes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('prizes_mothers_day');
      const parsed = saved ? JSON.parse(saved) : null;
      // Force default if null or empty array
      return (parsed && parsed.length > 0) ? parsed : [];
    } catch (e) {
      console.error("Error loading prizes from localStorage", e);
      return [];
    }
  });

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('participants_mothers_day', JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    localStorage.setItem('prizes_mothers_day', JSON.stringify(prizes));
  }, [prizes]);

  // --- Refs ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelCacheRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const currentAngleRef = useRef<number>(0);
  const isSpinningRef = useRef<boolean>(false);
  const spinVelocityRef = useRef<number>(0);
  const lastTickAngleRef = useRef<number>(0); // For spin sound timing
  const spinStartTimeRef = useRef<number>(0); // Track when spin started
  const spinDurationRef = useRef<number>(0); // Fixed duration for current spin
  const lastSoundTimeRef = useRef<number>(0); // Throttle sounds

  // DOM Refs for direct manipulation (Performance Optimization)

  const tickerNameRef = useRef<HTMLHeadingElement>(null);
  const tickerColoniaRef = useRef<HTMLParagraphElement>(null);
  const tickerContainerRef = useRef<HTMLDivElement>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const failAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    winAudioRef.current = new Audio(winMp3);
    failAudioRef.current = new Audio(fallaMp3);
    // Preload
    winAudioRef.current.load();
    failAudioRef.current.load();
  }, []);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playSound = useCallback((type: 'pop' | 'spin' | 'win' | 'elimination') => {
    try {
      if (type === 'win') {
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          winAudioRef.current.play().catch(e => console.error("Win sound play error", e));
        }
        return;
      }
      
      if (type === 'elimination') {
        if (failAudioRef.current) {
          failAudioRef.current.currentTime = 0;
          failAudioRef.current.play().catch(e => console.error("Elimination sound play error", e));
        }
        return;
      }

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.error("Audio resume failed", e));
      }

      switch (type) {
        case 'pop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          // A nice high-pitch "blip" for UI interactions
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
          
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
          break;
        }
        case 'spin': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
          
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.05);
          break;
        }
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  }, []);

  const generateWheelCache = useCallback(() => {
    const len = participants.length;
    if (len === 0) return;

    if (!wheelCacheRef.current) {
      wheelCacheRef.current = document.createElement('canvas');
      wheelCacheRef.current.width = CANVAS_SIZE;
      wheelCacheRef.current.height = CANVAS_SIZE;
    }

    const ctx = wheelCacheRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const arc = (2 * Math.PI) / len;

    for (let i = 0; i < len; i++) {
      const angle = i * arc;
      const colorSet = WHEEL_COLORS[i % WHEEL_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, WHEEL_RADIUS, angle, angle + arc);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = colorSet.bg;
      ctx.fill();

      // Optimize stroke - only draw if segments are large enough to matter or limit opacity
      if (len < 100) {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Only render text if less than 60 participants to avoid clutter
      // DISABLED: User requested to hide names on the wheel
      /*
      if (len <= 60) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorSet.text;

        let fontSize = 24;
        if (len > 40) fontSize = 20;

        ctx.font = `bold ${fontSize}px Inter`;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 4;
        ctx.fillText(participants[i].name, WHEEL_RADIUS - 20, 0);
        ctx.restore();
      }
      */
    }
  }, [participants]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); // Optimize: Use alpha: false if possible but we need transparent bg maybe? No, main bg is dark.
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;

    // Outer Ring - Optimize by drawing simpler or caching if needed (Drawing arcs is cheap though)
    ctx.beginPath();
    ctx.arc(centerX, centerY, WHEEL_RADIUS + 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#4c0519'; // rose-950
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ec4899'; // pink-500
    ctx.stroke();

    if (participants.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, WHEEL_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = '#881337'; // rose-900
      ctx.fill();
      ctx.fillStyle = '#fda4af'; // rose-300
      ctx.font = '600 30px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Añade participantes abajo', centerX, centerY);
      return;
    }

    if (wheelCacheRef.current) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(currentAngleRef.current);
      ctx.translate(-centerX, -centerY);
      ctx.drawImage(wheelCacheRef.current, 0, 0);
      ctx.restore();
    }

    // Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.fillStyle = '#4c0519'; // rose-950
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#f43f5e'; // rose-500
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#ec4899'; // pink-500
    ctx.fill();
  }, [participants]);

  useEffect(() => {
    generateWheelCache();
    drawWheel();
  }, [participants, generateWheelCache, drawWheel]);

  // Track the last index to play sound only when segment changes
  const lastIndexRef = useRef<number>(-1);

  const updateTicker = () => {
    const len = participants.length;
    if (len === 0) return;

    const arc = (2 * Math.PI) / len;
    let rotation = currentAngleRef.current % (2 * Math.PI);
    // The pointer is at 270 degrees (top), so we need to adjust
    // 1.5 * PI is 270 degrees in radians
    let pointerAngle = (1.5 * Math.PI - rotation + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor(pointerAngle / arc);

    // Play tick sound on segment change with throttling
    if (index !== lastIndexRef.current) {
      lastIndexRef.current = index;
      // FIX LAG: El sonido en bucle de WebAudio congela la animación en muchos navegadores. 
      // Se apaga el tick del 'spin' para priorizar que la ruleta se mueva a máxima fluidez.
    }

    // Safety check
    const safeIndex = Math.max(0, Math.min(index, len - 1));
    const p = participants[safeIndex];
    if (p) {
      // Direct DOM manipulation for performance
      if (tickerNameRef.current) tickerNameRef.current.textContent = p.name;
      if (tickerColoniaRef.current) tickerColoniaRef.current.textContent = p.colonia || '';
    }
  };

  const animateSpin = () => {
    if (!isSpinningRef.current) return;

    // Constant high velocity (No friction for "stop suddenly" effect)
    currentAngleRef.current += spinVelocityRef.current;
    if (currentAngleRef.current >= 2 * Math.PI) currentAngleRef.current -= 2 * Math.PI;

    drawWheel();
    updateTicker();

    const elapsed = Date.now() - spinStartTimeRef.current;

    // Stop abruptly when duration is reached
    if (elapsed >= spinDurationRef.current) {
      isSpinningRef.current = false;
      finishSpin();
    } else {
      animationRef.current = requestAnimationFrame(animateSpin);
    }
  };

  const startSpin = () => {
    if (participants.length === 0 || mode === GameMode.IDLE) return;
    if (mode === GameMode.PREP_PRIZE) {
      if (!prizeName) {
        alert("Por favor, selecciona un premio de la lista antes de girar.");
        return;
      }
    }

    // Initialize AudioContext on direct user interaction
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }

    // playSound('spin'); // handled in loop now
    setMode(GameMode.SPINNING);

    // Show ticker container
    if (tickerContainerRef.current) {
      tickerContainerRef.current.style.opacity = '1';
      tickerContainerRef.current.style.transform = 'translateY(0)';
    }

    isSpinningRef.current = true;

    // Higher constant velocity for a fast spin feel
    spinVelocityRef.current = 0.6 + Math.random() * 0.2;

    // Increased duration: 4 to 5 seconds
    spinStartTimeRef.current = Date.now();
    spinDurationRef.current = 4000 + Math.random() * 1000;

    // Reset last index to force update
    lastIndexRef.current = -1;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animateSpin();
  };

  const stopSpinSound = () => {
    // No-op for synth tick style, handled in loop
  };

  const finishSpin = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const len = participants.length;
    const arc = (2 * Math.PI) / len;
    let rotation = currentAngleRef.current % (2 * Math.PI);
    let pointerAngle = (1.5 * Math.PI - rotation + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor(pointerAngle / arc);
    const winner = participants[index];
    setSelectedResult(winner);
    setMode(GameMode.RESULT);

    // Hide ticker container
    if (tickerContainerRef.current) {
      tickerContainerRef.current.style.opacity = '0';
      tickerContainerRef.current.style.transform = 'translateY(20px)';
    }

    if (prizeName) {
      playSound('win');
      // confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
    } else {
      playSound('elimination');
    }
  };

  const handleManualImport = () => {
    if (!manualInput.trim()) return;
    try {
      playSound('pop');
    } catch (e) {
      console.error("Audio error", e);
    }
    const names = manualInput.split('\n').filter(n => n.trim().length > 0);
    const newParticipants = names.map(name => ({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: name.trim(),
      colonia: ''
    }));
    setParticipants(prev => [...prev, ...newParticipants]);
    setManualInput('');
  };

  const handlePrizeImport = () => {
    if (!prizeInput.trim()) return;
    try {
      playSound('pop');
    } catch (e) {
      console.error("Audio error", e);
    }
    const newPrizes = prizeInput.split('\n').filter(p => p.trim().length > 0);
    setPrizes(prev => [...prev, ...newPrizes]);
    setPrizeInput('');
  };

  const handleRemoveParticipant = useCallback((id: string) => {
    playSound('pop');
    setParticipants(prev => {
      const updated = prev.filter(p => p.id !== id);
      return updated;
    });
  }, [playSound]);

  const handleReturnToWheel = useCallback((id: string, from: 'WINNERS' | 'ELIMINATED') => {
    playSound('pop');
    let person: Participant | undefined;
    if (from === 'WINNERS') {
      const found = winners.find(w => w.id === id);
      if (found) {
        person = { id: found.id, name: found.name, colonia: found.colonia };
        setWinners(prev => prev.filter(w => w.id !== id));
        // Return prize to the list
        if (found.prize) {
          setPrizes(prev => [...prev, found.prize]);
        }
      }
    } else {
      const found = eliminated.find(e => e.id === id);
      if (found) {
        person = { id: found.id, name: found.name, colonia: found.colonia };
        setEliminated(prev => prev.filter(e => e.id !== id));
      }
    }

    if (person) {
      setParticipants(prev => [person!, ...prev]);
    }
  }, [winners, eliminated, playSound]);

  const handleRemovePrize = (index: number) => {
    // Use setTimeout to ensure UI updates aren't blocked by audio sync issues
    setTimeout(() => playSound('pop'), 0);
    setPrizes(prev => prev.filter((_, i) => i !== index));
  };

  const [isExtractingPDF, setIsExtractingPDF] = useState(false);

  const handleClearParticipants = () => {
    if (window.confirm("¿Estás seguro de que quieres borrar a TODOS los participantes?")) {
      playSound('pop');
      setParticipants([]);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    playSound('pop');

    setIsExtractingPDF(true);
    // UI feedback provisional
    const loadingToast = document.createElement('div');
    loadingToast.textContent = 'Procesando PDF con Inteligencia Artificial...';
    loadingToast.className = 'fixed top-10 left-1/2 -translate-x-1/2 z-[9999] bg-pink-600 text-white px-6 py-3 rounded-full shadow-lg font-bold animate-pulse';
    document.body.appendChild(loadingToast);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullRawText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullRawText += textContent.items.map((item: any) => item.str).join('\n') + "\n";
      }

      const extractedData = await extractParticipantsFromText(fullRawText);
      
      const newParticipants: Participant[] = extractedData.map((p: any) => ({
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        name: p.name || "Desconocido",
        colonia: p.colonia || ""
      }));

      if (newParticipants.length > 0) {
        setParticipants(prev => [...prev, ...newParticipants]);
        alert(`¡La IA encontró e importó ${newParticipants.length} participantes con éxito!`);
      } else {
        alert("La IA no pudo estructurar ningún participante en este PDF.");
      }

    } catch (error: any) {
      console.error("Error leyendo PDF con IA:", error);
      alert("Error procesando PDF. Verifica la consola o tu clave API.");
    } finally {
      document.body.removeChild(loadingToast);
      setIsExtractingPDF(false);
      e.target.value = '';
    }
  };

  const confirmResult = () => {
    playSound('pop');
    if (!selectedResult) return;

    if (prizeName) {
      setWinners(prev => [{
        id: selectedResult.id,
        name: selectedResult.name,
        colonia: selectedResult.colonia,
        prize: prizeName,
        timestamp: new Date()
      }, ...prev]);
      // Consume the selected prize - Remove only the first instance found
      setPrizes(prev => {
        const index = prev.indexOf(prizeName);
        if (index > -1) {
          const newPrizes = [...prev];
          newPrizes.splice(index, 1);
          return newPrizes;
        }
        return prev;
      });
    } else {
      setEliminated(prev => [{
        id: selectedResult.id,
        name: selectedResult.name,
        colonia: selectedResult.colonia,
        timestamp: new Date()
      }, ...prev]);
    }
    // Remove from the wheel (participants list) in both cases
    setParticipants(prev => prev.filter(p => p.id !== selectedResult.id));
    closeModal();
  };

  const closeModal = () => {
    setSelectedResult(null);
    setMode(GameMode.IDLE);
    setPrizeName('');
    setTimeout(() => drawWheel(), 0);
  };

  return (
    <div className="min-h-screen bg-rose-950 text-rose-100 selection:bg-pink-500 selection:text-white flex flex-col">

      {/* BACKGROUND DECOR */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <StarBackground />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(244,63,94,0.15),transparent_70%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,153,0.15),transparent_70%)]"></div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 w-full p-4 flex justify-between items-center bg-rose-950/95 border-b border-rose-900/50 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-md"></div>
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 border border-pink-200/50 shadow-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase italic">
            LA BURBUJA <span className="text-pink-400">FELIZ</span>
          </h1>
        </div>

        {/* Festive Greeting */}
        <div className="hidden md:block">
          <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-200 to-rose-500 tracking-widest uppercase drop-shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse">
            ¡FELIZ DÍA DE LAS MADRES!
          </h2>
        </div>
      </header>

      {/* MAIN VIEWPORT (WHEEL) */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center p-4 z-10">

        {/* TICKER DISPLAY (OPTIMIZED) */}
        <div className="absolute top-24 z-40 pointer-events-none">
          <div
            ref={tickerContainerRef}
            className="bg-rose-900/95 border border-pink-500/30 px-8 py-4 rounded-full shadow-[0_0_30px_rgba(244,63,94,0.3)] text-center transition-all duration-300 opacity-0 translate-y-5 will-change-transform"
          >
            <h2 ref={tickerNameRef} className="text-2xl font-black text-pink-300 tracking-widest uppercase drop-shadow-lg">
              PREPARANDO...
            </h2>
            <p ref={tickerColoniaRef} className="text-sm font-bold text-rose-200 tracking-[0.2em] mt-1">
            </p>
          </div>
        </div>

        {/* WHEEL STAGE */}
        <div className="relative w-full max-w-[600px] aspect-square flex items-center justify-center mb-10 mt-10">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]">
            <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[36px] border-t-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
          </div>

          {/* Wheel Glow */}
          <div className="absolute inset-8 rounded-full bg-pink-500/10 blur-[40px]"></div>

          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="w-full h-full rounded-full shadow-[0_0_60px_rgba(0,0,0,0.5)] relative z-10 will-change-transform"
            style={{ transform: `rotate(-90deg)` }}
          />
        </div>

        {/* QUICK CONTROLS */}
        <div className="w-full max-w-2xl bg-rose-900/80 border border-rose-800/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative z-[100] pointer-events-auto backdrop-blur-md">
          <div className="text-center">
            <span className={`text-xs font-black uppercase tracking-[0.3em] ${mode === GameMode.SPINNING ? 'text-pink-400 animate-pulse' : 'text-rose-400/60'}
              `}>
              {mode === GameMode.IDLE ? 'Selecciona un modo para empezar' :
                mode === GameMode.PREP_PRIZE ? (prizeName ? `PREMIO SELECCIONADO: ${prizeName}` : 'MODO: SORTEAR PREMIO') :
                  mode === GameMode.PREP_ELIMINATION ? 'MODO: ELIMINAR JUGADOR' :
                    mode === GameMode.SPINNING ? 'GIRANDO POR MAMÁ...' :
                      'LISTO'}
            </span>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                if (prizes.length === 0) {
                  alert("¡No hay premios disponibles! Agrega premios en la sección 'GESTIÓN DE PREMIOS' primero.");
                  return;
                }
                playSound('pop');
                setMode(GameMode.PREP_PRIZE);
                setShowAllPrizes(false);
                // Select a random prize
                const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
                setPrizeName(randomPrize);
              }}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${mode === GameMode.PREP_PRIZE ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700'}
                }`}
            >
              <Trophy className="w-6 h-6" />
              <span className="text-[10px] font-black tracking-widest">PREMIAR</span>
            </button>

            <button
              onClick={() => { playSound('pop'); setMode(GameMode.PREP_ELIMINATION); setPrizeName(''); }}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${mode === GameMode.PREP_ELIMINATION ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700'}
                }`}
            >
              <Trash2 className="w-6 h-6" />
              <span className="text-[10px] font-black tracking-widest">ELIMINAR</span>
            </button>
          </div>

          <AnimatePresence>
            {mode === GameMode.PREP_PRIZE && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                {!showAllPrizes ? (
                  <div className="text-center p-6 bg-gradient-to-br from-rose-900/40 to-pink-900/20 border border-pink-500/30 rounded-2xl relative overflow-hidden group">
                    <Trophy className="w-16 h-16 text-pink-500/10 absolute -right-2 -bottom-2 rotate-[-15deg]" />
                    <p className="text-2xl font-black text-white drop-shadow-[0_0_15px_rgba(244,63,94,0.6)] tracking-wide">{prizeName}</p>
                    <button 
                      onClick={() => {
                          setShowAllPrizes(true);
                          playSound('pop');
                      }}
                      className="mt-3 text-[10px] font-bold text-pink-400 hover:text-pink-300 uppercase tracking-widest underline decoration-pink-500/30 underline-offset-4 transition-colors cursor-pointer"
                    >
                      Cambiar Premio
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-500 text-center uppercase tracking-[0.3em]">Selección Manual</p>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2">
                      {prizes.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => { 
                            playSound('pop'); 
                            setPrizeName(p); 
                            setShowAllPrizes(false);
                          }}
                          className={`p-3 rounded-xl text-xs font-bold border transition-all ${prizeName === p
                            ? 'bg-sky-500 text-white border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)]'
                            : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={startSpin}
            disabled={mode === GameMode.IDLE || mode === GameMode.SPINNING || participants.length === 0}
            className={`w-full py-5 rounded-2xl font-black text-xl tracking-[0.2em] transition-all shadow-xl ${mode === GameMode.IDLE || participants.length === 0
              ? 'bg-rose-900/50 text-rose-800'
              : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-rose-900/30'}
              }`}
          >
            {mode === GameMode.SPINNING ? 'LA BURBUJA GIRA...' : 'GIRAR RULETA'}
          </button>
        </div>

        <div className="mt-20 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="text-[10px] font-bold tracking-widest text-rose-400">VER LISTAS Y GESTIÓN</span>
          <ChevronDown className="w-5 h-5 text-rose-500" />
        </div>
      </section>

      {/* DASHBOARD (BOTTOM CONTENT) */}
      <section className="w-full py-20 px-4 md:px-8 bg-rose-950/80 border-t border-rose-900/50 z-10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">

          <div className="flex flex-col md:flex-row items-start gap-10">

            {/* Left: Tab System */}
            <Dashboard
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              participants={participants}
              winners={winners}
              eliminated={eliminated}
              handleRemoveParticipant={handleRemoveParticipant}
              handleReturnToWheel={handleReturnToWheel}
              playSound={playSound}
            />

            {/* Right: Management Panel */}
            <div className="w-full md:w-80 space-y-8">

              {/* Add Players */}
              <div className="bg-rose-900/40 rounded-3xl border border-rose-800/50 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <h3 className="text-xs font-black text-rose-300 uppercase tracking-widest">Gestión de Jugadores</h3>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Pegar nombres aquí (uno por línea)..."
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none resize-none h-24"
                  />
                  <button
                    type="button"
                    onClick={handleManualImport}
                    className="w-full py-3 bg-rose-800/50 hover:bg-rose-700/50 text-rose-200 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
                  >
                    Agregar Manualmente
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-900 px-2 text-gray-500">O importar</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-800 rounded-xl hover:border-sky-500/50 hover:bg-sky-500/5 transition-all cursor-pointer group">
                    <FileText className="w-6 h-6 text-gray-600 group-hover:text-sky-500 mb-2 transition-colors" />
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-sky-400 uppercase tracking-widest">Subir PDF</span>
                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                  </label>
                  
                  {participants.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearParticipants}
                      className="w-full py-3 border border-rose-800 hover:bg-rose-900/80 text-rose-400 hover:text-rose-300 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Borrar Todos
                    </button>
                  )}
                </div>
              </div>

              {/* Add Prizes */}
              <div className="bg-gray-900/60 rounded-3xl border border-gray-800 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Gestión de Premios</h3>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={prizeInput}
                    onChange={(e) => setPrizeInput(e.target.value)}
                    placeholder="Escribir premios (uno por línea)..."
                    className="w-full bg-rose-950/50 border border-rose-800/50 rounded-xl p-3 text-xs text-rose-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none resize-none h-24"
                  />
                  <button
                    type="button"
                    onClick={handlePrizeImport}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
                  >
                    Agregar Premios
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {prizes.map((prize, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-rose-950/50 p-2 rounded-lg border border-rose-800/50">
                      <span className="text-xs font-medium text-gray-400">{prize}</span>
                      <button onClick={() => handleRemovePrize(idx)} className="text-gray-600 hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {prizes.length === 0 && <p className="text-[10px] text-gray-600 text-center italic">No hay premios registrados</p>}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {mode === GameMode.RESULT && selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gray-900 border border-rose-700 p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(244,63,94,0.4)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-pink-600/10 to-transparent pointer-events-none"></div>

              {prizeName ? (
                <div className="mb-6">
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-bounce" />
                  <h2 className="text-3xl font-black text-white mt-4 uppercase italic tracking-wider">¡GANADOR!</h2>
                </div>
              ) : (
                <div className="mb-6">
                  <Trash2 className="w-20 h-20 text-rose-500 mx-auto drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                  <h2 className="text-3xl font-black text-white mt-4 uppercase italic tracking-wider">ELIMINADO</h2>
                </div>
              )}

              <div className="bg-rose-950/50 p-6 rounded-2xl border border-rose-800/50 mb-8">
                <h3 className="text-2xl font-black text-pink-400 mb-2 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">{selectedResult.name}</h3>
                {selectedResult.colonia && (
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-sm font-bold uppercase tracking-widest">{selectedResult.colonia}</p>
                  </div>
                )}
                {prizeName && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Premio</p>
                    <p className="text-xl font-black text-yellow-400">{prizeName}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={closeModal}
                  className="flex-1 py-4 bg-rose-600 text-white font-black text-lg rounded-xl hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-rose-900/20"
                >
                  RECHAZAR
                </button>
                <button
                  onClick={confirmResult}
                  className="flex-1 py-4 bg-emerald-600 text-white font-black text-lg rounded-xl hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/20"
                >
                  ACEPTAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}