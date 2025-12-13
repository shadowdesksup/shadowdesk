import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lembrete } from '../types';
import { Clock, Calendar, Pin, X, Eye } from 'lucide-react';

interface DashboardRemindersProps {
  lembretes: Lembrete[];
  theme: 'dark' | 'light';
  onVerTodos?: () => void;
  onDelete?: (id: string) => void;
  onView?: (lembrete: Lembrete) => void; // Added onView prop
  deletingId?: string | null;
}

const DashboardReminders: React.FC<DashboardRemindersProps> = ({ lembretes, theme, onVerTodos, onDelete, onView, deletingId }) => {
  // Filtrar apenas lembretes futuros e pendentes, limitar a 6 para permitir quebra de linha
  const agora = new Date();
  const lembretesFuturos = lembretes
    .filter(l => l.status === 'pendente' && new Date(l.dataHora) > agora)
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
    .slice(0, 6);

  // Estado local para controle do botão de deletar (1º passo)
  const [activeDeleteId, setActiveDeleteId] = React.useState<string | null>(null);

  // Auto-cancelar a ação do X após 3 segundos
  React.useEffect(() => {
    if (activeDeleteId) {
      const timer = setTimeout(() => {
        setActiveDeleteId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeDeleteId]);

  // Fechar ao clicar fora (global click listener)
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (activeDeleteId) {
        setActiveDeleteId(null);
      }
    };

    // Adicionar listener apenas se houver algo ativo
    if (activeDeleteId) {
      // Usar setTimeout para evitar que o clique que abriu o modal (se propagar) feche-o imediatamente
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDeleteId]);

  const handlePinClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evita navegação do card
    // Toggle do modo de exclusão para este item
    setActiveDeleteId(current => current === id ? null : id);
  };

  const handleDeleteConfirm = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete?.(id); // Dispara o modal no App.tsx
    setActiveDeleteId(null); // Fecha o overlay
  };

  const handleViewClick = (e: React.MouseEvent, lembrete: Lembrete) => {
    e.stopPropagation();
    onView?.(lembrete);
  };

  return (
    <div className={`h-full flex flex-col rounded-2xl border p-6 overflow-hidden ${theme === 'dark'
      ? 'bg-slate-900/50 border-white/10'
      : 'bg-white border-slate-200 shadow-sm'
      }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>
          <Pin className="text-cyan-500" size={24} />
          Lembretes Agendados
        </h3>
        {onVerTodos && (
          <button
            onClick={onVerTodos}
            className={`text-sm font-medium hover:underline ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
              }`}
          >
            Ver todos
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pt-4 p-1">
        {lembretesFuturos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-4">
            <div className="relative">
              <Calendar size={64} strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">0</div>
            </div>
            <p>Nenhum lembrete agendado</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {lembretesFuturos.map((lembrete, index) => (
              <motion.div
                key={lembrete.id}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
                whileHover={{ scale: 1.02, rotate: 1, zIndex: 10 }}
                className="aspect-square relative group cursor-pointer"
                onClick={(e) => {
                  // Default action could be view, but user asked for icon click specifically? 
                  // "o icone de visualizar abre..." implying the icon is the trigger.
                  // But usually clicking the card views it too. I'll bind the icon for now as requested.
                  // Actually, let's make the card click view it too if not deleting? 
                  // User said: "ao passar o cursor... exibe icon... que visualizar ao clicar".
                  // I will replicate the behavior: Icon click triggers view.
                }}
              >
                {/* Visual Overlay Interativo ("X" Bonito) */}
                <AnimatePresence>
                  {(activeDeleteId === lembrete.id) && (
                    <motion.div
                      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                      animate={{ opacity: 1, backdropFilter: "blur(1px)" }} // Blur reduzido
                      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                      className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/20 rounded-xl" // Opacidade reduzida
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDeleteId(null); // Clique fora (no overlay) cancela
                      }}
                    >
                      <motion.button
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.6)] border-2 border-white/20 hover:bg-red-600 transition-colors group/x-btn"
                        onClick={(e) => handleDeleteConfirm(e, lembrete.id)}
                        title="Confirmar Exclusão"
                      >
                        <X size={28} className="text-white stroke-[3px]" />
                      </motion.button>

                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Alfinete 3D - Ativa o Overlay */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 cursor-pointer group/pin"
                  onClick={(e) => handlePinClick(e, lembrete.id)}
                >
                  <div className="relative transform scale-75 origin-top transition-all duration-300 group-hover/pin:scale-90 group-hover/pin:brightness-110 group-hover/pin:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] active:scale-95">
                    {/* Sombra do alfinete */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/20 rounded-full blur-sm" />

                    {/* Cabeça do alfinete */}
                    <div className={`w-6 h-6 ${activeDeleteId === lembrete.id ? 'bg-red-600' : 'bg-red-500'} rounded-full shadow-lg relative transition-colors duration-300`}>
                      <div className="absolute inset-1 bg-white/30 rounded-full" />
                      <div className="absolute top-0.5 left-1 w-2 h-2 bg-white/50 rounded-full" />
                    </div>

                    {/* Ponta do alfinete */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-400" />

                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow w-max whitespace-nowrap font-bold transition-all duration-200 pointer-events-none opacity-0 translate-y-2 group-hover/pin:opacity-100 group-hover/pin:translate-y-0">
                      Excluir
                    </div>
                  </div>
                </div>

                {/* Card Body - Square Note Style */}
                <div
                  className="w-full h-full p-3 flex flex-col justify-between relative shadow-lg transition-shadow duration-300 hover:shadow-xl overflow-hidden rounded-xl"
                  style={{
                    background: 'linear-gradient(to bottom, rgb(17, 153, 220), rgb(12, 110, 160))', // Gradient
                    color: 'white',
                    fontFamily: "'Caveat', cursive",
                  }}
                >
                  {/* Top Shine/Fold Effect */}
                  <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>

                  {/* Content */}
                  <div className="mt-1 w-full">
                    <h4
                      className="font-bold text-lg leading-tight mb-1 truncate text-center w-full"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                      title={lembrete.titulo}
                    >
                      {lembrete.titulo}
                    </h4>

                    {/* Descrição simulando anotação */}
                    {lembrete.descricao && (
                      <div
                        className="text-sm leading-5 text-blue-950 font-bold overflow-hidden relative w-full break-words text-justify"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(transparent, transparent 18px, rgba(0,0,0,0.15) 20px)',
                          backgroundPosition: '0 3px',
                          backgroundSize: '100% 20px',
                          height: '60px', // 3 linhas exatas
                          textShadow: 'none'
                        }}
                      >
                        <span className="line-clamp-3 block">
                          {lembrete.descricao}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View Icon on Hover */}
                  <div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer hover:scale-110 active:scale-95"
                    onClick={(e) => handleViewClick(e, lembrete)}
                  >
                    <div className="bg-white/90 text-cyan-600 p-2 rounded-full shadow-lg backdrop-blur-sm border border-cyan-100">
                      <Eye size={20} />
                    </div>
                  </div>

                  {/* Date Footer */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-center gap-2 opacity-90 font-sans text-[10px] bg-black/20 p-1.5 backdrop-blur-sm rounded w-full text-center">
                      <div className="flex items-center gap-1">
                        <Calendar size={10} className="shrink-0" />
                        <span className="font-bold">
                          {new Date(lembrete.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                      <span className="w-px h-2.5 bg-white/40"></span>
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="shrink-0" />
                        <span className="font-bold">
                          {new Date(lembrete.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Right Page Curl Simulation */}
                  <div
                    className="absolute bottom-0 right-0 w-6 h-6 bg-black/10"
                    style={{
                      background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 53%, transparent 55%)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardReminders;
