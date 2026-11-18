import React, { memo, useEffect, useRef, useState } from 'react';
import { Gift, MapPin, RotateCcw, Snowflake, Trash2, X } from 'lucide-react';
import { Participant, Winner, Eliminated } from './types';

type Tab = 'PLAYERS' | 'WINNERS' | 'ELIMINATED';

interface DashboardProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  participants: Participant[];
  winners: Winner[];
  eliminated: Eliminated[];
  /** true mientras gira o hay un resultado abierto: no se permite editar listas. */
  locked: boolean;
  handleRemoveParticipant: (id: string) => void;
  handleReturnToWheel: (id: string, from: 'WINNERS' | 'ELIMINATED') => void;
  handleClearHistory: () => void;
  playSound: (type: 'pop') => void;
}

const PAGE = 30;

const Dashboard = memo(({
  activeTab,
  setActiveTab,
  participants,
  winners,
  eliminated,
  locked,
  handleRemoveParticipant,
  handleReturnToWheel,
  handleClearHistory,
  playSound,
}: DashboardProps) => {
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const total = activeTab === 'PLAYERS' ? participants.length : activeTab === 'WINNERS' ? winners.length : eliminated.length;

  useEffect(() => setVisibleCount(PAGE), [activeTab]);

  // Carga progresiva: el observador mira dentro de la caja con scroll (antes miraba la ventana).
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) setVisibleCount(v => Math.min(v + PAGE, total));
      },
      { root: scrollRef.current, rootMargin: '200px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab, total, visibleCount]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'PLAYERS', label: 'JUGADORES', count: participants.length },
    { id: 'WINNERS', label: 'GANADORES', count: winners.length },
    { id: 'ELIMINATED', label: 'ELIMINADOS', count: eliminated.length },
  ];

  const actionBtn = 'p-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="flex-1 w-full min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex p-1 rounded-2xl bg-night-950/80 border border-night-700 w-full sm:w-auto">
          {tabs.map(tab => (
            <button
              type="button"
              key={tab.id}
              onClick={() => { playSound('pop'); setActiveTab(tab.id); }}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2.5 text-[11px] sm:text-xs font-extrabold rounded-xl tracking-wider transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-berry-600 text-white shadow-lg shadow-berry-900/40' : 'text-snow/55 hover:text-snow'}`}
            >
              {tab.label}
              <span className={`min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white/20' : 'bg-night-800'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        {activeTab !== 'PLAYERS' && (winners.length > 0 || eliminated.length > 0) && (
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={locked}
            className="text-[11px] font-bold tracking-widest text-snow/50 hover:text-berry-400 flex items-center gap-1.5 disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" /> LIMPIAR HISTORIAL
          </button>
        )}
      </div>

      <div ref={scrollRef} className="frost-panel rounded-3xl p-4 md:p-6 min-h-[360px] max-h-[720px] overflow-y-auto custom-scrollbar">
        {activeTab === 'PLAYERS' && (
          <>
            <p className="text-[11px] font-bold text-snow/45 uppercase tracking-widest mb-4 px-1">
              Mostrando {Math.min(visibleCount, participants.length)} de {participants.length}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {participants.slice(0, visibleCount).map(p => (
                <div key={p.id} className="group relative flex items-center justify-between gap-2 rounded-xl bg-night-950/60 border border-night-700 hover:border-holly-400/50 p-3.5 transition-colors">
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-snow truncate">{p.name}</p>
                    {p.colonia && (
                      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-snow/50 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {p.colonia}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(p.id)}
                    disabled={locked}
                    aria-label={`Quitar a ${p.name}`}
                    className={`${actionBtn} text-snow/40 hover:text-berry-400 hover:bg-berry-500/10 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {participants.length === 0 && <Empty text="No hay participantes" />}
          </>
        )}

        {activeTab === 'WINNERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {winners.slice(0, visibleCount).map(w => (
              <div key={`${w.id}-${+new Date(w.timestamp)}`} className="relative overflow-hidden rounded-2xl border border-gold-400/35 bg-[linear-gradient(135deg,rgba(249,199,79,0.12),rgba(15,107,57,0.12))] p-4 flex items-center justify-between gap-3">
                <Gift className="absolute -right-3 -bottom-4 w-24 h-24 text-gold-400/10 rotate-[-12deg] pointer-events-none" />
                <div className="relative min-w-0">
                  <p className="font-display font-bold text-lg text-snow leading-tight break-words">{w.name}</p>
                  {w.colonia && (
                    <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-snow/50 mb-2">
                      <MapPin className="w-3 h-3" /> {w.colonia}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gold-400/15 border border-gold-400/30 px-2.5 py-1 text-xs font-bold text-gold-200">
                    <Gift className="w-3.5 h-3.5" /> {w.prize}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleReturnToWheel(w.id, 'WINNERS')}
                  disabled={locked}
                  title="Regresar a la ruleta (el premio vuelve a la lista)"
                  aria-label={`Regresar a ${w.name} a la ruleta`}
                  className={`${actionBtn} relative text-snow/60 bg-night-900/70 hover:bg-holly-600 hover:text-white`}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ))}
            {winners.length === 0 && <Empty text="No hay ganadores aún" />}
          </div>
        )}

        {activeTab === 'ELIMINATED' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {eliminated.slice(0, visibleCount).map(e => (
              <div key={`${e.id}-${+new Date(e.timestamp)}`} className="rounded-2xl border border-sky-300/20 bg-night-950/50 p-4 flex items-center justify-between gap-3 opacity-80 hover:opacity-100 transition-opacity">
                <div className="min-w-0">
                  <p className="font-display font-semibold text-snow/85 break-words">{e.name}</p>
                  {e.colonia && (
                    <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-snow/45 mb-2">
                      <MapPin className="w-3 h-3" /> {e.colonia}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-widest text-sky-200 border border-sky-300/30 rounded-md px-2 py-0.5 bg-sky-300/10">
                    <Snowflake className="w-3 h-3" /> ELIMINADO
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleReturnToWheel(e.id, 'ELIMINATED')}
                  disabled={locked}
                  title="Regresar a la ruleta"
                  aria-label={`Regresar a ${e.name} a la ruleta`}
                  className={`${actionBtn} text-snow/60 bg-night-900/70 hover:bg-holly-600 hover:text-white`}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ))}
            {eliminated.length === 0 && <Empty text="No hay eliminados" />}
          </div>
        )}

        {total > visibleCount && (
          <div ref={sentinelRef} className="h-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
});

const Empty = ({ text }: { text: string }) => (
  <p className="col-span-full text-center py-20 text-snow/35 font-bold uppercase tracking-widest text-xs">{text}</p>
);

export default Dashboard;
