import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Search, Check, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import Barcode from 'react-barcode';
import EstoqueSidePanel from './EstoqueSidePanel';
import { EquipamentoEstoque } from '../types';

interface EstoquePrintingModalProps {
  isOpen: boolean;
  onClose: () => void;
  estoque: EquipamentoEstoque[];
  theme?: 'dark' | 'light';
}

const EstoquePrintingModal: React.FC<EstoquePrintingModalProps> = ({ 
  isOpen, 
  onClose, 
  estoque,
  theme = 'dark' 
}) => {
  const isDark = theme === 'dark';
  
  const itensDisponiveis = useMemo(() => 
    estoque.filter(e => e.status !== 'DESCARTADO' && e.status !== 'TRANSFERIDO'), 
  [estoque]);

  const [busca, setBusca] = useState('');
  const [filaImpressao, setFilaImpressao] = useState<EquipamentoEstoque[]>([]);

  // Tree Expansion states
  const [expandedTipos, setExpandedTipos] = useState<Record<string, boolean>>({});
  const [expandedSubgrupos, setExpandedSubgrupos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // When search changes, expand all if there's text, otherwise collapse
    if (busca.trim().length > 0) {
      const allTipos: Record<string, boolean> = {};
      const allSubs: Record<string, boolean> = {};
      
      const filtered = itensDisponiveis.filter(e => {
        const lower = busca.toLowerCase();
        return e.patrimonio?.toLowerCase().includes(lower) || 
               e.numeroSerie?.toLowerCase().includes(lower) || 
               e.marca?.toLowerCase().includes(lower) || 
               e.modelo?.toLowerCase().includes(lower) ||
               e.tipo?.toLowerCase().includes(lower);
      });
      
      filtered.forEach(e => {
        const t = e.tipo || 'Outros';
        const s = `${t}-${e.marca || 'Sem Marca'} - ${e.modelo || 'Sem Modelo'}`;
        allTipos[t] = true;
        allSubs[s] = true;
      });
      
      setExpandedTipos(allTipos);
      setExpandedSubgrupos(allSubs);
    }
  }, [busca, itensDisponiveis]);

  const itensFiltrados = useMemo(() => {
    if (!busca) return itensDisponiveis;
    const lower = busca.toLowerCase();
    return itensDisponiveis.filter(e => 
      e.patrimonio?.toLowerCase().includes(lower) || 
      e.numeroSerie?.toLowerCase().includes(lower) || 
      e.marca?.toLowerCase().includes(lower) || 
      e.modelo?.toLowerCase().includes(lower) ||
      e.tipo?.toLowerCase().includes(lower)
    );
  }, [busca, itensDisponiveis]);

  const groupedData = useMemo(() => {
    const groups: Record<string, Record<string, EquipamentoEstoque[]>> = {};
    
    itensFiltrados.forEach(item => {
      const tipo = item.tipo || 'Outros';
      const subgrupo = `${item.marca || 'Sem Marca'} - ${item.modelo || 'Sem Modelo'}`;
      
      if (!groups[tipo]) groups[tipo] = {};
      if (!groups[tipo][subgrupo]) groups[tipo][subgrupo] = [];
      
      groups[tipo][subgrupo].push(item);
    });
    
    // Sort
    const sortedGroups: Record<string, Record<string, EquipamentoEstoque[]>> = {};
    Object.keys(groups).sort().forEach(tipo => {
      sortedGroups[tipo] = {};
      Object.keys(groups[tipo]).sort().forEach(sub => {
        sortedGroups[tipo][sub] = groups[tipo][sub];
      });
    });
    
    return sortedGroups;
  }, [itensFiltrados]);

  const toggleTipo = (tipo: string) => setExpandedTipos(prev => ({ ...prev, [tipo]: !prev[tipo] }));
  const toggleSubgrupo = (sub: string) => setExpandedSubgrupos(prev => ({ ...prev, [sub]: !prev[sub] }));

  const toggleItensNaFila = (itens: EquipamentoEstoque[], forceAdd: boolean) => {
    setFilaImpressao(prev => {
      let novaFila = [...prev];
      if (forceAdd) {
         const itensParaAdicionar = itens.filter(item => !novaFila.some(i => i.id === item.id));
         novaFila = [...novaFila, ...itensParaAdicionar];
      } else {
         const idsParaRemover = new Set(itens.map(i => i.id));
         novaFila = novaFila.filter(i => !idsParaRemover.has(i.id));
      }
      return novaFila;
    });
  };

  const limparFila = () => setFilaImpressao([]);
  const handlePrint = () => window.print();

  const titleNode = (
    <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <Printer className="text-cyan-500" />
      Impressão de Etiquetas (Código de Barras)
    </h2>
  );

  return (
    <EstoqueSidePanel isOpen={isOpen} onClose={onClose} theme={theme} title={titleNode} width="md:w-[calc(100vw-8rem)] lg:w-[calc(100vw-16rem)] max-w-none">
      <div className="flex flex-col lg:flex-row min-h-full h-full bg-transparent">
        
        {/* LADO ESQUERDO: SELEÇÃO DE ITENS (Oculto na impressão) */}
        <div className={`w-full lg:w-1/3 p-6 flex flex-col no-print ${isDark ? 'border-r border-slate-700/50 bg-slate-900/50' : 'border-r border-slate-200 bg-slate-50'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            1. Navegar e Selecionar Equipamentos
          </h3>

          <div className="relative mb-4">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
            <input
              type="text"
              placeholder="Buscar por Patrimônio, Série, Marca, Tipo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6" style={{ maxHeight: 'calc(100vh - 350px)' }}>
            {Object.keys(groupedData).length === 0 ? (
              <div className={`text-center py-8 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Nenhum equipamento encontrado.
              </div>
            ) : (
              Object.entries(groupedData).map(([tipo, subgrupos]) => {
                const allItemsInTipo = Object.values(subgrupos).flat();
                const allInQueue = allItemsInTipo.every(item => filaImpressao.some(i => i.id === item.id));
                const someInQueue = allItemsInTipo.some(item => filaImpressao.some(i => i.id === item.id));

                return (
                  <div key={tipo} className={`mb-3 rounded-xl border overflow-hidden transition-colors ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white shadow-sm'}`}>
                    {/* Header do Tipo */}
                    <div className={`flex items-center justify-between p-3 transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                      <div className="flex-1 flex items-center gap-2 cursor-pointer select-none" onClick={() => toggleTipo(tipo)}>
                        {expandedTipos[tipo] ? <ChevronDown size={16} className={isDark ? "text-cyan-500" : "text-cyan-600"} /> : <ChevronRight size={16} className={isDark ? "text-slate-500" : "text-slate-400"} />}
                        <span className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{tipo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDark ? 'bg-slate-700 text-cyan-400' : 'bg-slate-100 text-cyan-600'}`}>{allItemsInTipo.length}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleItensNaFila(allItemsInTipo, !allInQueue); }}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all border ${
                          allInQueue ? 'bg-cyan-500 border-cyan-500 text-white' : someInQueue ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-500' : isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-400 hover:bg-slate-100'
                        }`}
                        title={allInQueue ? "Remover todos do tipo" : "Adicionar todos do tipo"}
                      >
                        {allInQueue ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    </div>

                    {/* Subgrupos */}
                    <AnimatePresence>
                      {expandedTipos[tipo] && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          {Object.entries(subgrupos).map(([subgrupo, items]) => {
                            const subKey = `${tipo}-${subgrupo}`;
                            const allSubInQueue = items.every(item => filaImpressao.some(i => i.id === item.id));
                            const someSubInQueue = items.some(item => filaImpressao.some(i => i.id === item.id));

                            return (
                              <div key={subKey} className={`border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                {/* Header do Subgrupo */}
                                <div className={`flex items-center justify-between p-2 pl-6 transition-colors ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/80' : 'bg-slate-50/50 hover:bg-slate-100'}`}>
                                  <div className="flex-1 flex items-center gap-2 cursor-pointer select-none" onClick={() => toggleSubgrupo(subKey)}>
                                    {expandedSubgrupos[subKey] ? <ChevronDown size={14} className={isDark ? "text-slate-400" : "text-slate-500"} /> : <ChevronRight size={14} className={isDark ? "text-slate-600" : "text-slate-300"} />}
                                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{subgrupo}</span>
                                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({items.length})</span>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleItensNaFila(items, !allSubInQueue); }}
                                    className={`w-6 h-6 flex items-center justify-center rounded-md transition-all border ${
                                      allSubInQueue ? 'bg-cyan-500 border-cyan-500 text-white' : someSubInQueue ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-500' : isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-slate-300 text-slate-400 hover:bg-slate-100'
                                    }`}
                                  >
                                    {allSubInQueue ? <Check size={12} /> : <Plus size={12} />}
                                  </button>
                                </div>

                                {/* Lista de Itens Individuais */}
                                <AnimatePresence>
                                  {expandedSubgrupos[subKey] && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className={`overflow-hidden border-t border-dashed ${isDark ? 'border-slate-700/50 bg-slate-900/30' : 'border-slate-200 bg-white'}`}>
                                      {items.map(item => {
                                        const inQueue = filaImpressao.some(i => i.id === item.id);
                                        return (
                                          <div key={item.id} className={`flex items-center justify-between p-2 pl-12 border-b last:border-0 border-dashed transition-colors ${isDark ? 'border-slate-700/30 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                                            <div className="flex gap-2 text-[10px] font-mono">
                                              {item.patrimonio 
                                                ? <span className="text-cyan-500 font-bold">PT: {item.patrimonio}</span> 
                                                : item.numeroSerie 
                                                  ? <span className="text-teal-500 font-bold">NS: {item.numeroSerie}</span>
                                                  : <span className="text-amber-500 font-bold">SEM IDENTIFICADOR</span>}
                                            </div>
                                            <button
                                              onClick={() => toggleItensNaFila([item], !inQueue)}
                                              className={`w-5 h-5 flex items-center justify-center rounded transition-all border ${
                                                inQueue ? 'bg-cyan-500 border-cyan-500 text-white' : isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-600 hover:text-white' : 'border-slate-300 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                                              }`}
                                            >
                                              {inQueue ? <Check size={10} /> : <Plus size={10} />}
                                            </button>
                                          </div>
                                        )
                                      })}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>

          <div className={`pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
            <div className="flex justify-between items-center mb-3">
               <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                 Fila de Impressão <span className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full">{filaImpressao.length}</span>
               </h3>
               {filaImpressao.length > 0 && (
                 <button onClick={limparFila} className="text-xs text-red-500 hover:text-red-400 transition-colors font-bold">
                   Esvaziar fila
                 </button>
               )}
            </div>

            <button
               onClick={handlePrint}
               disabled={filaImpressao.length === 0}
               className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                 filaImpressao.length === 0
                   ? isDark ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                   : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/25 active:scale-[0.98]'
               }`}
            >
               <Printer size={18} />
               Imprimir Folha A4
            </button>
          </div>
        </div>

        {/* LADO DIREITO: PREVIEW A4 (Impresso de fato via @media print) */}
        <div className={`w-full lg:w-2/3 p-6 overflow-y-auto flex justify-center custom-scrollbar ${isDark ? 'bg-[#0f172a]' : 'bg-slate-100'}`}>
          <div className="a4-preview-container print-only-container">
            <div className={`w-[210mm] min-h-[297mm] mx-auto p-[10mm] shadow-2xl relative print:shadow-none print:w-auto print:min-h-auto print:p-0 print:m-0 ${
              isDark ? 'bg-slate-800' : 'bg-white'
            }`}>
              
              {filaImpressao.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 text-center pt-32">
                  <Printer size={64} className="mb-4" />
                  <p className="text-xl font-bold">Nenhuma etiqueta na fila.</p>
                  <p className="text-sm">Selecione pastas inteiras ou itens individuais ao lado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-[4mm] print:grid-cols-4 print:gap-[2mm]">
                  {filaImpressao.map(item => (
                    <div 
                      key={item.id} 
                      className={`flex flex-col items-center justify-center border border-dashed rounded p-2 text-center break-inside-avoid print:border-solid ${
                        isDark ? 'border-slate-600 bg-slate-700/50' : 'border-slate-300 bg-white'
                      }`}
                      style={{ height: '35mm' }}
                    >
                      <div className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                        SD-ID INTERNO
                      </div>
                      <div className="bg-white rounded p-1 w-full flex justify-center text-black">
                        <Barcode 
                          value={`SD-${item.id.substring(0,8).toUpperCase()}`} 
                          height={20} 
                          width={1.2}
                          fontSize={10}
                          margin={0}
                          displayValue={true}
                          background="transparent"
                        />
                      </div>
                      <div className={`text-[8px] font-bold mt-1 tracking-wider truncate w-full px-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        {item.patrimonio && item.patrimonio !== 'Sem informação'
                          ? `PT: ${item.patrimonio}`
                          : item.numeroSerie && item.numeroSerie !== 'Sem informação'
                            ? `S/N: ${item.numeroSerie}`
                            : 'S/ REGISTRO'}
                      </div>
                      <div className={`text-[7px] truncate w-full px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.marca} {item.modelo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only-container, .print-only-container * {
            visibility: visible;
          }
          .print-only-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}} />
    </EstoqueSidePanel>
  );
};

export default EstoquePrintingModal;
