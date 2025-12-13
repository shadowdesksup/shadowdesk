import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clock, X, AlarmClock } from 'lucide-react';
import { Lembrete } from '../types';
import { useNotifications } from '../hooks/useNotifications';

interface ReminderAlarmPopupProps {
  lembrete: Lembrete;
  onDismiss: () => void;
  onSnooze?: (minutos: number) => void;
}

const ReminderAlarmPopup: React.FC<ReminderAlarmPopupProps> = ({
  lembrete,
  onDismiss,
  onSnooze
}) => {
  const { tocarSom, pararSom, somTocando } = useNotifications('');

  // Tocar som ao montar
  useEffect(() => {
    tocarSom(lembrete.somNotificacao);

    // Repetir som a cada 5 segundos se ainda estiver aberto
    const interval = setInterval(() => {
      tocarSom(lembrete.somNotificacao);
    }, 5000);

    return () => {
      clearInterval(interval);
      pararSom();
    };
  }, [lembrete.somNotificacao, tocarSom, pararSom]);

  const handleDismiss = useCallback(() => {
    pararSom();
    onDismiss();
  }, [pararSom, onDismiss]);

  const handleSnooze = useCallback((minutos: number) => {
    pararSom();
    if (onSnooze) {
      onSnooze(minutos);
    }
    onDismiss();
  }, [pararSom, onSnooze, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Ondas de som animadas */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{
              scale: [0.5, 2.5],
              opacity: [0.3, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut'
            }}
            className="absolute w-64 h-64 rounded-full border-4 border-cyan-500"
          />
        ))}
      </div>

      {/* Card principal */}
      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{
          scale: 1,
          y: 0,
        }}
        transition={{ type: 'spring', damping: 15 }}
        className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-cyan-500/30"
      >
        {/* Container centralizado do Sino */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center justify-center">
          {/* Pulso atrás do sino */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute w-20 h-20 rounded-full bg-orange-500/30"
          />

          {/* Sino animado */}
          <motion.div
            animate={{
              rotate: somTocando ? [0, -15, 15, -15, 15, 0] : 0
            }}
            transition={{
              duration: 0.5,
              repeat: somTocando ? Infinity : 0,
              repeatDelay: 0.5
            }}
            className="relative z-10"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/50">
              <Bell size={32} className="text-white" />
            </div>
          </motion.div>
        </div>

        {/* Conteúdo */}
        <div className="text-center mt-8">
          {/* Título do lembrete */}
          <motion.h2
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-3xl font-bold text-white mb-4"
          >
            {lembrete.titulo}
          </motion.h2>

          {/* Descrição */}
          {lembrete.descricao && (
            <p className="text-slate-300 mb-4 line-clamp-3">
              {lembrete.descricao}
            </p>
          )}

          {/* Hora programada */}
          <div className="flex items-center justify-center gap-2 text-cyan-400 mb-6">
            <Clock size={18} />
            <span className="text-lg">
              Programado para {new Date(lembrete.dataHora).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Origem (se compartilhado) */}
          {lembrete.remetenteNome && (
            <p className="text-purple-400 text-sm mb-4">
              Enviado por: {lembrete.remetenteNome}
            </p>
          )}

          {/* Botões */}
          <div className="flex gap-4 mt-6">
            {/* Soneca */}
            {onSnooze && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSnooze(5)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                <AlarmClock size={20} />
                Soneca 5min
              </motion.button>
            )}

            {/* Dispensar */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDismiss}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/30"
            >
              Dispensar
            </motion.button>
          </div>
        </div>

        {/* Botão X para fechar */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X size={18} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ReminderAlarmPopup;
