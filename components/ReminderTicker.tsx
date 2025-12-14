import React from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronRight } from 'lucide-react';
import { Lembrete } from '../types';

interface ReminderTickerProps {
  lembrete: Lembrete;
  theme?: 'dark' | 'light';
  onClick?: () => void;
}

const ReminderTicker: React.FC<ReminderTickerProps> = ({
  lembrete,
  theme = 'dark',
  onClick
}) => {
  const dataHora = new Date(lembrete.dataHora);
  const horaFormatada = dataHora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const dataFormatada = dataHora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long'
  });

  // Calcular tempo restante
  const agora = new Date();
  const diffMs = dataHora.getTime() - agora.getTime();
  const diffMinutos = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);

  let tempoRestante = '';
  if (diffMinutos < 60) {
    tempoRestante = `em ${diffMinutos}min`;
  } else if (diffHoras < 24) {
    tempoRestante = `em ${diffHoras}h`;
  } else {
    tempoRestante = `em ${Math.floor(diffHoras / 24)}d`;
  }

  const texto = `🔔 ${lembrete.titulo} • ${dataFormatada} às ${horaFormatada} (${tempoRestante})`;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-full px-6 py-2 w-full max-w-2xl cursor-pointer group transition-all ${theme === 'dark'
        ? 'bg-slate-900/40 hover:bg-slate-900/60 border border-white/10 hover:border-white/20'
        : 'bg-white/60 hover:bg-white/80 border border-slate-200 hover:border-slate-300 shadow-sm'
        }`}
      style={{
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Máscara de fade nas pontas */}
      <div
        className="absolute inset-0 pointer-events-none z-10 rounded-full"
        style={{
          background: `linear-gradient(to right, 
            ${theme === 'dark' ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)'} 0%, 
            transparent 10%, 
            transparent 90%, 
            ${theme === 'dark' ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.8)'} 100%
          )`
        }}
      />

      {/* Faixa de texto scrollando */}
      <div className="flex items-center gap-3 overflow-hidden">
        {/* Ícone de sino pulsante (Fixo à esquerda, fora do scroll) */}
        <div className="flex items-center gap-2 z-20 pl-2 pr-4 border-r border-white/10 flex-shrink-0">
          <motion.div
            animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Bell size={16} className="text-cyan-500" />
          </motion.div>
          <span className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
            Próximo
          </span>
        </div>

        {/* Texto animado */}
        <div className="overflow-hidden whitespace-nowrap flex-1 relative mask-fade-edges">
          <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="inline-block"
          >
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
              {texto}
            </span>
          </motion.div>
        </div>

        {/* Seta indicando clicável (Fixo à direita) */}
        <motion.div
          className="flex-shrink-0 z-20 pl-4 border-l border-white/10 opacity-50 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={16} className={theme === 'dark' ? 'text-white' : 'text-slate-600'} />
        </motion.div>
      </div>
    </motion.button>
  );
};

export default ReminderTicker;
