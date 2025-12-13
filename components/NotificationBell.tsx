import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, CheckCheck, Trash2, Clock } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Notificacao } from '../types';

interface NotificationBellProps {
  userId: string;
  theme?: 'dark' | 'light';
  onNotificacaoClick?: (notificacao: Notificacao) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  userId,
  theme = 'dark',
  onNotificacaoClick
}) => {
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotifications(userId);
  const [aberto, setAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ícone baseado no tipo de notificação
  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'lembrete_disparado':
        return '🔔';
      case 'lembrete_recebido':
        return '📩';
      case 'lembrete_aceito':
        return '✅';
      case 'lembrete_recusado':
        return '❌';
      default:
        return '📌';
    }
  };

  // Tempo relativo
  const tempoRelativo = (data: string) => {
    const agora = new Date();
    const dataNotificacao = new Date(data);
    const diff = agora.getTime() - dataNotificacao.getTime();

    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Agora';
    if (minutos < 60) return `${minutos}min`;
    if (horas < 24) return `${horas}h`;
    return `${dias}d`;
  };

  const handleNotificacaoClick = async (notificacao: Notificacao) => {
    if (!notificacao.lida) {
      await marcarLida(notificacao.id);
    }
    if (onNotificacaoClick) {
      onNotificacaoClick(notificacao);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sino */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAberto(!aberto)}
        className={`relative p-2 rounded-xl border transition-all ${theme === 'dark'
            ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm'
          }`}
      >
        {/* Sino com animação quando há não lidas */}
        <motion.div
          animate={naoLidas > 0 ? {
            rotate: [0, -10, 10, -10, 10, 0]
          } : {}}
          transition={{
            duration: 0.5,
            repeat: naoLidas > 0 ? Infinity : 0,
            repeatDelay: 3
          }}
        >
          <Bell size={20} />
        </motion.div>

        {/* Badge de contagem */}
        {naoLidas > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {naoLidas > 99 ? '99+' : naoLidas}
            </motion.span>
          </motion.div>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-2 w-80 rounded-xl border overflow-hidden z-50 ${theme === 'dark'
                ? 'bg-slate-900 border-white/10 shadow-2xl'
                : 'bg-white border-slate-200 shadow-xl'
              }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
              }`}>
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                Notificações
              </h3>
              {naoLidas > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => marcarTodasLidas()}
                  className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg ${theme === 'dark'
                      ? 'text-cyan-400 hover:bg-cyan-500/20'
                      : 'text-cyan-600 hover:bg-cyan-50'
                    }`}
                >
                  <CheckCheck size={14} />
                  Marcar todas
                </motion.button>
              )}
            </div>

            {/* Lista de notificações */}
            <div className="max-h-96 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className={`p-8 text-center ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notificacoes.slice(0, 10).map((notificacao) => (
                  <motion.button
                    key={notificacao.id}
                    whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    onClick={() => handleNotificacaoClick(notificacao)}
                    className={`w-full p-4 text-left flex gap-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'
                      } ${!notificacao.lida ?
                        theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-50'
                        : ''
                      }`}
                  >
                    {/* Ícone */}
                    <div className="text-2xl flex-shrink-0">
                      {getIcone(notificacao.tipo)}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                          }`}>
                          {notificacao.titulo}
                        </p>
                        {!notificacao.lida && (
                          <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs mt-1 line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        {notificacao.mensagem}
                      </p>
                      <p className={`text-xs mt-1 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                        <Clock size={10} />
                        {tempoRelativo(notificacao.criadoEm)}
                      </p>
                    </div>
                  </motion.button>
                ))
              )}
            </div>

            {/* Footer */}
            {notificacoes.length > 10 && (
              <div className={`p-3 text-center border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                }`}>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                  Mostrando 10 de {notificacoes.length} notificações
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
