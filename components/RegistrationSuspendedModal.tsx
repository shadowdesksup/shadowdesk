import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserX } from 'lucide-react';

interface RegistrationSuspendedModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const RegistrationSuspendedModal: React.FC<RegistrationSuspendedModalProps> = ({
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <UserX className="h-10 w-10 text-yellow-500" strokeWidth={1.5} />
          </div>

          <h2 className={`mb-2 text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
            Cadastros Suspensos
          </h2>

          <p className={`mb-8 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
            A criação de novas contas está temporariamente desativada para manutenção do sistema.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 py-3 text-sm font-bold text-white shadow-lg shadow-yellow-500/20 transition-all hover:shadow-yellow-500/40"
          >
            Voltar ao Login
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
