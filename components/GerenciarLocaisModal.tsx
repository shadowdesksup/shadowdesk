import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { LocalTransferencia } from '../types';
import { listarLocaisTransferencia, criarLocalTransferencia, deletarLocalTransferencia } from '../firebase/locaisTransferencia';
import { useAuth } from '../hooks/useAuth';
import EstoqueSidePanel from './EstoqueSidePanel';

interface GerenciarLocaisModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

const GerenciarLocaisModal: React.FC<GerenciarLocaisModalProps> = ({ isOpen, onClose, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const { usuario } = useAuth();
  
  const [locais, setLocais] = useState<LocalTransferencia[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      const data = await listarLocaisTransferencia();
      setLocais(data);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (isOpen) carregar();
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    try {
      setCarregando(true);
      await criarLocalTransferencia(novoNome, usuario?.email || 'Sistema');
      setNovoNome('');
      await carregar();
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este local? Ele deixará de aparecer nas novas transferências.')) return;
    try {
      setCarregando(true);
      await deletarLocalTransferencia(id);
      await carregar();
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const titleNode = (
    <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <MapPin className="text-cyan-500" /> Locais de Transferência
    </h2>
  );

  return (
    <EstoqueSidePanel isOpen={isOpen} onClose={onClose} theme={theme} title={titleNode} width="max-w-md">
      <div className="p-6">
        {erro && <div className="text-red-500 mb-4 text-sm font-medium">{erro}</div>}

        <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Gerencie os destinos disponíveis para quando os equipamentos de suporte do estoque forem transferidos.
        </p>

        <form onSubmit={handleAdd} className="flex gap-2 mb-8">
          <input
            type="text" required
            value={novoNome} onChange={e => setNovoNome(e.target.value)}
            placeholder="Novo local (ex: Sala 10)"
            className={`flex-1 rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'} border`}
          />
          <button 
            type="submit" disabled={carregando}
            className="bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/30 disabled:opacity-50"
          >
            <Plus size={24} />
          </button>
        </form>

        <h3 className={`font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Locais Cadastrados</h3>
        <div className={`overflow-y-auto rounded-xl border custom-scrollbar ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
          {carregando && locais.length === 0 ? (
             <div className="p-6 flex justify-center"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : locais.length === 0 ? (
            <div className={`p-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Nenhum destino cadastrado ainda.
            </div>
          ) : (
            <ul className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {locais.map(local => (
                <li key={local.id} className={`flex items-center justify-between p-4 transition-colors ${isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'}`}>
                  <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{local.nome}</span>
                  <button 
                    onClick={() => handleDelete(local.id)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                    title="Remover Local"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </EstoqueSidePanel>
  );
};

export default React.memo(GerenciarLocaisModal);
