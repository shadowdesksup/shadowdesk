import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, deleteDoc, doc, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Ticket, RefreshCw, Search, ChevronDown, ChevronUp, Phone, Mail, Building, Eye, Trash2, ExternalLink, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceDeskNotificationModal from './ServiceDeskNotificationModal';
import LembreteModal from './LembreteModal';
import { criarLembrete, buscarUsuarios } from '../firebase/lembretes';

const getNameColor = (name: string) => {
  const colors = [
    'text-blue-500', 'text-purple-500', 'text-pink-500',
    'text-amber-500', 'text-emerald-500', 'text-cyan-500',
    'text-indigo-500', 'text-rose-500', 'text-orange-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ViewersFader = ({ viewers }: { viewers: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (viewers.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % viewers.length);
    }, 3000); // 3 seconds per name
    return () => clearInterval(interval);
  }, [viewers.length]);

  return (
    <div className="h-6 w-full flex items-center justify-center overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.span
          key={`viewer-${viewers[index]}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`font-semibold whitespace-nowrap px-1 ${getNameColor(viewers[index])}`}
        >
          {viewers[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

interface ServiceDeskTicket {
  id: string;
  numero: string;
  abertura: string;
  solicitante: string;
  local: string;
  servico?: string;
  status: string;
  prioridade?: string;
  timestamp: any;
  viewedBy?: string[];
  hiddenFor?: string[];
  tipo_servico?: string;
  local_instalacao?: string;
  descricao_completa?: string;
  patrimonio?: string;
  sala?: string;
  ramal?: string;
  celular?: string;
  email?: string;
  data_atendimento?: string;
  descricao?: string;
}

interface ServiceDeskPageProps {
  theme?: 'dark' | 'light';
  initialContext?: { page: string; ticketId?: string };
  onContextUsed?: () => void;
}

export default function ServiceDeskPage({ theme = 'dark', initialContext, onContextUsed }: ServiceDeskPageProps) {
  const { usuario, dadosUsuario } = useAuth();
  const userName = dadosUsuario?.nomeCompleto || usuario?.displayName || usuario?.email || 'Usuário';
  const userId = usuario?.uid;

  const [tickets, setTickets] = useState<ServiceDeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  // Notification Modal State
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [prefTelefone, setPrefTelefone] = useState('');
  const [prefEnabled, setPrefEnabled] = useState(false);

  // Reminder Modal State
  const [selectedTicketForReminder, setSelectedTicketForReminder] = useState<ServiceDeskTicket | null>(null);

  const handleLembrarMe = (ticket: ServiceDeskTicket) => {
    setSelectedTicketForReminder(ticket);
  };

  const handleCreateReminder = async (dados: any) => {
    try {
      if (!selectedTicketForReminder) return;
      await criarLembrete(userId || '', userName, dados);
      setSelectedTicketForReminder(null);
    } catch (err) {
      console.error('Error creating reminder:', err);
      alert('Erro ao criar lembrete');
    }
  };

  // Load User Preferences on Mount
  useEffect(() => {
    if (!userId) return;
    const loadPref = async () => {
      try {
        const docRef = doc(db, 'serviceDesk_preferences', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPrefEnabled(data.enabled || false);
          setPrefTelefone(data.phone || '');
        } else {
          const localPhone = localStorage.getItem('last_whatsapp_number');
          if (localPhone) setPrefTelefone(localPhone);
        }
      } catch (e) {
        console.error('Error loading preferences', e);
      }
    };
    loadPref();
  }, [userId]);

  const handleSaveNotification = async (telefone: string, enabled: boolean) => {
    if (!userId) return;
    await setDoc(doc(db, 'serviceDesk_preferences', userId), {
      userId,
      phone: telefone,
      enabled,
      updatedAt: new Date().toISOString()
    });
    setPrefTelefone(telefone);
    setPrefEnabled(enabled);

    if (enabled && telefone) {
      localStorage.setItem('last_whatsapp_number', telefone);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'serviceDesk_tickets'),
      orderBy('numero', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceDeskTicket[];

      const visibleDocs = docs.filter(t => !t.hiddenFor?.includes(userName));

      setTickets(visibleDocs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userName]);

  // Handle Initial Context
  useEffect(() => {
    if (initialContext && initialContext.page === 'servicedesk' && initialContext.ticketId && tickets.length > 0) {
      const targetId = initialContext.ticketId;
      const ticket = tickets.find(t => t.id === targetId);

      if (ticket) {
        setExpandedTicket(targetId);
        markAsViewed(ticket);
        if (onContextUsed) onContextUsed();
      }
    }
  }, [initialContext, tickets]);

  const markAsViewed = async (ticket: ServiceDeskTicket) => {
    if (!ticket.viewedBy?.includes(userName)) {
      try {
        await updateDoc(doc(db, 'serviceDesk_tickets', ticket.id), {
          viewedBy: arrayUnion(userName)
        });
      } catch (error) {
        console.error('Error marking as viewed:', error);
      }
    }
  };

  const toggleExpand = (ticketId: string) => {
    if (expandedTicket !== ticketId) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) markAsViewed(ticket);
    }
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  const filteredTickets = tickets.filter(t => {
    if (!filterText) return true;
    const searchLower = filterText.toLowerCase();
    return (
      t.numero?.toLowerCase().includes(searchLower) ||
      t.solicitante?.toLowerCase().includes(searchLower) ||
      t.local?.toLowerCase().includes(searchLower) ||
      t.servico?.toLowerCase().includes(searchLower)
    );
  });

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-600';
    const p = priority.toLowerCase();
    if (p.includes('alta') || p.includes('urgente')) return 'bg-red-500';
    if (p.includes('média') || p.includes('media')) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const requestDelete = (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(ticketId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      if (userName) {
        await updateDoc(doc(db, 'serviceDesk_tickets', deleteConfirmId), {
          hiddenFor: arrayUnion(userName)
        });
      } else {
        await deleteDoc(doc(db, 'serviceDesk_tickets', deleteConfirmId));
      }
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Erro ao excluir chamado');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-auto relative">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse-growth {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
          display: flex;
          align-items: center;
          width: max-content;
        }
        .animate-pulse-green {
          animation: pulse-growth 2s ease-in-out infinite;
        }
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>

      {/* Notification Modal */}
      {showNotificationModal && (
        <ServiceDeskNotificationModal
          theme={theme}
          onClose={() => setShowNotificationModal(false)}
          onSave={handleSaveNotification}
          initialPhone={prefTelefone}
          initialEnabled={prefEnabled}
        />
      )}

      {/* Reminder Modal */}
      {selectedTicketForReminder && (
        <LembreteModal
          isServiceDesk={true}
          theme={theme}
          onClose={() => setSelectedTicketForReminder(null)}
          onSave={handleCreateReminder}
          lembrete={{
            id: '',
            titulo: ` solicitante: ${selectedTicketForReminder.solicitante}`,
            descricao: `${selectedTicketForReminder.descricao_completa || selectedTicketForReminder.descricao || ''}`,
            dataHora: new Date().toISOString(),
            cor: 'sand',
            somNotificacao: 'sino',
            status: 'pendente',
            criadoPor: userId || '',
            criadoEm: new Date().toISOString(),
            tipo: 'servicedesk',
            metadata: {
              solicitante: selectedTicketForReminder.solicitante,
              local: selectedTicketForReminder.local,
              sala: selectedTicketForReminder.sala,
              dataAgendamento: (selectedTicketForReminder.melhor_data || selectedTicketForReminder.data_atendimento) !== 'Não informado'
                ? (selectedTicketForReminder.melhor_data || selectedTicketForReminder.data_atendimento)
                : undefined,
              ticketId: selectedTicketForReminder.numero
            }
          } as any}
          buscarUsuarios={buscarUsuarios}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              <Trash2 className="w-5 h-5 text-orange-400" />
              Ocultar Chamado
            </h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>
              Este chamado será ocultado da sua lista, mas permanecerá visível para outros usuários.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors shadow-lg shadow-orange-500/20"
              >
                Sim, Ocultar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            <Ticket className="w-6 h-6 text-blue-400" />
            Chamados ServiceDesk
          </h1>
          <div className="flex items-center gap-3">
            {/* Notification Button */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${prefEnabled
                ? 'bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/30 shadow-[0_0_10px_-3px_#25D366]'
                : (theme === 'dark' ? 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50')
                }`}
              title="Configurar notificações WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {prefEnabled ? 'Ativado' : 'Notifique-me'}
            </button>

            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              Novos: {tickets.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Filtrar chamados..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors
              ${theme === 'dark'
                ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500'
                : 'bg-white border border-slate-300 text-slate-800 placeholder-slate-400 shadow-sm'
              }`}
          />
        </div>

        {/* Table */}
        <div className={`rounded-lg border overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className={`border-b ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <tr className={`text-left text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600 font-semibold'}`}>
                  <th className="px-4 py-3 w-[80px]">#</th>
                  <th className="px-4 py-3 text-center w-[120px]">Prioridade</th>
                  <th className="px-4 py-3 w-[140px]">Status</th>
                  <th className="px-4 py-3 w-[30%]">Solicitante</th>
                  <th className="px-4 py-3 w-[25%]">Local</th>
                  <th className="px-4 py-3 w-[15%]">Serviço</th>
                  <th className="px-4 py-3 w-[150px] text-center">Visto Por</th>
                  <th className="px-4 py-3 text-center w-[80px]">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando chamados...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`px-4 py-12 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>
                      {filterText ? 'Nenhum chamado encontrado para o filtro.' : 'Nenhum chamado sincronizado ainda.'}
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const viewersList = ticket.viewedBy || [];
                    const isViewedByMe = viewersList.includes(userName);
                    const isViewedByAny = viewersList.length > 0;
                    const isNewAndUnviewed = ticket.status === 'Nova' && !isViewedByMe;

                    return (
                      <React.Fragment key={ticket.id}>
                        <tr
                          className={`transition-colors cursor-pointer 
                            ${expandedTicket === ticket.id ? (theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-50') : ''}
                            ${isNewAndUnviewed
                              ? (theme === 'dark' ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : 'bg-cyan-50 border-l-2 border-cyan-500')
                              : ''}
                            ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}
                          `}
                          onClick={() => toggleExpand(ticket.id)}
                        >
                          <td className="px-4 py-3">
                            <span className="text-blue-400 font-mono font-medium">{ticket.numero}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${getPriorityColor(ticket.prioridade)} ${isNewAndUnviewed ? 'animate-pulse-green shadow-[0_0_8px_rgba(34,197,94,0.6)]' : ''}`}
                              title={ticket.prioridade || 'Normal'}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${ticket.status === 'Nova'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : ticket.status?.includes('Atendimento')
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
                              }`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm max-w-[300px] truncate ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700 font-medium'}`} title={ticket.solicitante}>
                            {ticket.solicitante}
                          </td>
                          <td className={`px-4 py-3 text-sm max-w-[250px] truncate ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`} title={ticket.local}>
                            {ticket.local}
                          </td>
                          <td className={`px-4 py-3 text-sm max-w-[150px] truncate ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`} title={ticket.servico}>
                            {ticket.servico || '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm w-[150px] overflow-hidden relative text-center ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                            {isViewedByAny ? (
                              <ViewersFader viewers={viewersList} />
                            ) : (
                              <span className={`text-xs block text-center italic ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500 font-medium'}`}>Não visualizado</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-colors"
                                title="Ver detalhes"
                              >
                                {expandedTicket === ticket.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={(e) => requestDelete(ticket.id, e)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                title="Excluir chamado"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedTicket === ticket.id && (
                          <tr className={theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-50/50'}>
                            <td colSpan={8} className="px-4 py-4">
                              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#1a1a1a]/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                                  Informações do Chamado
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {(ticket.tipo_servico || ticket.servico) && (
                                    <div className="md:col-span-2">
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Tipo de Serviço:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.tipo_servico || ticket.servico}</span>
                                    </div>
                                  )}
                                  {ticket.local_instalacao && (
                                    <div className="md:col-span-2">
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Local de Instalação:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.local_instalacao}</span>
                                    </div>
                                  )}
                                  {ticket.patrimonio && (
                                    <div>
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Patrimônio:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.patrimonio}</span>
                                    </div>
                                  )}
                                  {ticket.sala && (
                                    <div>
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Sala:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.sala}</span>
                                    </div>
                                  )}
                                  {ticket.ramal && (
                                    <div>
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Ramal:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.ramal}</span>
                                    </div>
                                  )}
                                  {ticket.celular && (
                                    <div>
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Celular:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.celular}</span>
                                    </div>
                                  )}
                                  {ticket.email && (
                                    <div className="md:col-span-2">
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>E-mail:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.email}</span>
                                    </div>
                                  )}
                                  {(ticket.descricao_completa || ticket.descricao) && (
                                    <div className={`md:col-span-2 p-3 rounded-lg border ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                                      <span className={`block mb-2 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-blue-600'}`}>Descrição do Serviço:</span>
                                      <p className={`whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>{ticket.descricao_completa || ticket.descricao}</p>
                                    </div>
                                  )}
                                </div>
                                <div className={`mt-4 pt-4 border-t flex items-center gap-4 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
                                  <a
                                    href={`https://servicedesk.unesp.br/atendimento/${ticket.numero}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Ver no ServiceDesk oficial
                                  </a>

                                  <button
                                    onClick={() => handleLembrarMe(ticket)}
                                    className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${theme === 'dark' ? 'text-yellow-400 hover:text-yellow-300 animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-yellow-600 hover:text-yellow-700'}`}
                                  >
                                    <Bell className="w-4 h-4" />
                                    Lembrar-me
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
