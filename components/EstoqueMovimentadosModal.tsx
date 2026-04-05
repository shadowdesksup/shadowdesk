import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Search, Package, MapPin } from 'lucide-react';
import { EquipamentoEstoque } from '../types';
import EstoqueSidePanel from './EstoqueSidePanel';
import EstoqueItemViewModal from './EstoqueItemViewModal';

interface EstoqueMovimentadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  estoque: EquipamentoEstoque[];
  theme?: 'dark' | 'light';
  onRealocar?: (item: EquipamentoEstoque) => void;
  highlightItemId?: string | null;
}

const EstoqueMovimentadosModal: React.FC<EstoqueMovimentadosModalProps> = ({
  isOpen, onClose, estoque, theme = 'dark', onRealocar, highlightItemId
}) => {
  const isDark = theme === 'dark';
  const [busca, setBusca] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState<EquipamentoEstoque | null>(null);
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  const movimentados = useMemo(() => {
    return estoque.filter(e => e.status === 'TRANSFERIDO');
  }, [estoque]);

  const filtrados = useMemo(() => {
    if (!busca.trim()) return movimentados;
    const lower = busca.toLowerCase();
    return movimentados.filter(e =>
      e.marca.toLowerCase().includes(lower) ||
      e.modelo.toLowerCase().includes(lower) ||
      e.patrimonio?.toLowerCase().includes(lower) ||
      e.numeroSerie?.toLowerCase().includes(lower) ||
      e.detalhes?.localDestinoNome?.toLowerCase().includes(lower) ||
      e.detalhes?.recebedorNome?.toLowerCase().includes(lower) ||
      e.detalhes?.motivoTransferencia?.toLowerCase().includes(lower)
    );
  }, [movimentados, busca]);



  const titleNode = (
    <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <Truck className="text-purple-500" />
      Histórico de Movimentações
    </h2>
  );

  return (
    <>
      <EstoqueSidePanel isOpen={isOpen} onClose={onClose} theme={theme} title={titleNode} width="md:w-[calc(100vw-8rem)] lg:w-[calc(100vw-16rem)] max-w-none">
        <div className="p-6 h-full flex flex-col bg-transparent">

          {/* Header e Busca */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Itens Movimentados / Saídas</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Visualize todos os patrimônios que já deixaram o suporte técnico.</p>
            </div>

            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm transition-all w-full md:w-80 ${isDark
              ? 'bg-slate-900/90 border-slate-700 focus-within:border-purple-500 focus-within:shadow-purple-500/20'
              : 'bg-white border-slate-300 focus-within:border-purple-500 focus-within:shadow-purple-500/10'
              }`}>
              <Search size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              <input
                type="text"
                placeholder="Buscar por marca, modelo, patrimônio..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className={`bg-transparent border-none outline-none w-full text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            <AnimatePresence>
              {filtrados.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-10 text-center rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50 text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                  <Truck size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Nenhuma movimentação encontrada.</p>
                </motion.div>
              ) : (
                filtrados.map((item, index) => {
                  const isHighlighted = item.id === highlightItemId && !clearedIds.has(item.id);
                  return (
                  <motion.div
                    key={item.id}
                    onClick={() => {
                      setItemSelecionado(item);
                      if (isHighlighted) {
                        setClearedIds(prev => new Set(prev).add(item.id));
                      }
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`relative flex flex-row items-start cursor-pointer gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-4 rounded-xl border-b last:border-b-0 transition-all overflow-hidden ${
                      isHighlighted
                      ? (isDark ? 'bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-slate-700/50' : 'bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border-slate-200/50')
                      : (isDark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-200 hover:bg-slate-50')
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] z-10 animate-pulse"></div>
                    )}
                    <div className={`w-10 h-10 mt-1 sm:mt-0 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt="miniatura" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={18} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col md:grid md:grid-cols-5 md:gap-4 w-full">
                      {/* Item Info & Date (Mobile top row) */}
                      <div className="md:col-span-1 flex justify-between items-start w-full">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className={`text-sm font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {item.marca} {item.modelo}
                          </h4>
                          <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-xs mt-0.5 font-mono items-center">
                            {item.patrimonio && <span className={`text-cyan-500 font-medium`}>PT:{item.patrimonio}</span>}
                            {item.numeroSerie && <span className={`text-indigo-400 font-medium`}>NS:{item.numeroSerie}</span>}
                          </div>
                        </div>
                        {/* Mobile Date */}
                        <div className="md:hidden flex-shrink-0">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            {item.detalhes?.dataSaidaTransferencia ? new Date(item.detalhes.dataSaidaTransferencia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--'}
                          </span>
                        </div>
                      </div>

                      {/* Trajeto (Origem -> Destino) */}
                      <div className="md:col-span-1 flex flex-col gap-0.5 mt-2 md:mt-0 text-[10px] sm:text-xs">
                        <div className={`font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <MapPin size={10} className="opacity-50 shrink-0" />
                          <span className="truncate">De: {item.bensAtivos?.alocadoEm || 'Suporte'}</span>
                        </div>
                        <div className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          <MapPin size={10} className="text-purple-500 flex-shrink-0" />
                          <span className="truncate">Para: {item.detalhes?.localDestinoNome || 'Desconhecido'}</span>
                        </div>
                      </div>

                      {/* Info Complementar: Destinatário e Operador */}
                      <div className="grid grid-cols-2 md:col-span-2 gap-2 mt-2 md:mt-0 border-t border-dashed border-slate-700/50 md:border-none pt-2 md:pt-0">
                        {/* Novo Recebedor */}
                        <div className="flex flex-col min-w-0">
                          <div className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Destinatário</div>
                          <div className={`text-[11px] sm:text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className="font-semibold">{item.detalhes?.recebedorNome || 'Não informado'}</span>
                          </div>
                        </div>

                        {/* Movido por (Operador) */}
                        <div className="flex flex-col min-w-0 border-l border-slate-700/50 md:border-none pl-2 md:pl-0">
                          <div className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Movido por</div>
                          <div className={`text-[11px] sm:text-xs truncate ${isDark ? 'text-cyan-400' : 'text-cyan-600'} font-medium`}>
                            {item.detalhes?.usuarioTransferencia || (item.historico && item.historico.length > 0 ? item.historico[item.historico.length - 1].usuarioNome.split(' ')[0] : 'Sistema')}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Date */}
                      <div className="hidden md:flex md:col-span-1 justify-end items-center">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          {item.detalhes?.dataSaidaTransferencia ? new Date(item.detalhes.dataSaidaTransferencia).toLocaleDateString('pt-BR') : 'Data Indisponível'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                 );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </EstoqueSidePanel>

      {/* Modal de Ficha da Unidade */}
      <EstoqueItemViewModal
        isOpen={!!itemSelecionado}
        onClose={() => setItemSelecionado(null)}
        item={itemSelecionado}
        theme={theme}
        onRealocar={(item) => {
          if (onRealocar) {
            onRealocar(item);
            setItemSelecionado(null);
          }
        }}
      />
    </>
  );
};

export default EstoqueMovimentadosModal;
