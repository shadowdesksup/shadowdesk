import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RegistroAtendimento, StatusAtendimento, TipoSolicitante } from '../types';
import { Clock, CheckCircle2, AlertCircle, Pencil, Trash2, Eye, Check, Search, Filter, X, FileText, User } from 'lucide-react';
import { formatarDataHora, tempoRelativo } from '../utils/helpers';

interface ListaRegistrosProps {
  registros: RegistroAtendimento[];
  onEditar?: (registro: RegistroAtendimento) => void;
  onDeletar?: (id: string) => void;
  onVisualizar?: (registro: RegistroAtendimento) => void;
  onAtualizarStatus?: (id: string, novoStatus: StatusAtendimento) => Promise<void>;
  limite?: number;
  ocultarBusca?: boolean;
  theme?: 'dark' | 'light';
  customMaxHeight?: string;
  customMinHeight?: string;
}

const StatusBadge = ({ status, id, onAtualizar }: { status: StatusAtendimento; id: string; onAtualizar?: (id: string, s: StatusAtendimento) => Promise<void> }) => {
  const isPendente = status === 'Pendente';

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPendente && onAtualizar) {
      await onAtualizar(id, 'Atendido');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all duration-300
        ${isPendente
          ? `bg-yellow-500/10 text-yellow-500 border-yellow-500/20 ${onAtualizar ? 'cursor-pointer hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/20 group/badge' : ''}`
          : 'bg-green-500/10 text-green-500 border-green-500/20'}
      `}
    >
      {isPendente ? (
        <>
          <div className={`relative w-3 h-3 ${onAtualizar ? 'group-hover/badge:hidden' : ''}`}>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </div>
          {onAtualizar && <CheckCircle2 size={12} className="hidden group-hover/badge:block" />}
          <span className={onAtualizar ? "group-hover/badge:hidden" : ""}>Pendente</span>
          {onAtualizar && <span className="hidden group-hover/badge:inline">Marcar Atendido</span>}
        </>
      ) : (
        <>
          <CheckCircle2 size={12} />
          Atendido
        </>
      )}
    </div>
  );
};

const TipoBadge = ({ tipo }: { tipo: string }) => {
  const colors: Record<string, string> = {
    'Docente': 'text-teal-400 border-teal-500/20 bg-teal-500/10',
    'Aluno': 'text-blue-400 border-blue-500/20 bg-blue-500/10',
    'Aluno - Educação Especial': 'text-violet-400 border-violet-500/20 bg-violet-500/10',
    'Aluno - Permanência': 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10',
    'Servidor': 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    'Funcionário': 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
    'Estagiário': 'text-fuchsia-400 border-fuchsia-500/20 bg-fuchsia-500/10',
    'Visitante': 'text-orange-400 border-orange-500/20 bg-orange-500/10',
    'Faxineiro(a)': 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    'Médico': 'text-rose-400 border-rose-500/20 bg-rose-500/10',
    'Secretário(a)': 'text-purple-400 border-purple-500/20 bg-purple-500/10',
    'Terceirizado': 'text-lime-400 border-lime-500/20 bg-lime-500/10',
    'Outro': 'text-slate-400 border-slate-500/20 bg-slate-500/10',
  };

  const style = colors[tipo] || colors['Outro'];

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${style}`}>
      {tipo}
    </span>
  );
};

