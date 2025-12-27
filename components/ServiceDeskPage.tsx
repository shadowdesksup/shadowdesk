import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, deleteDoc, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Ticket, RefreshCw, Search, ChevronDown, ChevronUp, Phone, Mail, Building, Eye, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

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
  hiddenFor?: string[]; // New field for soft delete
  // New detailed fields
  tipo_servico?: string;
  local_instalacao?: string;
  descricao_completa?: string;
  patrimonio?: string;
  sala?: string;
  ramal?: string;
  celular?: string;
  email?: string;
  data_atendimento?: string;
}

interface ServiceDeskPageProps {
  theme?: 'dark' | 'light';
  initialContext?: { page: string; ticketId?: string };
  onContextUsed?: () => void;
}

export default function ServiceDeskPage({ theme = 'dark', initialContext, onContextUsed }: ServiceDeskPageProps) {
  const { usuario, dadosUsuario } = useAuth();
  const userName = dadosUsuario?.nomeCompleto || usuario?.displayName || usuario?.email || 'Usuário';

  const [tickets, setTickets] = useState<ServiceDeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

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

      // Filter out tickets hidden for this user
      const visibleDocs = docs.filter(t => !t.hiddenFor?.includes(userName));

      setTickets(visibleDocs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle Initial Context (Navigation from Notification)
  useEffect(() => {
    if (initialContext && initialContext.page === 'servicedesk' && initialContext.ticketId && tickets.length > 0) {
      // Search for ticket
      const targetId = initialContext.ticketId;
      const ticket = tickets.find(t => t.id === targetId);

      if (ticket) {
        // Expand it
        // Note: expandedTicket state handling is simple.
        // But we need to make sure we don't loop if onContextUsed is not cleared.
        // toggleExpand logic also marks as viewed. 
        // We should call markAsViewed explicitly here to be safe and setExpanded.
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
      // 1. Soft Delete (Hide for this user)
      if (userName) {
        await updateDoc(doc(db, 'serviceDesk_tickets', deleteConfirmId), {
          hiddenFor: arrayUnion(userName)
        });
        console.log(`Ticket ${deleteConfirmId} hidden for user ${userName}`);
      } else {
        // Fallback for missing username (shouldnt happen)
        console.warn('No username found, performing hard delete');
        await deleteDoc(doc(db, 'serviceDesk_tickets', deleteConfirmId));
      }

      // We don't need to add to ignore list if we are just hiding it.
      // But if the user wants to "remove" it, maybe they want it ignored too?
      // "se cada um deleta algo de lá não deve sair da base".
      // So we just hide it. The worker will keep updating it, but it will remain hidden for this user.

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
          width: max-content; /* Ensure width matches content exactly for seamless -50% loop */
        }
        .animate-pulse-green {
          animation: pulse-growth 2s ease-in-out infinite;
        }
        .marquee-container:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>

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
            <table className="w-full">
              <thead className={`border-b ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <tr className={`text-left text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600 font-semibold'}`}>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Solicitante</th>
                  <th className="px-4 py-3">Local</th>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3 w-[150px]">Visto Por</th>
                  <th className="px-4 py-3 text-center">Ações</th>
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
                    const isViewedByMe = viewersList.includes(userName); // Local check
                    const isViewedByAny = viewersList.length > 0; // Global check for Marquee
                    const isNewAndUnviewed = ticket.status === 'Nova' && !isViewedByMe; // Styling depends on ME

                    const getNameColor = (name: string) => {
                      const colors = ['text-teal-400', 'text-blue-400', 'text-violet-400', 'text-cyan-400', 'text-emerald-400', 'text-fuchsia-400', 'text-orange-400', 'text-rose-400', 'text-lime-400'];
                      let hash = 0;
                      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
                      return colors[Math.abs(hash) % colors.length];
                    };

                    const totalLength = viewersList.join(', ').length;
                    const shouldAnimate = totalLength > 18; // Fixed matching value

                    return (
                      <React.Fragment key={ticket.id}>
                        {/* Main Row */}
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
                          <td className="px-4 py-3">
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
                          <td className={`px-4 py-3 text-sm max-w-[150px] truncate ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700 font-medium'}`} title={ticket.solicitante}>
                            {ticket.solicitante}
                          </td>
                          <td className={`px-4 py-3 text-sm max-w-[120px] truncate ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`} title={ticket.local}>
                            {ticket.local}
                          </td>
                          <td className={`px-4 py-3 text-sm max-w-[200px] truncate ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`} title={ticket.servico}>
                            {ticket.servico || '-'}
                          </td>

                          {/* Abertura / Marquee Column */}
                          <td className={`px-4 py-3 text-sm w-[150px] overflow-hidden relative ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                            {isViewedByAny ? (
                              <div className="w-[140px] overflow-hidden marquee-container relative h-5 flex items-center">
                                <div className={`${totalLength > 18 ? 'animate-marquee' : ''} whitespace-nowrap flex items-center`}>
                                  {/* Original Content + Spacer */}
                                  <div className="flex items-center">
                                    {viewersList.map((name, idx) => (
                                      <span key={`orig-${idx}`}>
                                        <span className={`font-semibold ${getNameColor(name)}`}>{name}</span>
                                        {idx < viewersList.length - 1 && <span className="text-gray-500/50 mr-1">,</span>}
                                      </span>
                                    ))}
                                    {totalLength > 18 && <span className="w-16 inline-block"></span>}
                                  </div>

                                  {/* Duplicated Content + Spacer for Seamless Loop */}
                                  {totalLength > 18 && (
                                    <div className="flex items-center">
                                      {viewersList.map((name, idx) => (
                                        <span key={`dup-${idx}`}>
                                          <span className={`font-semibold ${getNameColor(name)}`}>{name}</span>
                                          {idx < viewersList.length - 1 && <span className="text-gray-500/50 mr-1">,</span>}
                                        </span>
                                      ))}
                                      <span className="w-16 inline-block"></span>
                                    </div>
                                  )}
                                </div>
                              </div>
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

                        {/* Expanded Details Row */}
                        {expandedTicket === ticket.id && (
                          <tr className={theme === 'dark' ? 'bg-blue-500/5' : 'bg-blue-50/50'}>
                            <td colSpan={8} className="px-4 py-4">
                              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-[#1a1a1a]/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                                  Informações do Chamado
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  {/* Serviço/Tipo de Serviço */}
                                  {(ticket.tipo_servico || ticket.servico) && (
                                    <div className="md:col-span-2">
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Tipo de Serviço:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.tipo_servico || ticket.servico}</span>
                                    </div>
                                  )}

                                  {/* Local de Instalação */}
                                  {ticket.local_instalacao && (
                                    <div className="md:col-span-2">
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Local de Instalação:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.local_instalacao}</span>
                                    </div>
                                  )}

                                  {/* Patrimônio */}
                                  {ticket.patrimonio && (
                                    <div>
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Patrimônio:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.patrimonio}</span>
                                    </div>
                                  )}

                                  {/* Sala */}
                                  {ticket.sala && (
                                    <div>
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Sala:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.sala}</span>
                                    </div>
                                  )}

                                  {/* Ramal */}
                                  {ticket.ramal && (
                                    <div>
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Ramal:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.ramal}</span>
                                    </div>
                                  )}

                                  {/* Celular */}
                                  {ticket.celular && (
                                    <div>
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Celular:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.celular}</span>
                                    </div>
                                  )}

                                  {/* E-mail */}
                                  {ticket.email && (
                                    <div className="md:col-span-2">
                                      <span className={`block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>E-mail:</span>
                                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}>{ticket.email}</span>
                                    </div>
                                  )}

                                  {/* Descrição do Serviço */}
                                  {(ticket.descricao_completa || ticket.descricao) && (
                                    <div className={`md:col-span-2 p-3 rounded-lg border ${theme === 'dark' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                                      <span className={`block mb-2 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-blue-600'}`}>Descrição do Serviço:</span>
                                      <p className={`whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>{ticket.descricao_completa || ticket.descricao}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Link para ServiceDesk */}
                                <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
                                  <a
                                    href={`https://servicedesk.unesp.br/atendimento/${ticket.numero}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Ver no ServiceDesk oficial
                                  </a>
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
