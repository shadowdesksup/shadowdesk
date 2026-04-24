import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Search, CheckCircle, Package, MapPin, X, ArrowRight, Plus, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { EquipamentoEstoque, TipoEquipamento } from '../types';
import EstoqueSidePanel from './EstoqueSidePanel';
import { listarTiposEquipamento } from '../firebase/tiposEquipamento';
import { listarOrigensEquipamento, OrigemEquipamento } from '../firebase/origensEquipamento';
import { listarVinculosEquipamento, VinculoEquipamento } from '../firebase/vinculosEquipamento';
import { useAuth } from '../hooks/useAuth';

interface EstoqueMovimentacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  estoqueAtivo: EquipamentoEstoque[];
  theme?: 'dark' | 'light';
  onAbreGerenciarOrigens?: () => void;
  onAbreGerenciarVinculos?: () => void;
  preSelectedItem?: EquipamentoEstoque | null;
  onSuccess?: (id: string) => void;
  onAtualizarEquipamento: (id: string, dados: Partial<EquipamentoEstoque>) => Promise<void>;
}

const EstoqueMovimentacaoModal: React.FC<EstoqueMovimentacaoModalProps> = ({
  isOpen, onClose, estoqueAtivo, theme = 'dark', onAbreGerenciarOrigens, onAbreGerenciarVinculos, preSelectedItem, onSuccess, onAtualizarEquipamento
}) => {
  const isDark = theme === 'dark';
  const { usuario, dadosUsuario } = useAuth();

  // Pickers and lists
  const [tiposBanco, setTiposBanco] = useState<TipoEquipamento[]>([]);
  const [locaisBanco, setLocaisBanco] = useState<OrigemEquipamento[]>([]);
  const [vinculosBanco, setVinculosBanco] = useState<VinculoEquipamento[]>([]);

  // Local state for Step 1
  const [tipoSelecionadoId, setTipoSelecionadoId] = useState<string>('');

  // Local state for Step 2
  const [itemSelecionado, setItemSelecionado] = useState<EquipamentoEstoque | null>(null);
  const [buscaItem, setBuscaItem] = useState('');

  // Local state for Step 3 (Form)
  const [localDestinoNome, setLocalDestinoNome] = useState('');
  const [showLocaisDropdown, setShowLocaisDropdown] = useState(false);
  const [recebedorNome, setRecebedorNome] = useState('');
  const [vinculoDestinoNome, setVinculoDestinoNome] = useState('');
  const [showVinculosDropdown, setShowVinculosDropdown] = useState(false);
  const [dataSaida, setDataSaida] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');

  const [focusedLocalIndex, setFocusedLocalIndex] = useState(-1);
  const [focusedVinculoIndex, setFocusedVinculoIndex] = useState(-1);

  const locaisFilter = localDestinoNome.trim() === '' || locaisBanco.some(l => l.nome.toLowerCase() === localDestinoNome.trim().toLowerCase())
    ? locaisBanco
    : locaisBanco.filter(l => l.nome.toLowerCase().includes(localDestinoNome.toLowerCase()));
  const vinculosFilter = vinculoDestinoNome.trim() === '' || vinculosBanco.some(v => v.nome.toLowerCase() === vinculoDestinoNome.trim().toLowerCase())
    ? vinculosBanco
    : vinculosBanco.filter(v => v.nome.toLowerCase().includes(vinculoDestinoNome.toLowerCase()));

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      carregarTipos();
      carregarLocais();
      carregarVinculos();

      // Reset state
      setTipoSelecionadoId('');
      setItemSelecionado(null);
      setBuscaItem('');
      setLocalDestinoNome('');
      setRecebedorNome('');
      setVinculoDestinoNome('');
      setDataSaida(new Date().toISOString().split('T')[0]);
      setMotivo('');
      setErro('');
    }
  }, [isOpen]);

  // When tiposBanco loads and we have a preSelectedItem, auto-select its tipo and the item itself
  useEffect(() => {
    if (preSelectedItem && tiposBanco.length > 0) {
      const tipoMatch = tiposBanco.find(t => t.nome === preSelectedItem.tipo);
      if (tipoMatch) setTipoSelecionadoId(tipoMatch.id);
      setItemSelecionado(preSelectedItem);
      // Auto-expand the matching subgroup so the item is visible
      const subgrupo = `${preSelectedItem.marca || 'Sem Marca'} - ${preSelectedItem.modelo || 'Sem Modelo'}`;
      setExpandedMovSubs({ [subgrupo]: true });
    }
  }, [preSelectedItem, tiposBanco]);

  const carregarTipos = async () => {
    try {
      const res = await listarTiposEquipamento();
      // Ensure alphabetical ordering
      setTiposBanco(res.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) { }
  };
  const carregarLocais = async () => {
    try {
      const res = await listarOrigensEquipamento();
      setLocaisBanco(res.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) { }
  };
  const carregarVinculos = async () => {
    try {
      const res = await listarVinculosEquipamento();
      setVinculosBanco(res.sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) { }
  };

  // Derived active items based on Type selection
  const tipoSelecionadoObj = tiposBanco.find(t => t.id === tipoSelecionadoId);
  const equipamentosDisponiveis = useMemo(() => {
    if (!tipoSelecionadoObj) return [];
    return estoqueAtivo.filter(e =>
      e.tipo === tipoSelecionadoObj.nome &&
      e.status !== 'TRANSFERIDO' &&
      e.status !== 'DESCARTADO'
    );
  }, [estoqueAtivo, tipoSelecionadoObj]);

  const listToSelect = useMemo(() => {
    if (!buscaItem.trim()) return equipamentosDisponiveis;
    const lower = buscaItem.toLowerCase();
    return equipamentosDisponiveis.filter(e =>
      e.patrimonio?.toLowerCase().includes(lower) ||
      e.numeroSerie?.toLowerCase().includes(lower) ||
      e.modelo?.toLowerCase().includes(lower) ||
      e.marca?.toLowerCase().includes(lower)
    );
  }, [equipamentosDisponiveis, buscaItem]);

  const listToSelectGrouped = useMemo<Record<string, EquipamentoEstoque[]>>(() => {
    const groups: Record<string, EquipamentoEstoque[]> = {};
    listToSelect.forEach(equip => {
      const sub = `${equip.marca || 'Sem Marca'} - ${equip.modelo || 'Sem Modelo'}`;
      if (!groups[sub]) groups[sub] = [];
      groups[sub].push(equip);
    });
    const sorted: Record<string, EquipamentoEstoque[]> = {};
    Object.keys(groups).sort().forEach(k => sorted[k] = groups[k]);
    return sorted;
  }, [listToSelect]);

  const [expandedMovSubs, setExpandedMovSubs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (buscaItem.trim().length > 0) {
      const allOpen: Record<string, boolean> = {};
      Object.keys(listToSelectGrouped).forEach(k => { allOpen[k] = true; });
      setExpandedMovSubs(allOpen);
    } else if (!preSelectedItem) {
      // Only collapse if there's no pre-selected item keeping a subgroup open
      setExpandedMovSubs({});
    }
  }, [listToSelectGrouped, buscaItem, preSelectedItem]);

  const toggleMovSub = (sub: string) => setExpandedMovSubs(p => ({ ...p, [sub]: !p[sub] }));

  const handleSalvarTransferencia = async () => {
    setErro('');
    if (!itemSelecionado) return setErro('Selecione um equipamento primeiro.');
    if (!localDestinoNome.trim()) return setErro('Informe o Local de Destinatário.');
    if (!recebedorNome.trim()) return setErro('Informe o Destinatário.');
    if (!motivo.trim()) return setErro('Informe o Motivo da Transferência para gerar o laudo futuramente.');

    setSalvando(true);
    try {
      const nomeUser = dadosUsuario?.nomeCompleto || usuario?.email || 'Sistema';
      const destinoObj = locaisBanco.find(l => l.nome.toLowerCase() === localDestinoNome.trim().toLowerCase());
      const localNome = destinoObj?.nome || localDestinoNome.trim();
      const localId = destinoObj?.id || '';
      const vinculoObj = vinculosBanco.find(v => v.nome.toLowerCase() === vinculoDestinoNome.trim().toLowerCase());
      const vinculoNome = vinculoObj?.nome || vinculoDestinoNome.trim();

      await onAtualizarEquipamento(itemSelecionado.id, {
        status: 'TRANSFERIDO',
        dataSaida: new Date(dataSaida).toISOString(),
        detalhes: {
          ...itemSelecionado.detalhes,
          localDestinoId: localId,
          localDestinoNome: localNome,
          recebedorNome,
          vinculoDestino: vinculoNome,
          dataSaidaTransferencia: new Date(dataSaida).toISOString(),
          motivoTransferencia: motivo
        },
        historico: [
          ...(itemSelecionado.historico || []),
          {
            acao: `Transferido definitivamente para: ${localNome} (Resp: ${recebedorNome}${vinculoNome ? ' - ' + vinculoNome : ''}).\nMotivo: ${motivo}`,
            data: new Date().toISOString(),
            usuarioId: usuario?.uid || '',
            usuarioNome: nomeUser
          }
        ]
      });
      if (onSuccess) onSuccess(itemSelecionado.id);
      onClose();
    } catch (err) {
      console.error(err);
      setErro('Ocorreu um erro ao processar a movimentação.');
    } finally {
      setSalvando(false);
    }
  };

  const titleNode = (
    <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <Truck className="text-cyan-500" />
      Movimentação de Patrimônio / Saída
    </h2>
  );

  return (
    <EstoqueSidePanel isOpen={isOpen} onClose={onClose} theme={theme} title={titleNode} width="md:w-[calc(100vw-8rem)] lg:w-[calc(100vw-16rem)] max-w-none">
      <div className="flex flex-col lg:flex-row lg:h-full overflow-y-auto lg:overflow-hidden bg-transparent">

        {/* Painel Esquerdo: Seleção do Item */}
        <div className={`w-full lg:w-1/2 p-4 sm:p-6 lg:overflow-y-auto custom-scrollbar ${isDark ? 'border-b lg:border-b-0 lg:border-r border-slate-700/50' : 'border-b lg:border-b-0 lg:border-r border-slate-200'}`}>

          {/* Grid de Tipos de Equipamentos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {tiposBanco.map(tipo => {
              const contagem = estoqueAtivo.filter(e => e.tipo === tipo.nome && e.status !== 'TRANSFERIDO' && e.status !== 'DESCARTADO').length;

              if (contagem === 0) return null;

              return (
                <button
                  key={tipo.id}
                  disabled={contagem === 0}
                  onClick={() => { setTipoSelecionadoId(tipo.id); setItemSelecionado(null); }}
                  className={`flex justify-between items-center px-4 py-3 rounded-xl border text-left transition-all ${tipoSelecionadoId === tipo.id
                    ? (isDark ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-cyan-500 border-cyan-400 text-white shadow-md')
                    : contagem === 0
                      ? (isDark ? 'bg-slate-800/30 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed')
                      : (isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:border-cyan-500')
                    }`}
                >
                  <span className="font-medium text-sm truncate">{tipo.nome}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tipoSelecionadoId === tipo.id ? 'bg-white/20 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                    }`}>{contagem}</span>
                </button>
              )
            })}
          </div>

          <AnimatePresence>
            {tipoSelecionadoObj && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Selecione a Unidade
                  </h3>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                    <Search size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                    <input type="text" placeholder="Buscar (Patrim.)" value={buscaItem} onChange={e => setBuscaItem(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all" />
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.keys(listToSelectGrouped).length === 0 ? (
                    <div className={`p-6 text-center text-sm font-medium rounded-xl border border-dashed ${isDark ? 'text-slate-500 border-slate-700' : 'text-slate-400 border-slate-300'}`}>
                      Nenhuma unidade encontrada.
                    </div>
                  ) : (
                    Object.entries(listToSelectGrouped).map(([subgrupo, equips]: [string, EquipamentoEstoque[]]) => (
                      <div key={subgrupo} className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
                        {/* Header do Subgrupo */}
                        <div
                          className={`flex items-center gap-2 p-3 cursor-pointer select-none transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}
                          onClick={() => toggleMovSub(subgrupo)}
                        >
                          {expandedMovSubs[subgrupo] ? <ChevronDown size={14} className={isDark ? "text-cyan-500" : "text-cyan-600"} /> : <ChevronRight size={14} className={isDark ? "text-slate-500" : "text-slate-400"} />}
                          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{subgrupo}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-slate-700 text-cyan-400' : 'bg-slate-100 text-cyan-600'}`}>{equips.length}</span>
                        </div>

                        {/* Itens do Subgrupo */}
                        <AnimatePresence>
                          {expandedMovSubs[subgrupo] && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className={`p-2 space-y-2 border-t border-dashed ${isDark ? 'border-slate-700/50 bg-slate-900/30' : 'border-slate-200 bg-slate-50'}`}>
                                {equips.map(equip => {
                                  const isSelected = itemSelecionado?.id === equip.id;
                                  return (
                                    <div
                                      key={equip.id}
                                      onClick={() => setItemSelecionado(equip)}
                                      className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                                        ? (isDark ? 'bg-cyan-500/10 border-cyan-500' : 'bg-cyan-50 border-cyan-400')
                                        : (isDark ? 'bg-slate-800/80 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-slate-300')
                                        }`}
                                    >
                                      <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                        {equip.imagemUrl ? (
                                          <img src={equip.imagemUrl} alt="miniatura" className="w-full h-full object-cover" />
                                        ) : (
                                          <Package size={18} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0 flex items-center justify-between">
                                        <div className={`flex gap-3 text-xs font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                          {equip.patrimonio
                                            ? <span className="flex items-center gap-1 text-cyan-500">PT: {equip.patrimonio}</span>
                                            : equip.numeroSerie
                                              ? <span className="flex items-center gap-1 text-teal-500">NS: {equip.numeroSerie}</span>
                                              : <span className="flex items-center gap-1 text-amber-500">S/ REGISTRO</span>}
                                        </div>
                                      </div>

                                      <div className="px-2 flex-shrink-0 text-cyan-500">
                                        {isSelected ? <CheckCircle size={20} className="fill-cyan-500/20" /> : <div className={`w-5 h-5 rounded-full border-2 ${isDark ? 'border-slate-600' : 'border-slate-300'}`} />}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Painel Direito: Formulário */}
        <div className={`w-full lg:w-1/2 p-4 md:p-6 bg-transparent flex flex-col ${!itemSelecionado ? 'opacity-50 items-center justify-center' : ''}`}>
          {!itemSelecionado ? (
            <div className="text-center">
              <Truck size={64} className={`mx-auto mb-4 opacity-20 ${isDark ? 'text-white' : 'text-slate-900'}`} />
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>Aguardando Seleção</h2>
              <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Selecione um equipamento na lista ao lado para iniciar a movimentação.</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className={`w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar`}>

                {/* Item Review Banner */}
                <div className={`flex items-center gap-4 p-4 mb-6 rounded-2xl border ${isDark ? 'bg-slate-800/95 border-slate-700/50 shadow-md' : 'bg-slate-100 border-slate-200'}`}>
                  {itemSelecionado.imagemUrl ? (
                    <img src={itemSelecionado.imagemUrl} alt="Preview" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${isDark ? 'bg-slate-900 border border-slate-700/50' : 'bg-white border border-slate-200'}`}>
                      <Package size={22} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={`text-[10px] uppercase font-bold tracking-widest mb-0.5 ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`}>
                      Equipamento Selecionado
                    </div>
                    <h3 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {itemSelecionado.marca} {itemSelecionado.modelo}
                    </h3>
                    <div className={`flex flex-wrap items-center gap-4 mt-2 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className={`font-mono px-2 py-0.5 rounded-md text-[11px] font-bold ${isDark ? 'bg-black/40 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                        {itemSelecionado.patrimonio ? `PT: ${itemSelecionado.patrimonio}` : itemSelecionado.numeroSerie ? `S/N: ${itemSelecionado.numeroSerie}` : 'S/ Registro'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        {itemSelecionado.bensAtivos?.alocadoEm || 'Sala de Suporte'}
                      </span>
                      {itemSelecionado.bensAtivos?.condicao && (
                        <span className="flex items-center gap-1.5">
                          <Sparkles size={13} className={isDark ? 'text-cyan-600' : 'text-amber-500'} />
                          {itemSelecionado.bensAtivos.condicao}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5 flex-1 flex flex-col">
                  {/* Linha 1: Local de Destino e Destinatário */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Local de Destino */}
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Local de Destino</label>
                      <div className="flex gap-2 relative">
                        <div className="relative flex-1">
                          <input
                            type="text" value={localDestinoNome} placeholder="Ex: ADM - Diretoria"
                            onChange={e => { setLocalDestinoNome(e.target.value); setShowLocaisDropdown(true); setFocusedLocalIndex(-1); }}
                            onFocus={() => { carregarLocais(); setShowLocaisDropdown(true); setFocusedLocalIndex(-1); }}
                            onClick={() => { setShowLocaisDropdown(true); setFocusedLocalIndex(-1); }}
                            onBlur={() => setTimeout(() => setShowLocaisDropdown(false), 200)}
                            onKeyDown={e => {
                              if (!showLocaisDropdown) { if (e.key === 'ArrowDown') { e.preventDefault(); setShowLocaisDropdown(true); } return; }
                              if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedLocalIndex(i => Math.min(i + 1, locaisFilter.length - 1)); }
                              else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedLocalIndex(i => Math.max(i - 1, 0)); }
                              else if (e.key === 'Enter') { e.preventDefault(); if (focusedLocalIndex >= 0 && locaisFilter[focusedLocalIndex]) { setLocalDestinoNome(locaisFilter[focusedLocalIndex].nome); setShowLocaisDropdown(false); } }
                              else if (e.key === 'Escape') setShowLocaisDropdown(false);
                            }}
                            className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'} border`}
                          />
                          {showLocaisDropdown && locaisFilter.length > 0 && (
                            <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-2xl max-h-48 overflow-y-auto ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'} custom-scrollbar`}>
                              {locaisFilter.map((l, idx) => (
                                <div key={l.id} onMouseDown={() => { setLocalDestinoNome(l.nome); setShowLocaisDropdown(false); }}
                                  className={`px-4 py-3 cursor-pointer ${focusedLocalIndex === idx ? (isDark ? 'bg-slate-700 text-white' : 'bg-cyan-50 text-cyan-700') : (isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 text-slate-700')}`}>
                                  {l.nome}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={onAbreGerenciarOrigens} title="Gerenciar Locais" className={`w-12 shrink-0 rounded-xl border flex items-center justify-center transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-cyan-600 hover:bg-slate-200'}`}>
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Destinatário */}
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Destinatário</label>
                      <input
                        type="text" placeholder="Nome Completo..."
                        value={recebedorNome} onChange={e => setRecebedorNome(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'} border`}
                      />
                    </div>
                  </div>

                  {/* Linha 2: Vínculo e Data de Saída */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Vínculo */}
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Vínculo</label>
                      <div className="flex gap-2 relative">
                        <div className="relative flex-1">
                          <input
                            type="text" value={vinculoDestinoNome} placeholder="(Opcional)"
                            onChange={e => { setVinculoDestinoNome(e.target.value); setShowVinculosDropdown(true); setFocusedVinculoIndex(-1); }}
                            onFocus={() => { carregarVinculos(); setShowVinculosDropdown(true); setFocusedVinculoIndex(-1); }}
                            onClick={() => { setShowVinculosDropdown(true); setFocusedVinculoIndex(-1); }}
                            onBlur={() => setTimeout(() => setShowVinculosDropdown(false), 200)}
                            onKeyDown={e => {
                              if (!showVinculosDropdown) { if (e.key === 'ArrowDown') { e.preventDefault(); setShowVinculosDropdown(true); } return; }
                              if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedVinculoIndex(i => Math.min(i + 1, vinculosFilter.length - 1)); }
                              else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedVinculoIndex(i => Math.max(i - 1, 0)); }
                              else if (e.key === 'Enter') { e.preventDefault(); if (focusedVinculoIndex >= 0 && vinculosFilter[focusedVinculoIndex]) { setVinculoDestinoNome(vinculosFilter[focusedVinculoIndex].nome); setShowVinculosDropdown(false); } }
                              else if (e.key === 'Escape') setShowVinculosDropdown(false);
                            }}
                            className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'} border`}
                          />
                          {showVinculosDropdown && vinculosFilter.length > 0 && (
                            <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-2xl max-h-48 overflow-y-auto ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'} custom-scrollbar`}>
                              {vinculosFilter.map((v, idx) => (
                                <div key={v.id} onMouseDown={() => { setVinculoDestinoNome(v.nome); setShowVinculosDropdown(false); }}
                                  className={`px-4 py-3 cursor-pointer ${focusedVinculoIndex === idx ? (isDark ? 'bg-slate-700 text-white' : 'bg-cyan-50 text-cyan-700') : (isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 text-slate-700')}`}>
                                  {v.nome}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={onAbreGerenciarVinculos} title="Gerenciar Vínculos" className={`w-12 shrink-0 rounded-xl border flex items-center justify-center transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-cyan-600 hover:bg-slate-200'}`}>
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Data de Saída */}
                    <div>
                      <label className={`block text-xs font-bold uppercase mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Data de Saída</label>
                      <input
                        type="date"
                        value={dataSaida} onChange={e => setDataSaida(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'} border`}
                      />
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="flex-1 flex flex-col min-h-[120px]">
                    <label className={`block text-xs font-bold uppercase mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span>Motivo da Transferência</span>
                      <span className="text-[10px] lowercase font-normal italic">(Para o Laudo Futuro)</span>
                    </label>
                    <textarea
                      placeholder="Descreva detalhadamente o motivo que ocasionou a saída deste patrimônio do serviço de suporte técnico..."
                      value={motivo} onChange={e => setMotivo(e.target.value)}
                      className={`w-full flex-1 rounded-xl px-4 py-3 outline-none resize-none transition-all custom-scrollbar ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500' : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-cyan-500'} border`}
                    />
                  </div>

                  {erro && <div className="text-red-500 font-bold text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center">{erro}</div>}

                  <button
                    onClick={handleSalvarTransferencia}
                    disabled={salvando}
                    className={`w-full mt-4 flex justify-center items-center gap-3 px-6 py-4 rounded-xl text-white font-bold text-lg transition-all ${salvando ? 'bg-cyan-600 opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:-translate-y-1'
                      }`}
                  >
                    {salvando ? (
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Concluir Saída / Movimentação
                        <ArrowRight size={22} />
                      </>
                    )}
                  </button>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EstoqueSidePanel>
  );
};

export default React.memo(EstoqueMovimentacaoModal);


