import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, CheckCircle, Clock, Save, FileText, ChevronDown, ChevronRight, Package, Hash, Search } from 'lucide-react';
import { useEstoque } from '../hooks/useEstoque';
import { useAuth } from '../hooks/useAuth';
import { EquipamentoEstoque, StatusEquipamento } from '../types';
import { gerarHtmlFichaManutencao, gerarHtmlTermo, imprimirHtml } from './ManutencaoPreviewModal';

interface ManutencoesPageProps {
  theme?: 'dark' | 'light';
}

const ManutencoesPage: React.FC<ManutencoesPageProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const { usuario, dadosUsuario } = useAuth();
  const { estoque, carregando, erro, atualizarEquipamento } = useEstoque();

  const emManutencao = estoque.filter(e => e.status === 'MANUTENCAO');

  // Conta quantas vezes a ação de finalização ocorreu ao longo de todo o histórico do sistema
  const qtdFinalizada = estoque.reduce((total, e) => {
    const finalizadas = e.historico?.filter(h => h.acao?.includes('Manutenção finalizada'))?.length || 0;
    return total + finalizadas;
  }, 0);

  // Filtros Globais e em Cascata
  const [buscaGeral, setBuscaGeral] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [filtroModelo, setFiltroModelo] = useState<string>('');

  const opcoesTipo = React.useMemo(() => {
    const counts = new Map<string, number>();
    emManutencao.forEach(e => counts.set(e.tipo, (counts.get(e.tipo) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [emManutencao]);

  const opcoesMarca = React.useMemo(() => {
    let base = emManutencao;
    if (filtroTipo) base = base.filter(e => e.tipo === filtroTipo);
    const counts = new Map<string, number>();
    base.forEach(e => counts.set(e.marca, (counts.get(e.marca) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [emManutencao, filtroTipo]);

  const opcoesModelo = React.useMemo(() => {
    let base = emManutencao;
    if (filtroTipo) base = base.filter(e => e.tipo === filtroTipo);
    if (filtroMarca) base = base.filter(e => e.marca === filtroMarca);
    const counts = new Map<string, number>();
    base.forEach(e => counts.set(e.modelo, (counts.get(e.modelo) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [emManutencao, filtroTipo, filtroMarca]);

  const filtrados = React.useMemo(() => {
    let result = emManutencao;
    if (filtroTipo) result = result.filter(e => e.tipo === filtroTipo);
    if (filtroMarca) result = result.filter(e => e.marca === filtroMarca);
    if (filtroModelo) result = result.filter(e => e.modelo === filtroModelo);
    if (buscaGeral) {
        const lowerBusca = buscaGeral.toLowerCase();
        result = result.filter(e => 
          e.tipo?.toLowerCase().includes(lowerBusca) ||
          e.marca?.toLowerCase().includes(lowerBusca) ||
          e.modelo?.toLowerCase().includes(lowerBusca) ||
          e.patrimonio?.toLowerCase().includes(lowerBusca) ||
          e.numeroSerie?.toLowerCase().includes(lowerBusca) ||
          e.manutencaoAtual?.ticketId?.toLowerCase().includes(lowerBusca) ||
          e.manutencaoAtual?.solicitante?.toLowerCase().includes(lowerBusca)
        );
    }
    return result;
  }, [emManutencao, filtroTipo, filtroMarca, filtroModelo, buscaGeral]);

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


  return (
    <div className="h-full w-full overflow-y-auto pr-0 md:pr-4 pb-8 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Smart Header Section with Glassmorphism and Background Image */}
      <div className={`p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 rounded-3xl border backdrop-blur-md shadow-xl flex flex-col gap-4 sm:gap-6 bg-cover bg-center ${isDark ? 'bg-slate-900/80 border-amber-500/20' : 'bg-white border-amber-500/10'}`} style={{ backgroundImage: isDark ? 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80")' : 'linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8)), url("https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80")' }}>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
          <div>
            <h2 className={`text-2xl sm:text-4xl font-extrabold flex items-center gap-3 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30">
                <Wrench className="text-white" size={24} />
              </div>
              Central de Manutenções
            </h2>
            <p className={`mt-1 sm:mt-2 text-base sm:text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerencie os ativos em reparo e emita laudos técnicos com facilidade.
            </p>
          </div>
        </div>

        {/* Estatísticas High-End */}
        <div className="z-10 mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`relative overflow-hidden rounded-2xl p-5 border backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1 ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 opacity-20 blur-2xl" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <h3 className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Em Andamento</h3>
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                <Clock size={24} />
              </div>
            </div>
            <div className="relative z-10">
              <span className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{emManutencao.length}</span>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-2xl p-5 border backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1 ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-400 opacity-20 blur-2xl" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <h3 className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Finalizados</h3>
              <div className="p-2 rounded-xl bg-gradient-to-br from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/20">
                <CheckCircle size={24} />
              </div>
            </div>
            <div className="relative z-10">
              <span className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{qtdFinalizada}</span>
            </div>
          </div>
        </div>

        {/* Global Search & Filters integrated in header */}
        <div className="z-10 w-full flex flex-col lg:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all h-[58px] ${isDark
              ? 'bg-slate-900/90 border-amber-500/30 text-white focus-within:border-amber-400 focus-within:shadow-amber-500/20'
              : 'bg-white/90 border-slate-300 text-slate-800 focus-within:border-amber-500 focus-within:shadow-amber-500/10'
              }`}>
              <Search size={22} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
              <input
                type="text"
                placeholder="Pesquisar por equipamento, marca, ticket..."
                value={buscaGeral}
                onChange={e => setBuscaGeral(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-lg placeholder-opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <AnimatePresence>
              <motion.select
                key="tipo"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                value={filtroTipo}
                onChange={e => { setFiltroTipo(e.target.value); setFiltroMarca(''); setFiltroModelo(''); }}
                className={`px-4 py-3.5 rounded-2xl border backdrop-blur-xl font-medium transition-all cursor-pointer outline-none focus:ring-2 focus:ring-amber-500/50 h-[58px] ${isDark ? 'bg-slate-900/90 border-amber-500/30 text-white hover:border-amber-500/50' : 'bg-white/90 border-slate-300 text-slate-800 hover:border-amber-500/50'}`}
              >
                <option value="">Todos os Tipos</option>
                {opcoesTipo.map(([t, qtd]) => <option key={t} value={t}>{t} ({qtd})</option>)}
              </motion.select>

              {filtroTipo && (
                <motion.select
                  key="marca"
                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -10 }}
                  value={filtroMarca}
                  onChange={e => { setFiltroMarca(e.target.value); setFiltroModelo(''); }}
                  className={`px-4 py-3.5 rounded-2xl border backdrop-blur-xl font-medium transition-all cursor-pointer outline-none focus:ring-2 focus:ring-amber-500/50 h-[58px] ${isDark ? 'bg-slate-900/90 border-amber-500/30 text-amber-200 hover:border-amber-500/50' : 'bg-amber-50/90 border-amber-300 text-amber-800 hover:border-amber-500/50'}`}
                >
                  <option value="">Todas as Marcas</option>
                  {opcoesMarca.map(([m, qtd]) => <option key={m} value={m}>{m} ({qtd})</option>)}
                </motion.select>
              )}

              {filtroMarca && (
                <motion.select
                  key="modelo"
                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -10 }}
                  value={filtroModelo}
                  onChange={e => setFiltroModelo(e.target.value)}
                  className={`px-4 py-3.5 rounded-2xl border backdrop-blur-xl font-medium transition-all cursor-pointer outline-none focus:ring-2 focus:ring-amber-500/50 h-[58px] ${isDark ? 'bg-slate-900/90 border-amber-500/30 text-amber-200 hover:border-amber-500/50' : 'bg-amber-50/90 border-amber-300 text-amber-800 hover:border-amber-500/50'}`}
                >
                  <option value="">Todos os Modelos</option>
                  {opcoesModelo.map(([m, qtd]) => <option key={m} value={m}>{m} ({qtd})</option>)}
                </motion.select>
              )}
            </AnimatePresence>
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
      ) : filtrados.length === 0 ? (
        <div className={`flex flex-col items-center justify-center p-16 text-center rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-900/40 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
          <Search size={64} className="mx-auto mb-6 text-amber-500 opacity-80" />
          <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Nenhum resultado</h3>
          <p className="text-lg opacity-70">Sua pesquisa ou filtro não encontrou equipamentos.</p>
        </div>
      ) : (
        <div className={`w-full flex flex-col rounded-2xl overflow-hidden border shadow-sm ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          {filtrados.map((item, index) => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className={`flex flex-col border-b last:border-b-0 transition-colors duration-300 ${isExpanded ? (isDark ? 'bg-slate-800/40' : 'bg-slate-50/70') : ''} ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                
                {/* Row Header - High Typography */}
                <div
                  className={`px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between cursor-pointer group transition-all duration-200 ${isExpanded ? (isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]') : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  {/* Célula 1: Avatar + Título (Equipamento & Ticket) */}
                  <div className="flex items-center gap-5 w-full sm:w-1/2 flex-shrink-0">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-[14px] flex items-center justify-center overflow-hidden border transition-transform duration-500 group-hover:scale-105 ${isDark ? 'border-slate-700/60 bg-slate-800' : 'border-slate-200/80 bg-white shadow-sm'}`}>
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt="Img" className="w-full h-full object-cover" />
                      ) : (
                        <Wrench className="text-slate-400 opacity-60" size={20} />
                      )}
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <h3 className="flex items-center flex-wrap gap-x-4 gap-y-1 mb-1.5 truncate">
                        <span className={`text-lg sm:text-[22px] font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.tipo}
                        </span>
                        <span className={`text-sm sm:text-base font-semibold pt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.marca} {item.modelo ? `- ${item.modelo}` : ''}
                        </span>
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'bg-slate-900/50 text-amber-500 border border-amber-500/20 shadow-sm' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          Em Manutenção
                        </span>
                        <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
                        <span className={`text-sm font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.manutencaoAtual?.ticketId || 'S/TICKET'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Célula 2: Métricas Rápidas (Desktop/Tablet) */}
                  <div className="hidden sm:flex items-center justify-between w-1/2 max-w-md ml-auto">
                    {/* Solicitante */}
                    <div className="flex flex-col flex-1 px-4 border-l border-transparent">
                      <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 opacity-70 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Solicitante</span>
                      <span className={`text-sm font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.manutencaoAtual?.solicitante || 'Não Informado'}</span>
                    </div>

                    {/* Entrada */}
                    <div className="flex flex-col flex-1 px-4 border-l border-transparent">
                      <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 opacity-70 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Recebido em</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        {item.manutencaoAtual?.dataInicio ? new Date(item.manutencaoAtual.dataInicio).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    
                    {/* Caret */}
                    <div className="w-10 flex justify-end flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? (isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800') : (isDark ? 'text-slate-500 group-hover:bg-slate-800/80 group-hover:text-slate-300' : 'text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600')}`}>
                         <ChevronDown size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Caret e infos mobile */}
                  <div className={`sm:hidden mt-4 w-full flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-800/50' : 'border-slate-100'}`}>
                     <div className="flex flex-col">
                        <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 opacity-70 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Solicitante</span>
                        <span className={`text-sm font-semibold truncate max-w-[150px] ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.manutencaoAtual?.solicitante || 'Não Informado'}</span>
                     </div>
                     <div className="flex flex-col text-right">
                        <span className={`text-[10px] uppercase font-bold tracking-widest mb-1 opacity-70 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Entrada</span>
                        <span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{item.manutencaoAtual?.dataInicio ? new Date(item.manutencaoAtual.dataInicio).toLocaleDateString() : 'N/A'}</span>
                     </div>
                  </div>
                </div>

                {/* Expanded Details - Sleek Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-6 pb-6 pt-2">
                        <div className={`p-6 rounded-2xl flex flex-col shadow-inner ${isDark ? 'bg-black/20 border border-slate-800/50' : 'bg-slate-100/50 border border-slate-200/60'}`}>
                          
                          {/* Dados Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 mb-8">
                            <div>
                              <span className={`block text-[9px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Patrimônio / Série</span>
                              <span className={`font-mono text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.patrimonio || item.numeroSerie || 'S/N'}</span>
                            </div>
                            <div>
                              <span className={`block text-[9px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Condição</span>
                              <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.manutencaoAtual?.condicaoBem || 'Não informada'}</span>
                            </div>
                            <div>
                              <span className={`block text-[9px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Vínculo</span>
                              <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.manutencaoAtual?.vinculo || 'N/A'}</span>
                            </div>
                            <div>
                              <span className={`block text-[9px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Téc. Responsável</span>
                              <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.manutencaoAtual?.tecnicoResponsavelNome || 'N/A'}</span>
                            </div>
                            <div className="col-span-2 md:col-span-4">
                              <span className={`flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest mb-2 ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
                                <Wrench size={12} /> Defeito Relatado / Ocorrência
                              </span>
                              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {item.manutencaoAtual?.problema || 'Nenhuma descrição técnica fornecida.'}
                              </p>
                            </div>
                          </div>

                          {/* Actions Horizontal Row */}
                          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button onClick={() => item.manutencaoAtual && imprimirHtml(gerarHtmlFichaManutencao(item, item.manutencaoAtual))} className={`py-2 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-500' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'}`}>
                                <FileText size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} /> Ficha de Manutenção
                              </button>
                              
                              <button onClick={() => item.manutencaoAtual && imprimirHtml(gerarHtmlTermo(item, item.manutencaoAtual))} className={`py-2 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-500' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'}`}>
                                <FileText size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} /> Ordem de Serviço
                              </button>
                            </div>

                            <div className="hidden sm:block flex-1"></div>
                            
                            <button onClick={() => handleOpenConclusao(item)} className={`mt-2 sm:mt-0 py-2.5 px-6 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'}`}>
                              <CheckCircle size={16} /> Concluir
                            </button>
                          </div>
                          
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
