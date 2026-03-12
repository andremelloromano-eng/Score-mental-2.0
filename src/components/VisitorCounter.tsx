import React, { useState, useEffect } from 'react';

const VisitorCounter = () => {
  const calculateCount = () => {
    const agora = new Date();
    const horas = agora.getHours();
    let minDesdeAsUma = (horas * 60 + agora.getMinutes()) - 60;
    if (minDesdeAsUma < 0) minDesdeAsUma = 0;
    return Math.floor(10 + (2490 * (minDesdeAsUma / (23 * 60))));
  };

  const [count, setCount] = useState(calculateCount());

  useEffect(() => {
    // Diminuí para 5 segundos para você conseguir ver a mudança mais rápido no teste
    const timer = setInterval(() => {
      setCount(prev => prev + 1);
    }, 5000); 
    return () => clearInterval(timer);
  }, []);

  const formatted = count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        {/* Adicionei 'letter-spacing' e 'w-fit' para garantir que nada empurre o número */}
        <div className="text-4xl md:text-5xl font-mono font-bold text-white tabular-nums tracking-widest text-center min-w-[200px] flex justify-center">
          {formatted}
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 border-t border-white/5 pt-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] text-blue-400/70 uppercase tracking-[0.3em]">
            Live Sync
          </span>
        </div>
      </div>
    </div>
  );
};

export default VisitorCounter;