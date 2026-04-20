import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VirtualPresenterProps {
  message: string | null;
}

export const VirtualPresenter: React.FC<VirtualPresenterProps> = ({ message }) => {
  const [displayedText, setDisplayedText] = useState("");

  // Efecto máquina de escribir
  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    if (!message) return;

    const timer = setInterval(() => {
      setDisplayedText(prev => prev + message.charAt(i));
      i++;
      if (i >= message.length) {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [message]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 max-w-sm w-[320px] z-[1000] flex items-end gap-3"
        >
          {/* Avatar Mágico */}
          <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 border-4 border-pink-200 shadow-xl overflow-hidden flex items-center justify-center animate-[bounce_3s_infinite]">
            <div className="text-3xl pb-1" style={{ textShadow: "0 2px 5px rgba(0,0,0,0.3)" }}>🎙️</div>
          </div>

          {/* Burbuja de Texto */}
          <div className="flex-1 bg-white text-gray-800 p-4 rounded-3xl rounded-br-none shadow-[0_10px_25px_rgba(244,63,94,0.4)] border-2 border-pink-200 relative">
            <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1 opacity-80">PRESENTADOR IA</h4>
            <p className="text-sm font-semibold leading-snug min-h-[50px] italic">
              "{displayedText}"
              <span className="animate-pulse inline-block w-1.5 h-4 bg-pink-500 ml-1 rounded"></span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VirtualPresenter;
