import React, { useState } from 'react';
import { Package, ShieldCheck, FileText, Wrench, Clock, Image as ImageIcon, Printer, ChevronLeft, ArrowRightLeft, PackageX, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Barcode from 'react-barcode';
import { EquipamentoEstoque, StatusEquipamento } from '../types';
import EstoqueSidePanel from './EstoqueSidePanel';

interface EstoqueItemViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EquipamentoEstoque | null;
  theme?: 'dark' | 'light';
  onEditar?: (item: EquipamentoEstoque) => void;
  onMovimentar?: (item: EquipamentoEstoque) => void;
  onDescartar?: (item: EquipamentoEstoque) => void;
  onManutencao?: (item: EquipamentoEstoque) => void;
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

const EstoqueItemViewModal: React.FC<EstoqueItemViewModalProps> = ({
  isOpen, onClose, item, theme = 'dark',
  onEditar, onMovimentar, onDescartar, onManutencao
}) => {
  const isDark = theme === 'dark';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!item) return null;

  return (
    <EstoqueSidePanel
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/30">
            <Package className="text-white" size={20} />
          </div>
          <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Ficha do Equipamento</span>
        </div>
      }
      width="md:w-[calc(100vw-5rem)] lg:w-[calc(100vw-16rem)] max-w-none"
    >
      {/* Background Gradient Effect */}
      <div className={`absolute top-0 left-0 right-0 h-64 opacity-20 pointer-events-none rounded-t-3xl ${isDark ? 'bg-gradient-to-b from-cyan-900/50 to-transparent' : 'bg-gradient-to-b from-cyan-200 to-transparent'}`} />

      {/* Top-Right Horizontal Action Bar */}
      {(onEditar || onMovimentar || onDescartar || onManutencao) && item.status !== 'DESCARTADO' && item.status !== 'TRANSFERIDO' && (
        <div className="absolute top-0 right-4 z-[100] no-print flex items-center gap-2">
          {/* Sliding buttons panel */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className={`flex items-center gap-2 px-2 py-2 rounded-xl border shadow-xl backdrop-blur-xl mr-1 ${isDark ? 'bg-slate-900/95 border-slate-700/80' : 'bg-white/95 border-slate-200'}`}>
                  {onMovimentar && (
                    <button onClick={() => { onMovimentar(item); setIsMenuOpen(false); }} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                      <ArrowRightLeft size={16} /> Movimentar
                    </button>
                  )}
                  {onManutencao && (
                    <button onClick={() => { onManutencao(item); setIsMenuOpen(false); }} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                      <Wrench size={16} /> Manutenção
                    </button>
                  )}
                  {onDescartar && (
                    <button onClick={() => { onDescartar(item); setIsMenuOpen(false); }} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 whitespace-nowrap">
                      <PackageX size={16} /> Descartar
                    </button>
                  )}
                  {onEditar && (
                    <>
                      <div className={`w-px h-7 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                      <button onClick={() => { onEditar(item); setIsMenuOpen(false); }} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 whitespace-nowrap ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <Edit2 size={16} /> Editar
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle arrow tab */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border shadow-md transition-all active:scale-95 ${isDark ? 'bg-slate-800/90 border-slate-700 text-cyan-400 hover:border-cyan-500/60 hover:bg-slate-700' : 'bg-white/90 border-slate-300 text-cyan-600 hover:border-cyan-400'}`}
          >
            <ChevronLeft size={18} className={`transition-transform duration-300 ${isMenuOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      )}


      <div className="relative z-10 p-6 md:p-10 flex flex-col gap-8 pb-32">

        {/* Header Section (Photo + Title + Quick Info) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Photo */}
          <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-start">
            {item.imagemUrl ? (
              <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-[2rem] border-[4px] overflow-hidden shadow-2xl group ${isDark ? 'border-slate-800/80 shadow-black/50' : 'border-white shadow-slate-300'}`}>
                <img src={item.imagemUrl} alt="Foto do Equipamento" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2rem]"></div>
              </div>
            ) : (
              <div className={`w-48 h-48 md:w-64 md:h-64 rounded-[2rem] border-[4px] border-dashed flex items-center justify-center ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-300'}`}>
                <ImageIcon size={48} className="text-slate-500 opacity-40" />
              </div>
            )}
          </div>

          {/* Title & Core Identifiers */}
          <div className="flex-1 flex flex-col gap-5 w-full">
            <div className="flex flex-col items-start gap-2">
              <div className={`inline-flex px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getStatusColor(item.status)}`}>
                {item.status.replace('_', ' ')}
              </div>
              <h1 className={`text-3xl md:text-5xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {item.marca} {item.modelo}
              </h1>
              <p className={`text-lg md:text-xl font-semibold tracking-wide ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {item.tipo}
              </p>
            </div>

            {/* Identifiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className={`flex flex-col justify-center p-4 rounded-2xl border backdrop-blur-md transition-shadow hover:shadow-md ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white/80 border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Patrimônio</p>
                {item.patrimonio ? (
                  <p className={`font-mono font-bold text-xl ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{item.patrimonio}</p>
                ) : item.numeroProcesso ? (
                  <p className={`font-mono font-bold text-xl ${isDark ? 'text-amber-400' : 'text-amber-700'}`}><span className="text-sm">Proc:</span> {item.numeroProcesso}</p>
                ) : (
                  <p className={`font-mono font-medium text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>S/ Identificação</p>
                )}
              </div>

              <div className={`flex flex-col justify-center p-4 rounded-2xl border backdrop-blur-md transition-shadow hover:shadow-md ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' : 'bg-white/80 border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Número de Série (S/N)</p>
                <p className={`font-mono font-bold text-xl truncate ${item.numeroSerie ? (isDark ? 'text-slate-200' : 'text-slate-800') : (isDark ? 'text-slate-600' : 'text-slate-400')}`}>
                  {item.numeroSerie || 'N/A'}
                </p>
              </div>

              {/* Etiqueta / Barcode Standalone */}
              <div className={`flex flex-col items-center justify-center p-2 rounded-2xl border backdrop-blur-md transition-shadow relative group ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
                <div className="single-print-container flex flex-col items-center justify-center p-2 bg-white rounded-xl w-full text-black border border-dashed border-slate-300 print:w-auto print:border-solid print:p-2">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5 w-full text-center text-slate-800 print:mb-1">SD-ID INTERNO</div>
                  <Barcode
                    value={`SD-${item.id.substring(0, 8).toUpperCase()}`}
                    height={28}
                    width={1.2}
                    fontSize={10}
                    margin={0}
                    displayValue={true}
                    background="transparent"
                  />
                  <div className={`text-[7px] mt-0.5 truncate w-full px-1 text-center text-slate-500`}>
                    {item.marca} {item.modelo}
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="absolute inset-0 bg-cyan-900/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity no-print gap-1.5 cursor-pointer hover:bg-cyan-800/90 z-10"
                >
                  <Printer size={22} className="drop-shadow-lg" />
                  <span className="font-bold text-xs">Imprimir Esta Etiqueta</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">

          {/* Block: Bens Ativos */}
          {item.bensAtivos && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-cyan-900/10 border-cyan-500/20 shadow-inner' : 'bg-cyan-50 border-cyan-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className={isDark ? 'text-cyan-400' : 'text-cyan-600'} size={24} />
                <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>Dados Estruturais</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-cyan-500/80' : 'text-cyan-700/70'}`}>Proprietário</p>
                  <p className={`font-medium mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.bensAtivos.solicitante || 'Não informado'}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-cyan-500/80' : 'text-cyan-700/70'}`}>Vínculo</p>
                  <p className={`font-medium mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.bensAtivos.vinculo || 'Não informado'}</p>
                </div>
                <div className="col-span-2">
                  <div className={`w-full h-px ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-200'}`}></div>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-cyan-500/80' : 'text-cyan-700/70'}`}>Alocado Fisicamente Em</p>
                  <p className={`font-medium mt-1 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                    {item.bensAtivos.alocadoEm || item.bensAtivos.origem || 'Não Definido'}
                  </p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-cyan-500/80' : 'text-cyan-700/70'}`}>Condição Avaliada</p>
                  <p className={`font-medium mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.bensAtivos.condicao || 'Desconhecida'}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Origem</p>
                  <p className={`font-medium mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.bensAtivos.origem}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Data de Entrada</p>
                  <p className={`font-medium mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{new Date(item.bensAtivos.dataEntradaItem || item.dataEntrada).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Block: Projeto */}
          {item.temProjeto && (
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-purple-900/10 border-purple-500/20 shadow-inner' : 'bg-purple-50 border-purple-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-6">
                <FileText className={isDark ? 'text-purple-400' : 'text-purple-600'} size={24} />
                <h3 className={`text-xl font-bold tracking-tight ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>Projeto de Pesquisa</h3>
              </div>
              <div className="flex flex-col gap-5">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-purple-500/80' : 'text-purple-700/70'}`}>Agência Vinculada</p>
                  <p className={`font-medium mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.agenciaFomento}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-purple-500/80' : 'text-purple-700/70'}`}>Número do Processo</p>
                  <p className={`font-medium font-mono text-lg mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.numeroProcesso}</p>
                </div>
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-purple-500/80' : 'text-purple-700/70'}`}>Termo Administrativo</p>
                  <p className={`font-medium font-mono mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.numeroTermo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Block: Manutenção */}
          {item.manutencaoAtual && (
            <div className={`p-6 rounded-3xl border-2 ${isDark ? 'bg-orange-950/20 border-orange-500/20' : 'bg-orange-50/50 border-orange-200'} ${(!item.bensAtivos && !item.temProjeto) ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <Wrench className={isDark ? 'text-orange-400' : 'text-orange-600'} size={24} />
                <h3 className={`text-lg font-bold ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Em Manutenção</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-orange-500/70' : 'text-orange-700/70'}`}>Solicitante</p>
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.manutencaoAtual.solicitante}</p>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-orange-500/70' : 'text-orange-700/70'}`}>Técnico Responsável</p>
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.manutencaoAtual.tecnicoResponsavelNome}</p>
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-orange-500/70' : 'text-orange-700/70'}`}>Data Início</p>
                  <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{new Date(item.manutencaoAtual.dataInicio).toLocaleDateString()}</p>
                </div>
                <div className="md:col-span-2 mt-2">
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-orange-500/70' : 'text-orange-700/70'}`}>Problema Relatado</p>
                  <p className={`font-medium mt-1 p-3 rounded-xl ${isDark ? 'bg-slate-900/50 text-slate-300' : 'bg-white/50 text-slate-700'}`}>{item.manutencaoAtual.problema}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historico */}
        <div className={`mt-8 rounded-[2rem] border overflow-hidden backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-slate-700/50 shadow-inner' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className={`p-6 flex items-center gap-3 border-b ${isDark ? 'border-slate-700/50 bg-slate-800/60' : 'border-slate-100 bg-slate-50'}`}>
            <Clock size={20} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Trilha Histórica</h3>
          </div>
          <div className="p-4 md:p-6 max-h-80 overflow-y-auto custom-scrollbar relative">
            {item.historico && item.historico.length > 0 ? (
              <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-500/20 before:to-transparent">
                {[...item.historico].reverse().map((hist, idx) => (
                  <li key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group md:mx-auto md:w-full">
                    {/* Linha central da timeline (desktop) ou esq (mobile) */}
                    <div className={`absolute flex items-center justify-center w-6 h-6 rounded-full border-4 shadow-sm z-10 
                      left-0 md:left-1/2 md:-ml-3
                      ${idx === 0
                        ? (isDark ? 'bg-cyan-400 border-slate-900 shadow-[0_0_12px_rgba(6,182,212,0.8)]' : 'bg-cyan-500 border-white shadow-cyan-300')
                        : (isDark ? 'bg-slate-600 border-slate-800' : 'bg-slate-300 border-white')
                      }`}
                    />

                    {/* Card container */}
                    <div className="ml-10 md:ml-0 md:w-1/2 md:px-6 w-full">
                      <div className={`p-4 rounded-2xl border transition-all duration-300 group-hover:-translate-y-1 ${idx === 0
                        ? (isDark ? 'bg-cyan-900/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200')
                        : (isDark ? 'bg-slate-800/50 border-slate-700/50 group-hover:bg-slate-800/80' : 'bg-white border-slate-200/60 group-hover:bg-slate-50')
                        }`}>
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {new Date(hist.data).toLocaleString()}
                        </div>
                        <p className={`font-medium text-[13px] leading-relaxed mb-3 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          {hist.acao}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                            {hist.usuarioNome?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            por <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{hist.usuarioNome}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`p-4 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum histórico disponível.</p>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .single-print-container, .single-print-container * {
            visibility: visible;
          }
          .single-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: auto;
            margin: 0;
            padding: 2mm;
            border: 1px solid black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </EstoqueSidePanel>
  );
};

export default EstoqueItemViewModal;
