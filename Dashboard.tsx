import React, { memo } from 'react';
import { MapPin, X, Trophy, Trash2 } from 'lucide-react';
import { Participant, Winner, Eliminated } from './types';

interface DashboardProps {
  activeTab: 'PLAYERS' | 'WINNERS' | 'ELIMINATED';
  setActiveTab: (tab: 'PLAYERS' | 'WINNERS' | 'ELIMINATED') => void;
  participants: Participant[];
  winners: Winner[];
  eliminated: Eliminated[];
  handleRemoveParticipant: (id: string) => void;
  handleReturnToWheel: (id: string, from: 'WINNERS' | 'ELIMINATED') => void;
  playSound: (type: 'pop') => void;
}

const Dashboard = memo(({
  activeTab,
  setActiveTab,
  participants,
  winners,
  eliminated,
  handleRemoveParticipant,
  handleReturnToWheel,
  playSound
}: DashboardProps) => {
  // --- Virtualization / Infinite Scroll State ---
  const [visibleCount, setVisibleCount] = React.useState(30);
  const observerTarget = React.useRef(null);

  // Reset visible count when tab changes
  React.useEffect(() => {
    setVisibleCount(30);
  }, [activeTab]);

  // Infinite Scroll Observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 30, 
            activeTab === 'PLAYERS' ? participants.length : 
            activeTab === 'WINNERS' ? winners.length : 
            eliminated.length
          ));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [activeTab, participants.length, winners.length, eliminated.length]);

  const visibleParticipants = participants.slice(0, visibleCount);
  const visibleWinners = winners.slice(0, visibleCount);
  const visibleEliminated = eliminated.slice(0, visibleCount);

  return (
    <div className="flex-1 w-full space-y-6">
      <div className="flex p-1 bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md">
        {(['PLAYERS', 'WINNERS', 'ELIMINATED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { playSound('pop'); setActiveTab(tab); }}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' : 'text-gray-500 hover:text-gray-300'}
              }`}
          >
            {tab === 'PLAYERS' ? (
              <>
                JUGADORES
              </>
            ) : tab === 'WINNERS' ? 'GANADORES' : 'ELIMINADOS'}
          </button>
        ))}
      </div>

      <div className="bg-gray-900/40 rounded-3xl border border-gray-800 p-6 min-h-[400px] max-h-[800px] overflow-y-auto custom-scrollbar">
        {activeTab === 'PLAYERS' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Mostrando {Math.min(visibleCount, participants.length)} de {participants.length}
                </span>
             </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleParticipants.map((p) => (
                <div key={p.id} className="bg-gray-800/40 hover:bg-gray-800/60 transition-colors p-4 rounded-xl border border-gray-700/50 hover:border-pink-500/30 text-sm flex items-center justify-between gap-3 group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-500 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex flex-col overflow-hidden gap-1">
                    <span className="font-bold text-pink-400 truncate text-base leading-tight">{p.name}</span>
                    {p.colonia && (
                      <div className="flex items-center gap-1.5 text-gray-400 group-hover:text-gray-300 transition-colors">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="text-[11px] font-medium truncate uppercase tracking-wider">{p.colonia}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleRemoveParticipant(p.id)} className="text-gray-600 hover:text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {participants.length === 0 && <p className="col-span-full text-center py-20 text-gray-600 font-bold uppercase tracking-widest text-xs">No hay participantes</p>}
            </div>
            {/* Sentinel for IntersectionObserver */}
            {participants.length > visibleCount && (
               <div ref={observerTarget} className="h-10 w-full flex items-center justify-center">
                 <div className="w-6 h-6 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin"></div>
               </div>
            )}
          </div>
        )}

        {activeTab === 'WINNERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleWinners.map(w => (
              <div key={w.id} className="bg-rose-950/20 border border-pink-500/30 p-5 rounded-2xl flex justify-between items-center group relative overflow-hidden hover:bg-rose-900/30 transition-all">
                <div className="relative z-10">
                  <h4 className="text-xl font-black text-white leading-tight mb-1">{w.name}</h4>
                  {w.colonia && (
                    <div className="flex items-center gap-1.5 text-pink-200/60 mb-3">
                      <MapPin className="w-3 h-3" />
                      <p className="text-xs font-medium uppercase tracking-wider">{w.colonia}</p>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 bg-pink-500/10 px-3 py-1.5 rounded-lg border border-pink-500/20">
                    <Trophy className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-bold text-pink-300 uppercase tracking-widest">{w.prize}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 relative z-20">
                    <button onClick={() => handleReturnToWheel(w.id, 'WINNERS')} className="text-gray-500 hover:text-white bg-gray-900/50 hover:bg-pink-500 p-2 rounded-full transition-all" title="Regresar a la ruleta">
                        <X className="w-4 h-4" />
                    </button>
                    <Trophy className="w-24 h-24 text-yellow-400 rotate-[-15deg] opacity-10 pointer-events-none absolute top-4 right-[-10px]" />
                </div>
              </div>
            ))}
            {winners.length === 0 && <p className="col-span-full text-center py-20 text-gray-600 font-bold uppercase tracking-widest text-xs">No hay ganadores aún</p>}
            {winners.length > visibleCount && <div ref={observerTarget} className="h-10"></div>}
          </div>
        )}

        {activeTab === 'ELIMINATED' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleEliminated.map(e => (
              <div key={e.id} className="bg-rose-950/10 border border-rose-500/20 p-5 rounded-2xl flex justify-between items-center opacity-70 hover:opacity-100 transition-all group relative overflow-hidden hover:bg-rose-950/20">
                <div className="relative z-10">
                  <h4 className="text-lg font-bold text-gray-300 group-hover:text-white transition-colors">{e.name}</h4>
                  {e.colonia && (
                    <div className="flex items-center gap-1.5 text-gray-600 group-hover:text-rose-400/80 mb-2 transition-colors">
                      <MapPin className="w-3 h-3" />
                      <p className="text-xs font-medium uppercase tracking-wider">{e.colonia}</p>
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest border border-rose-500/30 px-2 py-1 rounded-md bg-rose-500/10">ELIMINADO</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleReturnToWheel(e.id, 'ELIMINATED')} className="text-gray-500 hover:text-white bg-gray-900/50 hover:bg-rose-500 p-2 rounded-full transition-all" title="Regresar a la ruleta">
                        <X className="w-4 h-4" />
                    </button>
                    <Trash2 className="w-6 h-6 text-rose-500/50 group-hover:text-rose-500 transition-colors pointer-events-none" />
                </div>
              </div>
            ))}
            {eliminated.length === 0 && <p className="col-span-full text-center py-20 text-gray-600 font-bold uppercase tracking-widest text-xs">No hay eliminados</p>}
             {eliminated.length > visibleCount && <div ref={observerTarget} className="h-10"></div>}
          </div>
        )}
      </div>
    </div>
  );
});

export default Dashboard;