const ListaRegistros: React.FC<ListaRegistrosProps> = ({
  registros,
  onEditar,
  onDeletar,
  onVisualizar,
  onAtualizarStatus,
  limite,
  ocultarBusca = false,
  theme = 'dark',
  customMaxHeight,
  customMinHeight
}) => {
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<StatusAtendimento | 'Todos'>('Todos');
  const [filtroTipo, setFiltroTipo] = useState<TipoSolicitante | 'Todos'>('Todos');
  const [pagina, setPagina] = useState(1);
  const itemsPerPage = limite || 10;

  // Filtragem combinada
  const registrosFiltrados = registros.filter(r => {
    const matchTexto = !termoBusca || (
      r.nomeSolicitante.toLowerCase().includes(termoBusca.toLowerCase()) ||
      r.descricaoRequisicao.toLowerCase().includes(termoBusca.toLowerCase()) ||
      r.local.toLowerCase().includes(termoBusca.toLowerCase()) ||
      r.numeroChamado?.toString().includes(termoBusca) ||
      r.status.toLowerCase().includes(termoBusca.toLowerCase())
    );

    const matchStatus = filtroStatus === 'Todos' || r.status === filtroStatus;
    const matchTipo = filtroTipo === 'Todos' || r.tipoSolicitante === filtroTipo;

    return matchTexto && matchStatus && matchTipo;
  });

  useEffect(() => {
    setPagina(1);
  }, [termoBusca, filtroStatus, filtroTipo]);

  const totalPaginas = Math.ceil(registrosFiltrados.length / itemsPerPage);
  const registrosExibir = registrosFiltrados.slice((pagina - 1) * itemsPerPage, pagina * itemsPerPage);
  const temFiltrosAtivos = filtroStatus !== 'Todos' || filtroTipo !== 'Todos';

  // Refs para Drag-to-Scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDown.current = true;
    scrollContainerRef.current.style.cursor = 'grabbing';
    startY.current = e.pageY - scrollContainerRef.current.offsetTop;
    scrollTop.current = scrollContainerRef.current.scrollTop;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const y = e.pageY - scrollContainerRef.current.offsetTop;
    const walk = (y - startY.current) * 1.5;
    scrollContainerRef.current.scrollTop = scrollTop.current - walk;
  };

  if (registros.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={`flex flex-col items-center justify-center gap-4 rounded-2xl border p-12 min-h-[400px] transition-colors duration-300 ${theme === 'dark'
          ? 'border-white/10 bg-slate-900/80'
          : 'border-slate-300 bg-white shadow-xl shadow-slate-200/50'
          }`}
      >
        <AlertCircle size={48} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500 font-medium'}>
          Nenhum registro encontrado
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`flex flex-col gap-6 rounded-2xl border p-8 transition-colors duration-300 ${theme === 'dark'
        ? 'border-white/10 bg-slate-900/80 shadow-2xl shadow-black/20'
        : 'border-slate-200 bg-white shadow-sm'
        }`}
      style={{
        maxHeight: customMaxHeight || '800px',
        minHeight: customMinHeight || '500px'
      }}
    >
      <div className={`sticky top-0 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 -mx-8 px-8 pt-2 -mt-2 ${theme === 'dark'
        ? 'border-white/5 backdrop-blur'
        : 'border-slate-300 bg-white/95 backdrop-blur'
        }`}>
        <div className="flex items-center gap-3">
          <h3 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
            {limite ? 'Registros Recentes' : 'Todos os Registros'}
          </h3>
        </div>

        {!ocultarBusca && (
          <div className="flex gap-2 w-full md:w-auto relative">
            <div className="relative flex-1 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'} />
              </div>
              <input
                type="text"
                placeholder="Buscar..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border rounded-xl leading-5 text-sm transition-all ${theme === 'dark'
                  ? 'border-white/10 bg-white/5 text-slate-300 placeholder-slate-500 focus:bg-white/10 focus:ring-cyan-500/50 focus:border-cyan-500/50'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-cyan-500/50 focus:border-cyan-500 shadow-sm'
                  } focus:outline-none focus:ring-1`}
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`p-2 rounded-xl border transition-colors ${temFiltrosAtivos || mostrarFiltros
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-600'
                  : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
                  }`}
                title="Filtros"
              >
                <Filter size={20} />
                {temFiltrosAtivos && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                )}
              </button>

              {mostrarFiltros && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMostrarFiltros(false)}
                />
              )}

              <AnimatePresence>
                {mostrarFiltros && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8
                    }}
                    className={`absolute right-0 top-full mt-2 w-64 backdrop-blur-2xl border rounded-xl shadow-2xl p-4 z-50 ${theme === 'dark'
                      ? 'bg-slate-900/40 border-white/20 ring-1 ring-white/10'
                      : 'bg-white/95 border-slate-200 ring-1 ring-slate-900/5 shadow-slate-200/50'
                      }`}
                    style={theme === 'dark' ? {
                      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%)'
                    } : {}}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Filtros</h4>
                      {temFiltrosAtivos && (
                        <button
                          onClick={() => {
                            setFiltroStatus('Todos');
                            setFiltroTipo('Todos');
                          }}
                          className="text-xs text-cyan-500 hover:text-cyan-600 transition-all duration-200 hover:scale-105 font-medium"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={`text-xs font-medium mb-1.5 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
                        <select
                          value={filtroStatus}
                          onChange={(e) => setFiltroStatus(e.target.value as any)}
                          className={`w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${theme === 'dark'
                            ? 'bg-slate-950/50 border border-white/20 text-slate-200 focus:border-cyan-500/50 focus:ring-cyan-500/20'
                            : 'bg-slate-50 border border-slate-300 text-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
                            }`}
                        >
                          <option value="Todos">Todos</option>
                          <option value="Pendente">Pendente</option>
                          <option value="Atendido">Atendido</option>
                        </select>
                      </div>

                      <div>
                        <label className={`text-xs font-medium mb-1.5 block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Tipo de Solicitante</label>
                        <select
                          value={filtroTipo}
                          onChange={(e) => setFiltroTipo(e.target.value as any)}
                          className={`w-full rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${theme === 'dark'
                            ? 'bg-slate-950/50 border border-white/20 text-slate-200 focus:border-cyan-500/50 focus:ring-cyan-500/20'
                            : 'bg-slate-50 border border-slate-300 text-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20'
                            }`}
                        >
                          <option value="Todos">Todos</option>
                          <option value="Docente">Docente</option>
                          <option value="Aluno">Aluno</option>
                          <option value="Funcionário">Funcionário</option>
                          <option value="Estagiário">Estagiário</option>
                          <option value="Visitante">Visitante</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <motion.div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="flex flex-col gap-6 overflow-y-auto pr-2 -mr-2 no-scrollbar flex-1 min-h-0 p-1 cursor-grab active:cursor-grabbing select-none"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {registrosExibir.length === 0 ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
            Nenhum registro encontrado
          </div>
        ) : (
          registrosExibir.map((registro) => (
            <motion.div
              key={registro.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{
                scale: 1.005,
                transition: { duration: 0.2 }
              }}
              className={`group relative flex flex-col gap-4 rounded-xl border p-5 transition-all duration-300 ${theme === 'dark'
                ? 'border-white/5 bg-white/5 hover:border-cyan-500/30 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                : 'border-slate-100 bg-white hover:border-cyan-500/30 hover:shadow-lg shadow-sm'
                }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-4">
                    <TipoBadge tipo={registro.tipoSolicitante} />
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>•</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 truncate ${theme === 'dark'
                      ? 'text-slate-400 border-slate-500/20 bg-slate-500/10'
                      : 'text-slate-600 border-slate-300 bg-slate-100'
                      }`}>
                      {registro.local}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-white/5 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                      <User size={16} />
                    </div>
                    <h4 className={`font-bold text-xl leading-tight transition-colors truncate ${theme === 'dark'
                      ? 'text-white group-hover:text-cyan-400'
                      : 'text-slate-800 group-hover:text-cyan-600'
                      }`}>
                      {registro.nomeSolicitante}
                    </h4>
                  </div>
                </div>
                <StatusBadge
                  status={registro.status}
                  id={registro.id}
                  onAtualizar={onAtualizarStatus}
                />
              </div>

              <div className={`relative p-4 rounded-lg border ${theme === 'dark'
                ? 'bg-black/20 border-white/5'
                : 'bg-slate-50 border-slate-200/60'
                }`}>
                <div className="flex gap-3">
                  <div className={`mt-0.5 shrink-0 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <FileText size={16} />
                  </div>
                  <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {registro.descricaoRequisicao}
                  </p>
                </div>
              </div>

              <div className={`flex justify-between items-center pt-3 border-t mt-auto ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Clock size={14} className={theme === 'dark' ? 'text-cyan-500/70' : 'text-cyan-600/70'} />
                  <span>{formatarDataHora(registro.dataHora)}</span>
                  <span className="text-slate-300">•</span>
                  <span>{tempoRelativo(registro.dataHora)}</span>
                </div>

                {(onEditar || onDeletar || onVisualizar) && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                    {onVisualizar && (
                      <button
                        onClick={() => onVisualizar(registro)}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                          ? 'hover:bg-blue-500/20 text-slate-400 hover:text-blue-400'
                          : 'hover:bg-blue-100 text-slate-500 hover:text-blue-700'
                          }`}
                        title="Visualizar"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {onEditar && (
                      <button
                        onClick={() => onEditar(registro)}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                          ? 'hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400'
                          : 'hover:bg-cyan-100 text-slate-500 hover:text-cyan-700'
                          }`}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {onDeletar && (
                      <button
                        onClick={() => onDeletar(registro.id)}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                          ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                          : 'hover:bg-red-100 text-slate-500 hover:text-red-700'
                          }`}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {totalPaginas > 1 && (
        <div className={`flex justify-center items-center gap-2 pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
          <button
            onClick={() => setPagina(prev => Math.max(prev - 1, 1))}
            disabled={pagina === 1}
            className={`px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
              ? 'bg-white/5 hover:bg-white/10 text-slate-300'
              : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 shadow-sm'}`}
          >
            Anterior
          </button>

          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPagina(num)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pagina === num
                ? theme === 'dark'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-cyan-600 text-white shadow-md shadow-cyan-200'
                : theme === 'dark'
                  ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPagina(prev => Math.min(prev + 1, totalPaginas))}
            disabled={pagina === totalPaginas}
            className={`px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
              ? 'bg-white/5 hover:bg-white/10 text-slate-300'
              : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 shadow-sm'}`}
          >
            Próximo
          </button>
        </div>
      )}
    </motion.section>
  );
};

export default ListaRegistros;
