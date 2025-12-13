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
}

// Cores dos post-its com variações
const COR_ESTILOS: Record<CorLembrete, {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  pin: string;
}> = {
  amarelo: {
    bg: 'bg-yellow-100',
    bgLight: 'bg-yellow-50',
    border: 'border-yellow-300',
    text: 'text-yellow-900',
    pin: 'bg-red-500'
  },
  rosa: {
    bg: 'bg-pink-100',
    bgLight: 'bg-pink-50',
    border: 'border-pink-300',
    text: 'text-pink-900',
    pin: 'bg-red-600'
  },
  azul: {
    bg: 'bg-blue-100',
    bgLight: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
    pin: 'bg-red-500'
  },
  verde: {
    bg: 'bg-green-100',
    bgLight: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-900',
    pin: 'bg-red-500'
  },
  laranja: {
    bg: 'bg-orange-100',
    bgLight: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-900',
    pin: 'bg-red-500'
  },
  roxo: {
    bg: 'bg-purple-100',
    bgLight: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-900',
    pin: 'bg-red-500'
  }
};

const LembreteCard: React.FC<LembreteCardProps> = ({
  lembrete,
  theme = 'dark',
  onView,
  onEdit,
  onDelete,
  onFinish
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const estilos = COR_ESTILOS[lembrete.cor];

  const dataHora = new Date(lembrete.dataHora);
  const expirado = lembrete.status === 'pendente' && dataHora < new Date();
  const finalizado = lembrete.status === 'finalizado';

  // Rotação aleatória mas consistente baseada no ID
  const rotacao = (lembrete.id.charCodeAt(0) % 7) - 3; // -3 a 3 graus

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: rotacao - 5 }}
      animate={{ opacity: 1, scale: 1, rotate: rotacao }}
      whileHover={{
        scale: 1.02,
        rotate: 0,
        zIndex: 10,
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.4)'
      }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`relative ${finalizado ? 'opacity-60' : ''}`}
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
          ${estilos.bg} ${estilos.border} ${estilos.text}
          border-2 rounded-lg p-3 pt-5 min-h-[140px]
          shadow-[4px_4px_10px_rgba(0,0,0,0.15)]
          relative overflow-hidden flex flex-col justify-between
          ${expirado ? 'ring-2 ring-red-500 ring-offset-2' : ''}
        `}
        style={{
          background: `linear-gradient(135deg, ${lembrete.cor === 'amarelo' ? '#fef9c3' :
            lembrete.cor === 'rosa' ? '#fce7f3' :
              lembrete.cor === 'azul' ? '#dbeafe' :
                lembrete.cor === 'verde' ? '#dcfce7' :
                  lembrete.cor === 'laranja' ? '#fed7aa' :
                    '#f3e8ff'
            } 0%, ${lembrete.cor === 'amarelo' ? '#fef08a' :
              lembrete.cor === 'rosa' ? '#fbcfe8' :
                lembrete.cor === 'azul' ? '#bfdbfe' :
                  lembrete.cor === 'verde' ? '#bbf7d0' :
                    lembrete.cor === 'laranja' ? '#fdba74' :
                      '#ddd6fe'
            } 100%)`
        }}
      >
        {/* Faixa de texto animada (ticker) no topo */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-black/10 overflow-hidden">
          <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="whitespace-nowrap text-[10px] font-medium opacity-60 py-0.5"
          >
            🔔 {lembrete.titulo} • {dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </motion.div>
        </div>

        {/* Badge de status */}
        {expirado && (
          <div className="absolute top-6 right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse z-10">
            EXPIRADO
          </div>
        )}
        {finalizado && (
          <div className="absolute top-6 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full z-10">
            ✓ CONCLUÍDO
          </div>
        )}

        {/* Conteúdo */}
        <div className="mt-4 mb-2">
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
        <div className="flex flex-col gap-2 mt-auto">
          {/* De: (se compartilhado) */}
          {lembrete.remetenteNome && (
            <div className="flex items-center gap-1 text-xs opacity-70">
              <User size={12} />
              <span>De: {lembrete.remetenteNome}</span>
            </div>
          )}

          {/* Data e hora */}
          <div className="flex items-center gap-1 text-xs opacity-70">
            <Clock size={12} />
            <span>
              {dataHora.toLocaleDateString('pt-BR')} às {dataHora.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Ações relativas (agora abaixo da data) */}
          <div className="flex gap-1 justify-end mt-1">
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

            {onEdit && !finalizado && (
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

            {onFinish && !finalizado && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onFinish}
                className="p-1.5 rounded-full bg-green-500/30 hover:bg-green-500/50 transition-colors"
                title="Marcar como concluído"
              >
                <CheckCircle size={14} />
              </motion.button>
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
          </div>
        </div>

        {/* Efeito de papel dobrado no canto */}
        <div
          className="absolute bottom-0 right-0 w-6 h-6 z-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)`,
          }}
        />
      </div>
    </motion.div>
  );
};

export default LembreteCard;
