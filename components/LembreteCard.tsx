import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  User,
  Pin
} from 'lucide-react';
import { Lembrete, CorLembrete } from '../types';

interface LembreteCardProps {
  lembrete: Lembrete;
  theme?: 'dark' | 'light';
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onFinish?: () => void;
  readonly?: boolean;
  onLongPress?: () => void;
  onSelect?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
}

import { COR_ESTILOS } from '../utils/reminderStyles';

const LembreteCard: React.FC<LembreteCardProps> = ({
  lembrete,
  theme = 'dark',
  onView,
  onEdit,
  onDelete,
  onFinish,
  readonly = false,
  onLongPress,
  onSelect,
  selected = false,
  selectionMode = false
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const estilos = COR_ESTILOS[lembrete.cor] || COR_ESTILOS['rose'];
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const ignoreNextClick = React.useRef(false);

  const dataHora = new Date(lembrete.dataHora);
  const expirado = lembrete.status === 'pendente' && dataHora < new Date();
  const finalizado = lembrete.status === 'finalizado';
  const disparado = lembrete.status === 'disparado';

  // Rotação aleatória mas consistente baseada no ID
  const rotacao = (lembrete.id.charCodeAt(0) % 7) - 3; // -3 a 3 graus

  const handlePointerDown = () => {
    if (!selectionMode && onLongPress) {
      longPressTimer.current = setTimeout(() => {
        ignoreNextClick.current = true;
        onLongPress();
      }, 500); // 500ms para considerar long press
    }
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false;
      e.stopPropagation();
      return;
    }

    if (selectionMode && onSelect) {
      e.stopPropagation();
      onSelect();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: rotacao - 5 }}
      animate={{
        opacity: 1,
        scale: selected ? 0.95 : 1,
        rotate: selected ? 0 : rotacao
      }}
      whileHover={!selectionMode ? {
        scale: 1.02,
        rotate: 0,
        zIndex: 10,
      } : {}}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      className={`
        relative rounded-xl
        ${finalizado ? 'opacity-60' : ''} 
      `}
      style={{ transformOrigin: 'top center' }}
    >
      {/* Alfinete 3D */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="relative">
          {/* Sombra do alfinete */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/20 rounded-full blur-sm" />

          {/* Cabeça do alfinete */}
          <div className={`w-6 h-6 ${estilos.pin} rounded-full shadow-lg relative`}>
            <div className="absolute inset-1 bg-white/30 rounded-full" />
            <div className="absolute top-0.5 left-1 w-2 h-2 bg-white/50 rounded-full" />
          </div>

          {/* Ponta do alfinete */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[8px] border-l-transparent border-r-transparent border-t-gray-400" />
        </div>
      </div>

      {/* Card principal (Post-it) */}
      <div
        className={`
          ${estilos.bg} ${estilos.border} ${estilos.text} border-2 rounded-lg p-3 pt-5 min-h-[140px] relative flex flex-col justify-between 
          ${expirado ? 'ring-2 ring-red-500 ring-offset-2' : ''}
          ${selected ? 'ring-2 ring-[rgb(34,211,238)] ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-[0_0_15px_rgba(34,211,238,0.6)]' : ''}
        `}
        style={{
          background: `linear-gradient(135deg, ${estilos.gradientStart} 0%, ${estilos.gradientEnd} 100%)`,
          fontFamily: "'Caveat', cursive",
          boxShadow: disparado
            ? '0 0 20px rgba(251,146,60,0.6)'
            : expirado
              ? '0 0 20px rgba(239,68,68,0.6)'
              : '2px 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        {/* Indicador de Seleção (Badge discreto) - Moved Inside */}
        {selected && (
          <div className="absolute top-2 right-2 bg-[rgb(34,211,238)] text-white p-1 rounded-full shadow-md z-50 animate-in zoom-in duration-200">
            <CheckCircle size={14} fill="currentColor" className="text-white" />
          </div>
        )}

        {/* Efeito Radar Pulsante para Expirados - Moved Inside */}
        {expirado && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-visible">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.95, opacity: 0.5 }}
                animate={{
                  scale: [0.95, 1.2],
                  opacity: [0.4, 0]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                  delay: i * 0.5,
                  ease: 'easeOut'
                }}
                className="absolute inset-0 rounded-xl border-2 border-red-500"
              />
            ))}
          </div>
        )}

        {/* Faixa de texto animada (ticker) no topo */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-black/10 overflow-hidden rounded-t-md">
          <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="whitespace-nowrap text-xs font-sans opacity-70 py-0.5"
          >
            {lembrete.titulo} • {dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </motion.div>
        </div>

        {/* Badge de status */}
        {expirado && !selected && (
          <div className="absolute top-6 right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold font-sans rounded-full animate-pulse z-10 transition-shadow shadow-sm">
            EXPIRADO
          </div>
        )}
        {finalizado && (
          <div className="absolute top-6 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold font-sans rounded-full animate-pulse z-10 transition-shadow shadow-sm">
            ✓ CONCLUÍDO
          </div>
        )}
        {disparado && (
          <div className="absolute top-6 right-2 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold font-sans rounded-full animate-pulse z-10 transition-shadow shadow-sm">
            DISPARADO
          </div>
        )}

        {/* Conteúdo */}
        <div className="mt-4 mb-2 relative z-10">
          <h3
            className="text-2xl font-bold leading-none truncate mb-1"
            title={lembrete.titulo}
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            {lembrete.titulo}
          </h3>

          <p
            className="text-lg opacity-85 line-clamp-2 leading-tight break-words"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            {lembrete.descricao || 'Sem descrição'}
          </p>
        </div>

        {/* Rodapé: Info e Ações */}
        <div className="flex flex-col gap-2 mt-auto relative z-10">
          {/* De: (se compartilhado) */}
          {lembrete.remetenteNome && (
            <div className="flex items-center gap-1 text-xs opacity-70">
              <User size={12} />
              <span>De: {lembrete.remetenteNome}</span>
            </div>
          )}

          {/* Data e hora */}
          <div className="flex items-center gap-1.5 text-sm font-sans text-gray-800/90 mt-1">
            <Clock size={14} />
            <span>
              {dataHora.toLocaleDateString('pt-BR')} às {dataHora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Ações relativas (agora abaixo da data) */}
          <div className="flex gap-1 justify-end mt-1">
            {!selectionMode && (
              <>
                {onView && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onView}
                    className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={14} />
                  </motion.button>
                )}

                {onEdit && !finalizado && !readonly && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onEdit}
                    className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                    title="Editar"
                  >
                    <Edit3 size={14} />
                  </motion.button>
                )}

                {onFinish && !finalizado && !readonly && (
                  <div className="relative">
                    {/* Radar Pulse Rings for the button */}
                    {(disparado || expirado) && [1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0.6 }}
                        animate={{ scale: [0.8, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, delay: i * 0.3, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full border-2 border-green-500"
                      />
                    ))}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      animate={(disparado || expirado) ? { opacity: [1, 0.4, 1] } : {}}
                      transition={(disparado || expirado) ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
                      onClick={onFinish}
                      className={`relative p-1.5 rounded-full transition-colors ${(disparado || expirado)
                        ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                        : 'bg-green-500/30 hover:bg-green-500/50'
                        }`}
                      title="Marcar como concluído"
                    >
                      <CheckCircle size={14} />
                    </motion.button>
                  </div>
                )}

                {onDelete && (
                  confirmDelete ? (
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                          setConfirmDelete(false);
                        }}
                        className="p-1.5 rounded-full bg-red-500 text-white"
                        title="Confirmar exclusão"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(false);
                        }}
                        className="p-1.5 rounded-full bg-black/20"
                        title="Cancelar"
                      >
                        ✕
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                      }}
                      className="p-1.5 rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Efeito de papel dobrado no canto */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 z-0 pointer-events-none rounded-br-md"
          style={{
            background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)`,
          }}
        />
      </div>
    </motion.div >
  );
};

export default LembreteCard;
