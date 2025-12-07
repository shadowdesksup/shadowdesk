import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimerOff, Lock } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark'
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop with Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-all"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border p-6 text-center shadow-2xl ${theme === 'dark'
              ? 'bg-slate-900 border-white/10 shadow-black/50'
              : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}
        >
          {/* Icon Badge */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
            <TimerOff className="h-10 w-10 text-red-500" strokeWidth={1.5} />
          </div>

          <h2 className={`mb-2 text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
            Sessão Expirada
          </h2>

          <p className={`mb-8 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
            Por motivos de segurança, sua conexão foi encerrada automaticamente. Por favor, faça login novamente.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/40"
          >
            Entrar Novamente
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
