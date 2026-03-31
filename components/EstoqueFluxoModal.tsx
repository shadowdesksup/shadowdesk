import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, PackageX, FileText, MapPin, UserCheck, AlertTriangle } from 'lucide-react';
import { EquipamentoEstoque, LocalTransferencia } from '../types';
import { listarLocaisTransferencia } from '../firebase/locaisTransferencia';
import EstoqueSidePanel from './EstoqueSidePanel';

export type ModoFluxo = 'TRANSFERENCIA' | 'DESCARTE' | null;

interface EstoqueFluxoModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EquipamentoEstoque | null;
  modo: ModoFluxo;
  onConfirmarTransferencia: (localId: string, localNome: string, recebedor: string) => Promise<void>;
  onConfirmarDescarte: (motivo: string) => Promise<void>;
  theme?: 'dark' | 'light';
  carregando?: boolean;
}

const EstoqueFluxoModal: React.FC<EstoqueFluxoModalProps> = ({
  isOpen, onClose, item, modo, onConfirmarTransferencia, onConfirmarDescarte, theme = 'dark', carregando = false
}) => {
  const isDark = theme === 'dark';

  // Transferência State
  const [locais, setLocais] = useState<LocalTransferencia[]>([]);
  const [localSelecionado, setLocalSelecionado] = useState('');
  const [recebedor, setRecebedor] = useState('');

  // Descarte State
  const [motivoDescarte, setMotivoDescarte] = useState('');

  useEffect(() => {
    if (isOpen && modo === 'TRANSFERENCIA') {
      listarLocaisTransferencia().then(setLocais).catch(console.error);
    }
  }, [isOpen, modo]);

  // Reset states
  useEffect(() => {
    if (!isOpen) {
      setLocalSelecionado('');
      setRecebedor('');
      setMotivoDescarte('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'TRANSFERENCIA') {
      const local = locais.find(l => l.id === localSelecionado);
      if (local && recebedor.trim()) {
        await onConfirmarTransferencia(local.id, local.nome, recebedor.trim());
        onClose();
      }
    } else if (modo === 'DESCARTE') {
      if (motivoDescarte.trim()) {
        await onConfirmarDescarte(motivoDescarte.trim());
        onClose();
      }
    }
  };

  const titleNode = modo === 'TRANSFERENCIA' ? (
    <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <ArrowRightLeft className="text-purple-500" /> Fluxo de Transferência
    </h2>
  ) : (
    <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <PackageX className="text-rose-500" /> Fluxo de Descarte (Laudo)
    </h2>
  );

  return (
    <EstoqueSidePanel isOpen={isOpen} onClose={onClose} title={titleNode} theme={theme} width="max-w-lg">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
        {/* Identificação do Item */}
        <div className={`p-5 rounded-2xl border backdrop-blur-md shadow-inner flex items-center gap-4 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
           <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-cover bg-center ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200 shadow-sm'}`} style={{ backgroundImage: item?.imagemUrl ? `url(${item.imagemUrl})` : 'none' }}>
              {!item?.imagemUrl && <FileText className="text-slate-400 opacity-50" size={24} />}
           </div>
           <div>
             <h3 className={`font-bold text-lg leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
               {item?.marca} {item?.modelo}
             </h3>
             <p className={`text-sm font-semibold mt-1 flex gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
               {item?.patrimonio && <span className="text-cyan-500">Pat: {item.patrimonio}</span>}
               {item?.numeroSerie && <span className="text-purple-500">S/N: {item.numeroSerie}</span>}
             </p>
           </div>
        </div>

        {modo === 'TRANSFERENCIA' && (
          <div className="flex flex-col gap-5">
            <div className={`p-4 rounded-xl border flex gap-3 ${isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800'}`}>
               <ArrowRightLeft className="flex-shrink-0 mt-0.5" size={20} />
               <p className="text-sm">Ao transferir, este equipamento mudará seu status para "TRANSFERIDO" e não contabilizará mais entre os ativos disponíveis do suporte.</p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <MapPin size={16} className="text-purple-400" /> Local de Destino *
              </label>
              <select 
                required
                value={localSelecionado} onChange={e => setLocalSelecionado(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'} border`}
              >
                <option value="" disabled>Selecione um local da lista...</option>
                {locais.map(l => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <UserCheck size={16} className="text-purple-400" /> Nome do Recebedor (Responsável) *
              </label>
              <input 
                type="text" required
                value={recebedor} onChange={e => setRecebedor(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'} border`}
                placeholder="Ex: Prof. João da Silva"
              />
            </div>
          </div>
        )}

        {modo === 'DESCARTE' && (
          <div className="flex flex-col gap-5">
            <div className={`p-4 rounded-xl border flex gap-3 ${isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
               <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
               <p className="text-sm">Atenção: Esta ação é o equivalente à baixa patrimonial. O item ficará permanentemente como "DESCARTADO" e este motivo técnico servirá como o Laudo de Baixa.</p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FileText size={16} className="text-rose-400" /> Motivo do Descarte (Parecer / Laudo) *
              </label>
              <textarea 
                required rows={6}
                value={motivoDescarte} onChange={e => setMotivoDescarte(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 outline-none transition-all custom-scrollbar ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-rose-500' : 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'} border`}
                placeholder="Descreva o laudo técnico provando a inviabilidade do conserto..."
              />
            </div>
          </div>
        )}

        {/* Footer actions built into form */}
        <div className="mt-6 flex justify-end gap-3">
          <button 
            type="button" onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
          >
            Cancelar
          </button>
          <button 
            type="submit" disabled={carregando}
            className={`px-6 py-2.5 text-white rounded-xl font-bold transition-transform shadow-lg shadow-black/20 flex items-center gap-2 disabled:opacity-70 disabled:scale-100 ${
              modo === 'TRANSFERENCIA' 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 active:scale-95' 
                : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 active:scale-95'
            }`}
          >
            {carregando ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : modo === 'TRANSFERENCIA' ? (
              <ArrowRightLeft size={20} />
            ) : (
              <PackageX size={20} />
            )}
            {carregando ? 'Processando...' : 'Confirmar e Assinar'}
          </button>
        </div>
      </form>
    </EstoqueSidePanel>
  );
};

export default EstoqueFluxoModal;
