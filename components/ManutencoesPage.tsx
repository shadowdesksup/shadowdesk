import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, CheckCircle, Clock, Save, FileText, ChevronDown, ChevronRight, Package, Hash } from 'lucide-react';
import { useEstoque } from '../hooks/useEstoque';
import { useAuth } from '../hooks/useAuth';
import { EquipamentoEstoque, StatusEquipamento } from '../types';
import { imprimirFichaManutencao } from './Relatorios/GeradorFichaManutencao';

interface ManutencoesPageProps {
  theme?: 'dark' | 'light';
}

const ManutencoesPage: React.FC<ManutencoesPageProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const { usuario, dadosUsuario } = useAuth();
  const { estoque, carregando, erro, atualizarEquipamento } = useEstoque();

  const emManutencao = estoque.filter(e => e.status === 'MANUTENCAO');

  // Controle do Accordion
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const [modalConclusaoAberto, setModalConclusaoAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<EquipamentoEstoque | null>(null);

  // States for Conclusão Modal
  const [novoStatus, setNovoStatus] = useState<StatusEquipamento>('DISPONIVEL');
  const [laudoManutencao, setLaudoManutencao] = useState('');

  const handleOpenConclusao = (item: EquipamentoEstoque) => {
    setItemSelecionado(item);
    setNovoStatus('DISPONIVEL');
    setLaudoManutencao('');
    setModalConclusaoAberto(true);
  };

  const handleConcluirManutencao = async () => {
    if (!itemSelecionado) return;
    const nomeUser = dadosUsuario?.nomeCompleto || usuario?.email || 'Sistema';

    const acaoTexto = `Manutenção finalizada. Status: ${novoStatus}. Laudo: ${laudoManutencao}`;

    await atualizarEquipamento(itemSelecionado.id, {
      status: novoStatus,
      // Clear current maintenance
      manutencaoAtual: undefined,
      historico: [
        ...(itemSelecionado.historico || []),
        {
          acao: acaoTexto,
          data: new Date().toISOString(),
          usuarioId: usuario?.uid || '',
          usuarioNome: nomeUser
        }
      ]
    });

    setModalConclusaoAberto(false);
    setItemSelecionado(null);
  };

  const gerarLaudoPDF = (item: EquipamentoEstoque) => {
    imprimirFichaManutencao(item);
  };

  return (
    <div className="h-full overflow-y-auto pr-0 md:pr-4 relative flex flex-col">
      {/* Header Central de Manutenções */}
      <div className={`p-6 md:p-8 mb-8 rounded-3xl border shadow-lg flex flex-col gap-6 relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700/50' : 'bg-white border-slate-200'}`}>
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${isDark ? 'bg-amber-500' : 'bg-amber-400'}`}></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
          <div>
            <h2 className={`text-3xl md:text-4xl font-extrabold flex items-center gap-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30">
                <Wrench className="text-white" size={28} />
              </div>
              Central de Manutenções
            </h2>
            <p className={`mt-2 text-sm md:text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie os ativos em reparo e emita laudos técnicos com facilidade.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex-1 md:flex-none px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm ${isDark ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
              <Clock size={20} />
              {emManutencao.length} {emManutencao.length === 1 ? 'Em Andamento' : 'Em Andamento'}
            </div>
          </div>
        </div>
      </div>

      {erro && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 mb-6 font-medium">
          {erro}
        </div>
      )}

      {carregando && emManutencao.length === 0 ? (
        <div className={`p-16 text-center rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-900/60 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-orange-500/50" />
          <p className="text-xl font-semibold tracking-wide animate-pulse">Carregando manutenções...</p>
        </div>
      ) : emManutencao.length === 0 ? (
        <div className={`flex flex-col items-center justify-center p-16 text-center rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-900/40 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
          <CheckCircle size={64} className="mx-auto mb-6 text-emerald-500 opacity-80" />
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Tudo em ordem!</h3>
          <p className="text-lg opacity-70">Não há nenhum equipamento em manutenção no momento.</p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4 pb-10">
          {emManutencao.map(item => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className={`rounded-3xl border transition-all ${isDark ? 'bg-slate-900 border-slate-700 hover:border-amber-500/50 shadow-lg shadow-black/20' : 'bg-white border-slate-200 hover:border-amber-400 shadow-sm'}`}>

                {/* Accordion Header */}
                <div
                  className={`p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between cursor-pointer gap-4 lg:gap-8 transition-colors ${isExpanded ? (isDark ? 'bg-slate-800/40' : 'bg-slate-50') : 'hover:bg-slate-800/10'} rounded-t-3xl ${!isExpanded ? 'rounded-b-3xl' : ''}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt="Img" className="w-full h-full object-cover" />
                      ) : (
                        <Wrench className="text-slate-400 opacity-50" size={24} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-max inline-flex px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm ${isDark ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>Em Manutenção</span>
                        {item.manutencaoAtual?.tipoManutencao && (
                          <span className={`w-max inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                            item.manutencaoAtual.tipoManutencao === 'REPARO_COMUM'
                              ? (isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600 border border-purple-200')
                              : (isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border border-cyan-200')
                          }`}>
                            {item.manutencaoAtual.tipoManutencao === 'REPARO_COMUM' ? 'Reparo Comum' : 'Incorporar Estoque'}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base sm:text-xl font-extrabold leading-none truncate flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {item.manutencaoAtual?.ticketId ? (
                          <span className="font-mono">{item.manutencaoAtual.ticketId}</span>
                        ) : (
                          <span className="font-mono text-slate-500">S/ Ticket</span>
                        )}
                      </h3>
                    </div>
                    {/* Botão expandir mobile (aparece nos sm e md, some no lg) */}
                    <div className={`lg:hidden ml-auto w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:flex items-center gap-4 lg:gap-10 w-full lg:w-auto">
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Equipamento</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.tipo} — {item.marca} {item.modelo}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Solicitante</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.manutencaoAtual?.solicitante || 'Não Informado'}</span>
                    </div>
                    <div className="flex flex-col col-span-2 lg:col-span-1">
                      <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Data Início</span>
                      <span className={`text-[13px] sm:text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        {item.manutencaoAtual?.dataInicio ? new Date(item.manutencaoAtual.dataInicio).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className={`hidden lg:flex w-10 h-10 rounded-full items-center justify-center flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''} ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-500'}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>

                {/* Accordion Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`border-t ${isDark ? 'border-slate-800/50 bg-slate-900/80' : 'border-slate-200 bg-slate-50/50'}`}
                    >
                      <div className="p-6 flex flex-col md:flex-row gap-6">
                        {/* Info Secundária */}
                        <div className="flex-1 flex flex-col gap-6">
                          <div className="flex flex-col sm:flex-row gap-6">
                            <div>
                              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Patrimônio</h4>
                              <p className={`font-mono font-semibold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.patrimonio || 'S/N'}
                              </p>
                            </div>
                            <div>
                              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nº Série</h4>
                              <p className={`font-mono font-semibold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.numeroSerie || 'S/N'}
                              </p>
                            </div>
                            <div>
                              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Técnico Responsável</h4>
                              <p className={`font-semibold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.manutencaoAtual?.tecnicoResponsavelNome || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Condição Recebida</h4>
                              <p className={`font-semibold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.manutencaoAtual?.condicaoBem || 'Não informada'}
                              </p>
                            </div>
                            <div>
                              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Vínculo Solicitante</h4>
                              <p className={`font-semibold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.manutencaoAtual?.vinculo || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Local</h4>
                              <p className={`font-semibold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.manutencaoAtual?.origem || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                              <Wrench size={14} /> Defeito Relatado / Ocorrência
                            </h4>
                            <div className={`p-4 rounded-xl border text-sm leading-relaxed ${isDark ? 'bg-slate-900/50 border-slate-700/50 text-slate-300' : 'bg-slate-100/50 border-slate-200 text-slate-700'}`}>
                              {item.manutencaoAtual?.problema || 'Nenhuma descrição técnica fornecida.'}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 justify-end md:w-60 pt-4 md:pt-0">
                          <button onClick={() => gerarLaudoPDF(item)} className={`py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm border ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700 hover:border-slate-600' : 'bg-slate-50 hover:bg-slate-100 text-cyan-700 border-slate-200'}`}>
                            <FileText size={18} /> Resumo p/ Laudo / Ficha
                          </button>
                          <button onClick={() => handleOpenConclusao(item)} className="py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                            <Save size={18} /> Baixa de Serviços
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Conclusão */}
      {modalConclusaoAberto && itemSelecionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalConclusaoAberto(false)} />
          <div className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border p-6 flex flex-col gap-6 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <CheckCircle className="text-emerald-500" size={28} /> Baixa de Manutenção
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Novo Status Após Manutenção *</label>
                <select
                  value={novoStatus} onChange={(e) => setNovoStatus(e.target.value as StatusEquipamento)}
                  className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'} border`}
                >
                  <option value="DISPONIVEL">Pronto / Disponível para Uso</option>
                  <option value="DESCARTADO">Sem Conserto / Descartado</option>
                  <option value="AVALIACAO">Requer Reavaliação</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Laudo da Solução (Para Histórico) *
                </label>
                <textarea
                  value={laudoManutencao} onChange={(e) => setLaudoManutencao(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 min-h-[120px] outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'} border`}
                  placeholder="Descreva as peças trocadas, serviços realizados, ou motivo da perda..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setModalConclusaoAberto(false)} className={`px-5 py-2.5 rounded-xl font-medium ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                Cancelar
              </button>
              <button onClick={handleConcluirManutencao} disabled={!laudoManutencao} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
                Confirmar e Baixar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManutencoesPage;
