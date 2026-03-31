import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, CheckCircle, Clock, Save, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useEstoque } from '../hooks/useEstoque';
import { useAuth } from '../hooks/useAuth';
import { EquipamentoEstoque, StatusEquipamento } from '../types';

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
    // Placeholder to call a PDF generator logic later.
    alert('Geração de PDF do laudo será implementada com @react-pdf/renderer. O relatório contem as informacoes de ' + item.manutencaoAtual?.solicitante);
  };

  return (
    <div className="h-full overflow-y-auto pr-2 md:pr-4 relative flex flex-col">
      {/* Header Central de Manutenções */}
      <div className={`p-6 md:p-8 mb-8 rounded-3xl border backdrop-blur-md shadow-xl flex flex-col gap-6 bg-cover bg-center ${isDark ? 'bg-orange-950/40 border-orange-500/20' : 'bg-orange-50 border-orange-500/10'}`}>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
          <div>
            <h2 className={`text-4xl font-extrabold flex items-center gap-3 tracking-tight ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
              <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg shadow-orange-500/30">
                <Wrench className="text-white" size={32} />
              </div>
              Central de Manutenções
            </h2>
            <p className={`mt-2 text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie os ativos em reparo e emita laudos técnicos.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 ${isDark ? 'bg-orange-500/20 text-orange-400 outline outline-1 outline-orange-500/30' : 'bg-orange-100 text-orange-700 outline outline-1 outline-orange-200'}`}>
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
              <div key={item.id} className={`rounded-2xl border backdrop-blur-md overflow-hidden transition-all ${isDark ? 'bg-slate-900/60 border-white/10 hover:border-orange-500/50' : 'bg-white border-slate-200 hover:border-orange-500 shadow-sm'}`}>
                
                {/* Accordion Header */}
                <div 
                  className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? (isDark ? 'bg-slate-800/40' : 'bg-slate-50') : 'hover:bg-slate-800/20'}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden border-2 ${isDark ? 'border-orange-500/30 bg-slate-800' : 'border-orange-200 bg-slate-50'}`}>
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt="Img" className="w-full h-full object-cover" />
                      ) : (
                        <Wrench className="text-orange-500/50" />
                      )}
                    </div>
                    <div className="flex flex-col">
                        <h3 className={`text-lg font-bold uppercase leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {item.tipo} {item.marca}
                        </h3>
                        <p className={`font-medium text-sm ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{item.modelo}</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-8 lg:gap-12 mr-8">
                      <div className="flex flex-col">
                        <span className={`text-xs uppercase font-bold tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Identificação</span>
                        <span className={`font-mono text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.patrimonio || item.numeroProcesso || 'S/N'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs uppercase font-bold tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Solicitante</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.manutencaoAtual?.solicitante || 'Não Informado'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs uppercase font-bold tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Entrada</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.manutencaoAtual?.dataInicio ? new Date(item.manutencaoAtual.dataInicio).toLocaleDateString() : 'N/A'}</span>
                      </div>
                  </div>

                  <div className={`p-2 rounded-full flex-shrink-0 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
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
                          {/* Info Secundária (Problema, Responsável) */}
                          <div className="flex-1">
                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                              <Wrench size={14} /> Defeito Relatado / Ocorrência
                            </h4>
                            <div className={`p-4 rounded-xl border mb-5 text-sm leading-relaxed ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                                {item.manutencaoAtual?.problema || 'Nenhuma descrição técnica fornecida.'}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-6">
                              <div>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Técnico Responsável</h4>
                                <p className={`font-medium text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {item.manutencaoAtual?.tecnicoResponsavelNome || 'N/A'}
                                </p>
                              </div>
                              <div className="md:hidden">
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Solicitante</h4>
                                <p className={`font-medium text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {item.manutencaoAtual?.solicitante || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-3 justify-end md:w-56">
                            <button onClick={() => gerarLaudoPDF(item)} className={`py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700' : 'bg-white hover:bg-slate-50 text-cyan-600 border border-slate-200'}`}>
                              <FileText size={18} /> Resumo P/ Laudo
                            </button>
                            <button onClick={() => handleOpenConclusao(item)} className="py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                              <Save size={18} /> Concluir Manutenção
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
