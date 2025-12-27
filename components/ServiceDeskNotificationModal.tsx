import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ServiceDeskNotificationModalProps {
  theme?: 'dark' | 'light';
  onClose: () => void;
  onSave: (telefone: string, enabled: boolean) => Promise<void>;
  initialPhone?: string;
  initialEnabled?: boolean;
}

const ServiceDeskNotificationModal: React.FC<ServiceDeskNotificationModalProps> = ({
  theme = 'dark',
  onClose,
  onSave,
  initialPhone = '',
  initialEnabled = false
}) => {
  const [telefone, setTelefone] = useState(initialPhone);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [manterNumeroSalvo, setManterNumeroSalvo] = useState(() => {
    return localStorage.getItem('whatsapp_manter_numero') !== 'false';
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Auto-save phone number locally (just like LembreteModal pattern)
  useEffect(() => {
    if (manterNumeroSalvo) {
      if (telefone) {
        localStorage.setItem('last_whatsapp_number', telefone);
      } else {
        localStorage.removeItem('last_whatsapp_number');
      }
    }
  }, [telefone, manterNumeroSalvo]);

  const handleSalvar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      if (enabled && !telefone.trim()) {
        throw new Error('Por favor, informe um número de WhatsApp.');
      }
      await onSave(enabled ? telefone.trim() : '', enabled);
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar preferências');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm will-change-transform"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl border overflow-hidden flex flex-col relative ${theme === 'dark' ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-2xl'
            }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <div className="p-1.5 rounded-lg bg-[#25D366]/20">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              Notificações WhatsApp
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className={`p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            >
              <X size={18} className={theme === 'dark' ? 'text-white' : 'text-slate-600'} />
            </motion.button>
          </div>

          <div className="p-6 space-y-6">
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Receba avisos no seu WhatsApp sempre que um <strong>novo chamado</strong> for identificado no ServiceDesk.
            </p>

            {/* Toggle Card */}
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Ativar Notificações</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Será enviado para o número abaixo</p>
                </div>
                <div
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${enabled
                    ? 'bg-[#25D366]'
                    : (theme === 'dark' ? 'bg-white/10' : 'bg-slate-200')
                    }`}
                  onClick={() => setEnabled(!enabled)}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ x: enabled ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>

              {/* Phone Input */}
              <AnimatePresence>
                {enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#25D366]">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
                        placeholder="14999077324"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all ${theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:bg-[#25D366]/10 focus:border-[#25D366]/50'
                          : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-[#25D366]'
                          } focus:outline-none focus:ring-0`}
                      />
                    </div>
                    {/* Checkbox p/ Lembrar Número */}
                    <div className="mt-3 flex items-center gap-2 px-1">
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${manterNumeroSalvo
                          ? 'bg-[#25D366] border-[#25D366]'
                          : (theme === 'dark' ? 'border-slate-600 bg-white/5' : 'border-slate-300 bg-white')
                          }`}
                        onClick={() => {
                          const newValue = !manterNumeroSalvo;
                          setManterNumeroSalvo(newValue);
                          localStorage.setItem('whatsapp_manter_numero', String(newValue));
                          if (!newValue) {
                            setTelefone(''); // Clear if unchecked
                            localStorage.removeItem('last_whatsapp_number');
                          }
                        }}
                      >
                        {manterNumeroSalvo && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <label
                        className={`text-sm cursor-pointer ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
                        onClick={() => {
                          const newValue = !manterNumeroSalvo;
                          setManterNumeroSalvo(newValue);
                          localStorage.setItem('whatsapp_manter_numero', String(newValue));
                          if (!newValue) {
                            setTelefone('');
                            localStorage.removeItem('last_whatsapp_number');
                          }
                        }}
                      >
                        Lembrar este número
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {erro && <p className="text-red-400 text-sm">{erro}</p>}
          </div>

          <div className={`flex gap-3 p-4 border-t shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`py-2 px-4 rounded-lg font-medium text-sm ${theme === 'dark'
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                } transition-colors`}
            >
              Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/30 disabled:opacity-50 transition-all"
            >
              {salvando ? 'Salvando...' : 'Salvar Preferência'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ServiceDeskNotificationModal;
