import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Edit, Trash2, ArrowRightLeft, PackageX, Image as ImageIcon, Search } from 'lucide-react';
import { EquipamentoEstoque, StatusEquipamento } from '../types';

interface EstoqueListProps {
  estoque: EquipamentoEstoque[];
  theme?: 'dark' | 'light';
  onEditar: (item: EquipamentoEstoque) => void;
  onDeletar: (id: string) => void;
  onTransferir: (item: EquipamentoEstoque) => void;
  onDescartar: (item: EquipamentoEstoque) => void;
}

// Agrupamento inteligente
const agruparEstoque = (itens: EquipamentoEstoque[]) => {
  const grupos = new Map<string, EquipamentoEstoque[]>();
  itens.forEach(item => {
    // Ignora agrupamento de itens que já saíram do suporte, se desejado, 
    // mas vamos agrupar todos para manter a consistência de catálogo
    const key = `${item.tipo}|${item.marca}|${item.modelo}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(item);
  });
  
  return Array.from(grupos.entries()).map(([key, list]) => {
    // Para miniatura, pega a primeira imagem marcada como principal, ou fallback
    const itemPrincipal = list.find(i => i.isImagemPrincipal && i.imagemUrl);
    const imagemRef = itemPrincipal ? itemPrincipal.imagemUrl : list.find(i => i.imagemUrl)?.imagemUrl;
    return {
      id: key,
      tipo: list[0].tipo,
      marca: list[0].marca,
      modelo: list[0].modelo,
      imagemUrl: imagemRef,
      itens: list, // Ordenados por status ou data
      quantidade: list.filter(i => i.status !== 'DESCARTADO' && i.status !== 'DESCARTE' && i.status !== 'TRANSFERIDO').length,
      total: list.length
    };
  }).sort((a, b) => a.tipo.localeCompare(b.tipo));
};

const getStatusColor = (status: StatusEquipamento) => {
  switch (status) {
    case 'BENS_ATIVOS': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
    case 'DISPONIVEL': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
    case 'AVALIACAO': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
    case 'MANUTENCAO': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    case 'DESCARTE': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
    case 'DESCARTADO': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
    case 'TRANSFERIDO': return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
    default: return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
  }
};

const EstoqueList: React.FC<EstoqueListProps> = ({ estoque, theme = 'dark', onEditar, onDeletar, onTransferir, onDescartar }) => {
  const isDark = theme === 'dark';
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');

  // Filtro
  const estoqueFiltrado = useMemo(() => {
    if (!busca) return estoque;
    const l = busca.toLowerCase();
    return estoque.filter(i => 
      i.tipo.toLowerCase().includes(l) ||
      i.marca.toLowerCase().includes(l) ||
      i.modelo.toLowerCase().includes(l) ||
      (i.patrimonio && i.patrimonio.toLowerCase().includes(l)) ||
      (i.numeroSerie && i.numeroSerie.toLowerCase().includes(l)) ||
      (i.numeroProcesso && i.numeroProcesso.toLowerCase().includes(l))
    );
  }, [estoque, busca]);

  const grupos = useMemo(() => agruparEstoque(estoqueFiltrado), [estoqueFiltrado]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Busca */}
      <div className={`flex items-center gap-3 px-4 py-2 flex-1 rounded-xl border backdrop-blur-md shadow-lg transition-colors ${
          isDark 
            ? 'bg-slate-900/60 border-white/10 text-white focus-within:border-cyan-500/50 focus-within:bg-slate-800/80' 
            : 'bg-white border-slate-200 text-slate-800 focus-within:border-cyan-500 focus-within:shadow-xl'
        }`}
      >
        <Search size={20} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
        <input 
          type="text"
          placeholder="Buscar por tipo, modelo, série, patrimônio..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="bg-transparent border-none outline-none w-full placeholder-opacity-50"
        />
      </div>

      {grupos.length === 0 ? (
        <div className={`p-8 text-center rounded-xl border backdrop-blur-md ${isDark ? 'bg-slate-900/60 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
          Nenhum equipamento encontrado.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {grupos.map(grupo => {
            const isExpanded = expandedGroups.has(grupo.id);
            return (
              <div key={grupo.id} className={`rounded-xl border backdrop-blur-md overflow-hidden transition-all ${
                isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {/* Linha Mãe (O Grupo) */}
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? (isDark ? 'bg-slate-800/60' : 'bg-slate-50') : 'hover:bg-slate-800/20'}`}
                  onClick={() => toggleGroup(grupo.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center overflow-hidden flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'}`}>
                      {grupo.imagemUrl ? (
                         <img src={grupo.imagemUrl} alt={grupo.modelo} className="w-full h-full object-cover" />
                      ) : (
                         <ImageIcon className="text-slate-400 opacity-50" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {grupo.tipo} {grupo.marca}
                      </h3>
                      <p className={isDark ? 'text-cyan-400 font-medium text-sm' : 'text-cyan-600 font-medium text-sm'}>
                        {grupo.modelo}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <div className={`text-sm tracking-wide uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Em Suporte</div>
                      <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{grupo.quantidade} <span className="text-sm font-normal opacity-50">/ {grupo.total} total</span></div>
                    </div>
                    <div className={`p-1.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                  </div>
                </div>

                {/* Linhas Filhas (Itens individuais) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`border-t ${isDark ? 'border-slate-800/50 bg-slate-900/80' : 'border-slate-200 bg-slate-50/50'}`}
                    >
                      <div className="p-2 sm:p-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead>
                            <tr className={`text-xs uppercase tracking-wider ${isDark ? 'text-slate-500 border-b border-slate-800' : 'text-slate-500 border-b border-slate-200'}`}>
                              <th className="pb-3 pl-2 font-semibold text-center w-16">Foto</th>
                              <th className="pb-3 font-semibold">Identificação</th>
                              <th className="pb-3 font-semibold">Status</th>
                              <th className="pb-3 font-semibold">Entrada</th>
                              <th className="pb-3 pr-2 font-semibold text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/30">
                            {grupo.itens.map(item => (
                              <tr key={item.id} className={`group hover:${isDark ? 'bg-slate-800/40' : 'bg-white'}`}>
                                <td className="py-3 pl-2 text-center">
                                  {item.imagemUrl ? (
                                    <div className={`w-10 h-10 rounded-full mx-auto border-2 overflow-hidden ${item.isImagemPrincipal ? 'border-cyan-500 shadow-sm shadow-cyan-500/50' : (isDark ? 'border-slate-700' : 'border-slate-200')}`} title={item.isImagemPrincipal ? "Capa do Modelo" : "Foto da Unidade"}>
                                       <img src={item.imagemUrl} alt="Foto da Unidade" className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full mx-auto border-2 border-dashed flex items-center justify-center ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-slate-50'}`} title="Sem foto">
                                       <ImageIcon size={16} className="text-slate-400 opacity-50" />
                                    </div>
                                  )}
                                </td>
                                <td className="py-3">
                                  <div className="flex flex-col">
                                    {item.patrimonio ? (
                                      <span className={`font-mono text-sm font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                        Pat. {item.patrimonio}
                                      </span>
                                    ) : item.numeroProcesso ? (
                                      <span className={`font-mono text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                                        Proc. {item.numeroProcesso}
                                      </span>
                                    ) : (
                                      <span className={`font-mono text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        Sem Pat/Proc
                                      </span>
                                    )}
                                    {item.numeroSerie && (
                                       <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>NS: {item.numeroSerie}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="flex flex-col gap-0.5">
                                    <span className={`px-2.5 py-1 w-max rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                                      {item.status.replace('_', ' ')}
                                    </span>
                                    {item.status === 'BENS_ATIVOS' && item.bensAtivos && (
                                      <span className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} title={`Origem/Local: ${item.bensAtivos.origem || 'N/A'}`}>
                                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{item.bensAtivos.solicitante || 'Sem Prop.'}</span>
                                        {item.bensAtivos.vinculo && ` • ${item.bensAtivos.vinculo}`}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {new Date(item.dataEntrada).toLocaleDateString()}
                                  </span>
                                </td>
                                <td className="py-3 pr-2 text-right">
                                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onEditar(item); }} className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`} title="Editar">
                                      <Edit size={16} />
                                    </button>
                                    {item.status !== 'DESCARTADO' && item.status !== 'DESCARTE' && item.status !== 'TRANSFERIDO' && (
                                      <>
                                        <button onClick={(e) => { e.stopPropagation(); onTransferir(item); }} className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-purple-900/50 text-purple-400' : 'hover:bg-purple-100 text-purple-600'}`} title="Transferir para outro setor">
                                          <ArrowRightLeft size={16} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDescartar(item); }} className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-rose-900/50 text-rose-400' : 'hover:bg-rose-100 text-rose-600'}`} title="Descarte (Gerar Laudo)">
                                          <PackageX size={16} />
                                        </button>
                                      </>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); onDeletar(item.id); }} className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-red-900/50 text-red-500' : 'hover:bg-red-100 text-red-600'}`} title="Excluir Definitivamente">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EstoqueList;
