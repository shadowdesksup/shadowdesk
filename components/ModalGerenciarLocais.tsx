import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit2, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Local } from '../firebase/locais';

interface ModalGerenciarLocaisProps {
  isOpen: boolean;
  onClose: () => void;
  locais: Local[];
  onAdicionar: (nome: string) => Promise<void>;
  onEditar: (id: string, nome: string) => Promise<void>;
  onDeletar: (id: string) => Promise<void>;
  theme?: 'dark' | 'light';
}

const ModalGerenciarLocais: React.FC<ModalGerenciarLocaisProps> = ({
  isOpen,
  onClose,
  locais,
  onAdicionar,
  onEditar,
  onDeletar,
  theme = 'dark'
}) => {
  const [novoLocal, setNovoLocal] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNome, setEditandoNome] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleAdicionar = async () => {
    if (!novoLocal.trim()) return;

    try {
      setCarregando(true);
      setErro('');
      await onAdicionar(novoLocal.trim());
      setNovoLocal('');
      setSucesso('Local adicionado com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error: any) {
      setErro(error.message || 'Erro ao adicionar local');
    } finally {
      setCarregando(false);
    }
  };

  const handleEditar = async (id: string) => {
    if (!editandoNome.trim()) return;

    try {
      setCarregando(true);
      setErro('');
      await onEditar(id, editandoNome.trim());
      setEditandoId(null);
      setEditandoNome('');
      setSucesso('Local atualizado com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error: any) {
      setErro(error.message || 'Erro ao atualizar local');
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletar = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este local?')) return;

    try {
      setCarregando(true);
      setErro('');
      await onDeletar(id);
      setSucesso('Local deletado com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
    } catch (error: any) {
      setErro(error.message || 'Erro ao deletar local');
    } finally {
      setCarregando(false);
    }
  };

  const iniciarEdicao = (local: Local) => {
    setEditandoId(local.id);
    setEditandoNome(local.nome);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditandoNome('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl border shadow-2xl overflow-hidden ${theme === 'dark'
            ? 'bg-slate-900/95 border-white/10'
            : 'bg-white border-slate-200'
            }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
            }`}>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
              Gerenciar Locais
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
            {/* Adicionar Novo */}
            <div className="mb-6">
              <label className={`text-sm font-bold mb-2 block ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                Adicionar Novo Local
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novoLocal}
                  onChange={(e) => setNovoLocal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdicionar()}
                  placeholder="Digite o nome do local..."
                  className={`flex-1 rounded-xl border h-12 px-4 focus:outline-none transition-all ${theme === 'dark'
                    ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-600'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-cyan-500 placeholder:text-slate-400'
                    }`}
                  disabled={carregando}
                />
                <button
                  onClick={handleAdicionar}
                  disabled={carregando || !novoLocal.trim()}
                  className="px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Mensagens */}
            {erro && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4"
              >
                <AlertCircle size={16} />
                <span>{erro}</span>
              </motion.div>
            )}

            {sucesso && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-4"
              >
                <CheckCircle2 size={16} />
                <span>{sucesso}</span>
              </motion.div>
            )}

            {/* Lista de Locais */}
            <div>
              <h3 className={`text-sm font-bold mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                Locais Cadastrados ({locais.length})
              </h3>
              <div className="space-y-2">
                {locais.map((local) => (
                  <div
                    key={local.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${theme === 'dark'
                      ? 'border-white/10 bg-white/5 hover:bg-white/10'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                  >
                    {editandoId === local.id ? (
                      <>
                        <input
                          type="text"
                          value={editandoNome}
                          onChange={(e) => setEditandoNome(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleEditar(local.id);
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                          className={`flex-1 rounded-lg border h-10 px-3 focus:outline-none ${theme === 'dark'
                            ? 'border-white/10 bg-slate-900/50 text-slate-200'
                            : 'border-slate-300 bg-white text-slate-900'
                            }`}
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditar(local.id)}
                          disabled={carregando}
                          className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                        <button
                          onClick={cancelarEdicao}
                          disabled={carregando}
                          className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`flex-1 font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                          }`}>
                          {local.nome}
                        </span>
                        <button
                          onClick={() => iniciarEdicao(local)}
                          disabled={carregando}
                          className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                            ? 'hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400'
                            : 'hover:bg-cyan-50 text-slate-400 hover:text-cyan-600'
                            }`}
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeletar(local.id)}
                          disabled={carregando}
                          className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                            ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                            : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                            }`}
                          title="Deletar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                {locais.length === 0 && (
                  <p className={`text-center text-sm py-8 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                    Carregando locais...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-3 p-6 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
            }`}>
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-xl font-bold transition-colors ${theme === 'dark'
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ModalGerenciarLocais;
