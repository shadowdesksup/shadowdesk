import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, User, Bell, Calendar } from 'lucide-react';
import { Lembrete } from '../types';

interface LembreteViewModalProps {
  lembrete: Lembrete;
  theme?: 'dark' | 'light';
  onClose: () => void;
}

const LembreteViewModal: React.FC<LembreteViewModalProps> = ({
  lembrete,
  theme = 'dark',
  onClose
}) => {
  const dataHora = new Date(lembrete.dataHora);
  const dataCriacao = new Date(lembrete.criadoEm);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.8, opacity: 0, rotate: 2 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md relative"
      >
        {/* Efeito de espiral do caderno */}
        <div className="absolute -left-4 top-0 bottom-0 w-8 flex flex-col items-center justify-center z-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 mb-2 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 shadow-inner"
              style={{
                boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), inset -1px -1px 2px rgba(255,255,255,0.5)'
              }}
            />
          ))}
        </div>

        {/* Página do caderno */}
        <div
          className="relative ml-4 rounded-r-lg overflow-hidden shadow-2xl"
          style={{
            background: '#fffef5',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3), 4px 4px 0 rgba(0,0,0,0.1)'
          }}
        >
          {/* Margem vermelha */}
          <div
            className="absolute left-0 top-0 bottom-0 w-12"
            style={{
              borderRight: '2px solid #ef4444',
              background: 'linear-gradient(90deg, #fffef5 0%, #fffef5 80%, rgba(239,68,68,0.05) 100%)'
            }}
          />

          {/* Linhas do caderno como fundo */}
          <div
            className="absolute inset-0"
            style={{
              background: `repeating-linear-gradient(
                transparent,
                transparent 31px,
                #e0e0e0 31px,
                #e0e0e0 32px
              )`,
              backgroundPosition: '0 16px'
            }}
          />

          {/* Botão fechar */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg"
          >
            <X size={18} />
          </motion.button>

          {/* Conteúdo */}
          <div className="relative p-6 pl-16 min-h-[400px]" style={{ fontFamily: "'Caveat', cursive" }}>
            {/* Ícone de lembrete */}
            <div className="absolute top-4 left-14 opacity-10">
              <Bell size={100} className="text-cyan-600" />
            </div>

            {/* Data do lembrete */}
            <div className="text-right mb-4">
              <span
                className="text-sm text-gray-500"
                style={{ fontFamily: 'monospace' }}
              >
                {dataHora.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>

            {/* Título */}
            <h2
              className="text-3xl font-bold text-gray-800 mb-6 leading-tight"
              style={{
                fontFamily: "'Caveat', cursive",
                textDecoration: 'underline',
                textDecorationColor: '#06b6d4',
                textUnderlineOffset: '4px'
              }}
            >
              {lembrete.titulo}
            </h2>

            {/* Descrição */}
            <div
              className="text-xl text-gray-700 mb-6 leading-relaxed min-h-[100px]"
              style={{
                fontFamily: "'Caveat', cursive",
                lineHeight: '32px' // Mesmo que as linhas do caderno
              }}
            >
              {lembrete.descricao || (
                <span className="text-gray-400 italic">Sem descrição...</span>
              )}
            </div>

            {/* Área translúcida com informações */}
            <div
              className="mt-8 p-4 rounded-lg relative overflow-hidden"
              style={{
                background: 'rgba(6, 182, 212, 0.1)',
                backdropFilter: 'blur(4px)'
              }}
            >
              {/* Faixa de texto em loop animado */}
              <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 overflow-hidden">
                <motion.div
                  animate={{ x: ['100%', '-100%'] }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  className="whitespace-nowrap text-xs font-medium text-cyan-700 py-1"
                  style={{ fontFamily: 'system-ui' }}
                >
                  🔔 {lembrete.titulo} • {dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </motion.div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600" style={{ fontFamily: 'system-ui' }}>
                {/* Hora do lembrete */}
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-cyan-600" />
                  <span className="font-medium">Horário:</span>
                  <span>{dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Criado por */}
                <div className="flex items-center gap-2">
                  <User size={16} className="text-cyan-600" />
                  <span className="font-medium">Criado por:</span>
                  <span>{lembrete.criadoPorNome || 'Você'}</span>
                </div>

                {/* De (se compartilhado) */}
                {lembrete.remetenteNome && (
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-purple-600" />
                    <span className="font-medium">Enviado por:</span>
                    <span>{lembrete.remetenteNome}</span>
                  </div>
                )}

                {/* Data de criação */}
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-cyan-600" />
                  <span className="font-medium">Criado em:</span>
                  <span>{dataCriacao.toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mt-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${lembrete.status === 'pendente'
                    ? 'bg-yellow-100 text-yellow-700'
                    : lembrete.status === 'disparado'
                      ? 'bg-orange-100 text-orange-700'
                      : lembrete.status === 'finalizado'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                    {lembrete.status === 'pendente' && '⏳ Pendente'}
                    {lembrete.status === 'disparado' && '🔔 Disparado'}
                    {lembrete.status === 'finalizado' && '✅ Finalizado'}
                    {lembrete.status === 'expirado' && '❌ Expirado'}
                  </div>
                </div>
              </div>
            </div>

            {/* Assinatura no final */}
            <div
              className="mt-8 text-right text-gray-400"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              ~ ShadowDesk Lembretes ~
            </div>
          </div>

          {/* Efeito de canto dobrado */}
          <div
            className="absolute bottom-0 right-0 w-12 h-12"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%)',
            }}
          />
        </div>
      </motion.div>

      {/* Carregar fonte Caveat (manuscrita) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
      `}</style>
    </motion.div>
  );
};

export default LembreteViewModal;
