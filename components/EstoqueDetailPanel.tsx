import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowRightLeft, PackageX, Search, Image as ImageIcon } from 'lucide-react';
import { EquipamentoEstoque, StatusEquipamento } from '../types';
import EstoqueSidePanel from './EstoqueSidePanel';
import EstoqueItemViewModal from './EstoqueItemViewModal';
import { GrupoEstoque } from './EstoqueGrid';

interface EstoqueDetailPanelProps {
  grupo: GrupoEstoque | null;
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  onAdicionarUnidade: () => void;
  onEditar: (item: EquipamentoEstoque) => void;
  onTransferir: (item: EquipamentoEstoque) => void;
  onDescartar: (item: EquipamentoEstoque) => void;
  onDeletar: (id: string) => void;
}

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

const EstoqueDetailPanel: React.FC<EstoqueDetailPanelProps> = ({
  grupo, isOpen, onClose, theme = 'dark',
  onAdicionarUnidade, onEditar, onTransferir, onDescartar, onDeletar
}) => {
  const isDark = theme === 'dark';
  const [busca, setBusca] = useState('');
  const [hoverImgId, setHoverImgId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<EquipamentoEstoque | null>(null);

  if (!grupo) return null;

  const titleNode = (
    <div>
      <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
        {grupo.marca} {grupo.modelo}
      </h2>
      <p className={`text-sm font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{grupo.tipo}</p>
    </div>
  );

  const filtroObj = grupo.itens.filter(i => {
    if (!busca) return true;
    const l = busca.toLowerCase();
    return (
      (i.patrimonio && i.patrimonio.toLowerCase().includes(l)) ||
      (i.numeroSerie && i.numeroSerie.toLowerCase().includes(l)) ||
      (i.numeroProcesso && i.numeroProcesso.toLowerCase().includes(l))
    );
  });

  return (
    <EstoqueSidePanel isOpen={isOpen} onClose={onClose} title={titleNode} theme={theme} width="md:w-[calc(100vw-16rem)] max-w-none">
      <div className="p-6">
        {/* Detail Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex gap-4 items-center w-full lg:w-[28rem]">
            <div className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl border transition-all shadow-sm ${isDark ? 'bg-slate-800/90 border-slate-700 text-white focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20' : 'bg-white border-slate-300 text-slate-800 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20'
              }`}>
              <Search size={22} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
              <input
                type="text" placeholder="Buscar Patrimônio, Série ou Processo..." value={busca} onChange={e => setBusca(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-[15px] placeholder:text-slate-500"
              />
            </div>
          </div>
          <button
            onClick={onAdicionarUnidade}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Adicionar Unidade
          </button>
        </div>

        {/* Itens List */}
        <div className="flex flex-col gap-3">
          {filtroObj.length === 0 ? (
            <div className={`p-8 text-center rounded-xl border ${isDark ? 'bg-slate-800/30 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              Nenhuma unidade encontrada.
            </div>
          ) : (
            filtroObj.map(item => (
              <div
                key={item.id}
                onClick={() => setViewingItem(item)}
                className={`p-4 rounded-xl cursor-pointer border transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group ${isDark ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50' : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-400'
                  }`}
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 relative"
                  onMouseEnter={(e) => { if (item.imagemUrl) { setHoverImgId(item.id); } }}
                  onMouseLeave={() => setHoverImgId(null)}
                  onMouseMove={(e) => {
                    if (item.imagemUrl) {
                      const previewEl = document.getElementById(`preview-${item.id}`);
                      if (previewEl) {
                        previewEl.style.left = `${e.clientX + 20}px`;
                        previewEl.style.top = `${Math.min(e.clientY - 100, window.innerHeight - 320)}px`;
                      }
                    }
                  }}
                >
                  {item.imagemUrl ? (
                    <div className={`w-16 h-16 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${item.isImagemPrincipal
                        ? 'border-cyan-500 shadow-md shadow-cyan-500/30'
                        : (isDark ? 'border-slate-600' : 'border-slate-300')
                      }`}>
                      <img src={item.imagemUrl} alt="Foto" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-slate-50'
                      }`}>
                      <ImageIcon size={20} className="text-slate-500 opacity-40" />
                    </div>
                  )}
                </div>
                {/* Hover Preview - Fixed to viewport */}
                {hoverImgId === item.id && item.imagemUrl && (
                  <div
                    id={`preview-${item.id}`}
                    className="fixed z-[9999] p-1.5 rounded-2xl border shadow-2xl pointer-events-none"
                    style={{
                      background: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)',
                      borderColor: isDark ? 'rgba(100,116,139,0.4)' : 'rgba(203,213,225,0.6)',
                      top: 0, left: 0
                    }}
                  >
                    <img src={item.imagemUrl} alt="Preview" className="max-w-[280px] max-h-[280px] w-auto h-auto object-contain rounded-xl" />
                    {item.isImagemPrincipal && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-cyan-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-lg">
                        Capa
                      </div>
                    )}
                  </div>
                )}

                {/* Info Principal */}
                <div className="flex-1 min-w-0">
                  {/* Display no formato Lista Fina (Service Desk) */}
                  <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
                    
                    {/* Bloco 1: Identificadores (Fixo) */}
                    <div className="flex flex-col justify-center gap-2 xl:w-[280px] flex-shrink-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {item.patrimonio ? (
                          <span className={`px-2.5 py-1 rounded-md text-sm font-mono font-bold ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-700'}`}>PT: {item.patrimonio}</span>
                        ) : item.numeroProcesso ? (
                          <span className={`px-2.5 py-1 rounded-md text-sm font-mono font-bold ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>PR: {item.numeroProcesso}</span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>S/ ID</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      {item.numeroSerie && (
                        <div className={`text-sm font-mono flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="opacity-60 text-xs font-sans tracking-wide">SÉRIE:</span>
                          <span className="font-semibold">{item.numeroSerie}</span>
                        </div>
                      )}
                    </div>

                    {/* Divisor Desktop */}
                    <div className={`hidden xl:block w-px h-10 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`} />

                    {/* Bloco 2: Localização e Estado (Fixo) */}
                    <div className="flex flex-col justify-center gap-2 xl:w-[300px] flex-shrink-0">
                      <div className={`text-sm truncate flex items-center gap-2.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] flex-shrink-0"></span>
                        <span className="font-semibold">{item.bensAtivos?.alocadoEm || item.bensAtivos?.origem || 'Local não definido'}</span>
                      </div>
                      <div className={`text-xs flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="opacity-70">Condição atual:</span> <span className="font-medium text-cyan-500">{item.bensAtivos?.condicao || '-'}</span>
                      </div>
                    </div>

                    {/* Divisor Desktop */}
                    <div className={`hidden xl:block w-px h-10 ${isDark ? 'bg-slate-700/50' : 'bg-slate-200'}`} />

                    {/* Bloco 3: Propriedade e Registro (Flex-1) */}
                    <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
                      <div className={`text-sm truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                         <span className="opacity-60">Responsável:</span> <span className="font-medium">{item.bensAtivos?.solicitante || 'Não atribuído'}</span> {item.bensAtivos?.vinculo ? <span className="opacity-50 text-xs">({item.bensAtivos.vinculo})</span> : ''}
                      </div>
                      <div className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                         Registrado em {new Date(item.dataEntrada).toLocaleDateString()} por <span className="font-medium">{item.usuarioCadastro}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Actions Inline */}
                <div className={`flex-shrink-0 flex items-center md:flex-nowrap gap-1 p-1 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`} onClick={e => e.stopPropagation()}>
                  <button onClick={() => onEditar(item)} className={`flex-1 min-w-[32px] sm:min-w-[36px] flex justify-center p-2 rounded-md transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`} title="Editar">
                    <Edit size={16} />
                  </button>
                  {item.status !== 'DESCARTADO' && item.status !== 'TRANSFERIDO' && (
                    <>
                      <div className={`w-px h-6 mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
                      <button onClick={() => onTransferir(item)} className={`flex-1 min-w-[36px] flex justify-center p-2 rounded-md transition-colors ${isDark ? 'hover:bg-purple-900/50 text-purple-400' : 'hover:bg-purple-100 text-purple-600'}`} title="Transferir Local">
                        <ArrowRightLeft size={16} />
                      </button>
                      <button onClick={() => onDescartar(item)} className={`flex-1 min-w-[36px] flex justify-center p-2 rounded-md transition-colors ${isDark ? 'hover:bg-rose-900/50 text-rose-400' : 'hover:bg-rose-100 text-rose-600'}`} title="Descarte/Laudo">
                        <PackageX size={16} />
                      </button>
                    </>
                  )}
                  {/* Delete Definitivo (Optional, usually good for sysadmins) */}
                  <div className={`w-px h-6 mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />
                  <button onClick={() => onDeletar(item.id)} className={`flex-1 min-w-[36px] flex justify-center p-2 rounded-md transition-colors ${isDark ? 'hover:bg-red-900/50 text-red-500' : 'hover:bg-red-100 text-red-600'}`} title="Apagar Registro Físico (Perigoso)">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <EstoqueItemViewModal
        isOpen={viewingItem !== null}
        onClose={() => setViewingItem(null)}
        item={viewingItem}
        theme={theme}
        onEditar={(item) => { onEditar(item); setViewingItem(null); }}
        onMovimentar={(item) => { onTransferir(item); setViewingItem(null); }}
        onDescartar={() => { alert('Funcionalidade de Descarte em desenvolvimento.'); }}
        onManutencao={() => { alert('Funcionalidade de Manutenção em desenvolvimento.'); }}
      />
    </EstoqueSidePanel>
  );
};

export default EstoqueDetailPanel;
