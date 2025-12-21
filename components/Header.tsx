import React from 'react';
import { LogOut, Sun, Moon, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

import { useSessionTimer } from '../hooks/useSessionTimer';
import NotificationBell from './NotificationBell';

import { Lembrete } from '../types';

interface HeaderProps {
  nomeUsuario: string;
  userId?: string;
  onLogout: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onToggleSidebar?: () => void;
  proximoLembrete?: Lembrete | null;
  onLembreteClick?: (context?: any) => void;
}

const Header: React.FC<HeaderProps> = ({
  nomeUsuario,
  userId,
  onLogout,
  theme = 'dark',
  onToggleTheme,
  onToggleSidebar,
  proximoLembrete,
  onLembreteClick
}) => {
  // Timer local apenas para visualização
  const { timeLeft } = useSessionTimer(true, userId, true);

  return (
    // ... same return
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`flex items-center justify-between border-b px-8 py-4 backdrop-blur-md z-20 transition-all duration-300 ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80 shadow-sm'
        }`}
    >
      <div className={`flex items-center gap-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
        {/* Mobile Menu Button - Shows only on mobile */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`md:hidden p-2 rounded-lg transition-colors ${theme === 'dark'
              ? 'hover:bg-white/10 text-slate-400 hover:text-white'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        )}
        <div className="p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-white/10 shadow-lg hidden md:block">
          <img src="/shadow-logo-final.png" alt="ShadowDesk Logo" className="w-6 h-6 object-contain" />
        </div>
        <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>ShadowDesk</h2>


      </div>

      <div className="flex items-center gap-4">
        {/* Session Timer */}
        {timeLeft && (
          <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold mr-2 ${theme === 'dark'
            ? 'bg-slate-800 border-slate-700 shadow-[0_0_10px_-3px_rgba(254,85,85,0.2)]'
            : 'bg-white border-slate-200 shadow-sm'
            }`}
            style={{ color: 'hsl(0, 99%, 67%)' }}
          >
            {timeLeft}
          </div>
        )}

        {/* Notification Bell */}
        {userId && (
          <NotificationBell
            userId={userId}
            theme={theme}
            onNotificacaoClick={(notificacao, action) => {
              if (onLembreteClick) {
                // Determinar contexto baseado no tipo e ação
                let context: any = null;

                // Se ação for visualizar (botão olho), abrir modal
                if (action === 'view') {
                  context = {
                    modal: 'view',
                    lembreteId: notificacao.lembreteId,
                    tab: 'meus' // Assumir tab meus para carregar
                  };
                } else {
                  // Navegação padrão (clique no corpo)
                  if (['lembrete_disparado', 'lembrete_recebido', 'lembrete_aceito', 'lembrete_recusado'].includes(notificacao.tipo)) {
                    if (notificacao.tipo === 'lembrete_recebido') {
                      context = { tab: 'recebidos' };
                    } else if (notificacao.tipo === 'lembrete_aceito' || notificacao.tipo === 'lembrete_recusado') {
                      context = { tab: 'meus' };
                    } else if (notificacao.tipo === 'lembrete_disparado') {
                      // Correção solicitada: Ir para dia selecionado (implícito em 'meus' com data selecionada se tivermos data, mas aqui vamos focar no ID)
                      // O componente LembretesPage vai usar highlightId para achar a data
                      context = {
                        tab: 'meus',
                        highlightId: notificacao.lembreteId
                      };
                    }
                  } else if (notificacao.tipo === 'solicitacao_amizade') {
                    context = { modal: 'friends', friendTab: 'requests' };
                  }
                }

                onLembreteClick(context);
              }
            }}
          />
        )}

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border transition-all duration-300 ${theme === 'dark'
              ? 'border-white/10 bg-white/5 text-yellow-400 hover:bg-yellow-400/10'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            title={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: theme === 'dark' ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </motion.div>
          </motion.button>
        )}

        <div className={`flex items-center gap-3 pl-4 border-l ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
          }`}>
          <div className="text-right">
            <p className={`text-sm font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>{nomeUsuario}</p>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>Suporte Técnico</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 to-blue-600"
          >
            <div className="size-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {nomeUsuario.charAt(0).toUpperCase()}
              </span>
            </div>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(239,68,68,0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogout}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${theme === 'dark'
            ? 'border-white/10 bg-transparent text-slate-400 hover:text-red-400 hover:border-red-500/30'
            : 'border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm'
            }`}
          title="Sair"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sair</span>
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;