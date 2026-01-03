import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, User, Phone, Wrench, ChevronRight, Building2, FileText } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

interface DashboardTicketsTickerProps {
  theme?: 'dark' | 'light';
  userName?: string;
  onTicketClick?: (ticketNumber: string) => void;
}

interface TicketData {
  id: string;
  numero: string;
  solicitante: string;
  local: string;
  servico?: string;
  tipo_servico?: string;
  descricao?: string;
  descricao_completa?: string;
  status: string;
  sala?: string;
  ramal?: string;
  celular?: string;
  email?: string;
  hiddenFor?: string[];
}

const DashboardTicketsTicker: React.FC<DashboardTicketsTickerProps> = ({
  theme = 'dark',
  userName = '',
  onTicketClick
}) => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'serviceDesk_tickets'),
      orderBy('numero', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TicketData[];

      const visibleDocs = docs
        .filter(t => !t.hiddenFor?.includes(userName))
        .slice(0, 3);

      setTickets(visibleDocs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userName]);

  useEffect(() => {
    if (tickets.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % tickets.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [tickets.length]);

  const currentTicket = tickets[currentIndex];

  if (loading) {
    return (
      <div className={`mt-5 rounded-2xl overflow-hidden border ${theme === 'dark'
        ? 'bg-slate-900/60 border-white/10'
        : 'bg-white border-slate-200'
        }`}>
        <div className={`flex items-center justify-between px-5 py-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-700/50 animate-pulse" />
            <div className="space-y-2">
              <div className="w-24 h-4 bg-slate-700/50 rounded animate-pulse" />
              <div className="w-16 h-3 bg-slate-700/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700/50 animate-pulse" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-slate-700/50 rounded animate-pulse" />
                <div className="w-20 h-3 bg-slate-700/50 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-16 h-6 rounded-lg bg-slate-700/50 animate-pulse" />
          </div>
          <div className="space-y-3 p-4 rounded-xl bg-slate-800/20">
            <div className="w-full h-4 bg-slate-700/50 rounded animate-pulse" />
            <div className="w-2/3 h-4 bg-slate-700/50 rounded animate-pulse" />
            <div className="w-1/2 h-4 bg-slate-700/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      onClick={() => currentTicket && onTicketClick?.(currentTicket.id)}
      className={`rounded-2xl overflow-hidden cursor-pointer group relative border transition-all duration-500 ${theme === 'dark'
        ? 'bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90 border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_40px_-5px_rgba(6,182,212,0.25)]'
        : 'bg-white border-slate-200 shadow-lg hover:shadow-xl hover:border-cyan-300'
        }`}
    >
      {/* Header matching DashboardReminders */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <Ticket size={24} className="text-cyan-500" />
          <div>
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              Novos Chamados
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tickets.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex
                ? 'bg-cyan-400 w-5 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                : `w-2 ${theme === 'dark' ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-300 hover:bg-slate-400'}`
                }`}
            />
          ))}
        </div>
      </div>

      {/* Explicit Separator Line */}
      <div className={`w-full h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`} />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTicket?.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="px-6 pb-6 pt-4"
        >
          {currentTicket && (
            <div className="space-y-4">
              {/* Solicitante + Número */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark'
                    ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20'
                    : 'bg-gradient-to-br from-cyan-50 to-blue-50'
                    }`}>
                    <User size={20} className="text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      {currentTicket.solicitante}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Solicitante
                    </p>
                  </div>
                </div>
                <span className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${theme === 'dark'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                  }`}>
                  #{currentTicket.numero}
                </span>
              </div>

              {/* Info Section */}
              <div className={`space-y-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-white/[0.03] border border-white/5' : 'bg-slate-50 border border-slate-100'}`}>
                {/* Serviço */}
                {(currentTicket.tipo_servico || currentTicket.servico) && (
                  <div className="flex items-start gap-3">
                    <Wrench size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        Serviço
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                        {currentTicket.tipo_servico || currentTicket.servico}
                      </p>
                    </div>
                  </div>
                )}

                {/* Descrição */}
                {(currentTicket.descricao_completa || currentTicket.descricao) && (
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        Descrição
                      </p>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                        {currentTicket.descricao_completa || currentTicket.descricao}
                      </p>
                    </div>
                  </div>
                )}

                {/* Local + Sala */}
                <div className="flex items-start gap-3">
                  <Building2 size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Local
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                      {currentTicket.local}
                      {currentTicket.sala && ` • Sala ${currentTicket.sala}`}
                    </p>
                  </div>
                </div>

                {/* Contato */}
                {(currentTicket.ramal || currentTicket.celular) && (
                  <div className="flex items-start gap-3">
                    <Phone size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        Contato
                      </p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                        {currentTicket.ramal ? `Ramal ${currentTicket.ramal}` : currentTicket.celular}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-end gap-1.5 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                <span>Clique para ver detalhes</span>
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Animated bottom accent line (Moved from Weather) */}
      <div className="h-1 relative overflow-hidden bg-slate-900/50">
        <motion.div
          key={currentIndex}
          animate={{
            x: ['-100%', '305%']
          }}
          transition={{
            duration: 6,
            ease: "linear"
          }}
          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.5)]"
        />
      </div>
    </motion.div>
  );
};

export default DashboardTicketsTicker;
