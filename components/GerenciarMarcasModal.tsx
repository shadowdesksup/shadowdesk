import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Bookmark, Save, X } from 'lucide-react';
import { MarcaEquipamento } from '../types';
import { listarMarcasEquipamento, criarMarcaEquipamento, deletarMarcaEquipamento, atualizarMarcaEquipamento } from '../firebase/marcasEquipamento';
import { verificarUsoEmEstoque } from '../firebase/estoque';

interface GerenciarMarcasModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

const GerenciarMarcasModal: React.FC<GerenciarMarcasModalProps> = ({ isOpen, onClose, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  
  const [marcas, setMarcas] = useState<MarcaEquipamento[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');

  const carregar = async () => {
    try {
      setCarregando(true);
      const data = await listarMarcasEquipamento();
      setMarcas(data);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
       carregar();
       setErro(null);
       setEditandoId(null);
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    setErro(null);
    try {
      setCarregando(true);
      await criarMarcaEquipamento(novoNome);
      setNovoNome('');
      await carregar();
    } catch (err: any) {
      setErro(err.message);
      setCarregando(false);
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editNome.trim()) return;
    setErro(null);
    try {
      setCarregando(true);
      await atualizarMarcaEquipamento(id, editNome);
      setEditandoId(null);
      await carregar();
    } catch (err: any) {
      setErro(err.message);
      setCarregando(false);
    }
  };

  const handleDelete = async (item: MarcaEquipamento) => {
    if (!window.confirm(`Excluir a marca "${item.nome}"? Ela deixará de aparecer nas opções do banco.`)) return;
    setErro(null);
    try {
      setCarregando(true);
      const emUso = await verificarUsoEmEstoque('marca', item.nome);
      if (emUso) {
        setErro(`Não é possível excluir: existem equipamentos cadastrados com a marca "${item.nome}".`);
        setCarregando(false);
        return;
      }
      await deletarMarcaEquipamento(item.id);
      await carregar();
    } catch (err: any) {
      setErro(err.message);
      setCarregando(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-md shadow-2xl rounded-2xl overflow-hidden flex flex-col ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}
          >
            <div className={`p-5 flex items-center justify-between border-b ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'}`}>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                <Bookmark className="text-cyan-500" /> Banco de Marcas
              </h2>
              <button 
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {erro && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg border border-red-500/20 mb-4 text-sm font-medium">{erro}</div>}

              <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Adicione ou remova Marcas Padrões para ajudar o preenchimento dos usuários (autocompletar).
              </p>

              <form onSubmit={handleAdd} className="flex gap-2 mb-8">
                <input
                  type="text" required
                  value={novoNome} onChange={e => setNovoNome(e.target.value)}
                  placeholder="Nova marca (ex: Dell)"
                  className={`flex-1 rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'} border`}
                />
                <button 
                  type="submit" disabled={carregando}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                  title="Salvar na Base"
                >
                  <Plus size={24} />
                </button>
              </form>

              <h3 className={`font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Marcas Fixas na Base</h3>
              <div className={`overflow-y-auto rounded-xl border custom-scrollbar ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'} max-h-[40vh]`}>
                {carregando && !marcas.length ? (
                   <div className="p-6 flex justify-center"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : marcas.length === 0 ? (
                  <div className={`p-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nenhuma marca padrão cadastrada.
                  </div>
                ) : (
                  <ul className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {marcas.map(item => (
                      <li key={item.id} className={`flex items-center justify-between p-4 transition-colors ${isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'}`}>
                        {editandoId === item.id ? (
                          <div className="flex flex-1 items-center gap-2 mr-2">
                             <input 
                               autoFocus
                               type="text" 
                               value={editNome} 
                               onChange={e => setEditNome(e.target.value)}
                               className={`w-full text-sm px-2 py-1 rounded bg-transparent border ${isDark ? 'border-cyan-500 text-white outline-none' : 'border-cyan-500 text-slate-800 outline-none'}`}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleEditSave(item.id);
                                 if (e.key === 'Escape') setEditandoId(null);
                               }}
                             />
                             <button type="button" onClick={() => handleEditSave(item.id)} className="text-emerald-500 p-1 hover:bg-emerald-500/20 rounded"><Save size={16}/></button>
                             <button type="button" onClick={() => setEditandoId(null)} className="text-slate-500 p-1 hover:bg-slate-500/20 rounded"><X size={16}/></button>
                          </div>
                        ) : (
                          <>
                            <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.nome}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                type="button"
                                onClick={() => { setEditandoId(item.id); setEditNome(item.nome); }}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-cyan-400 hover:bg-cyan-900/30' : 'text-slate-400 hover:text-cyan-600 hover:bg-cyan-50'}`}
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDelete(item)}
                                className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-900/30' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                title="Remover"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(GerenciarMarcasModal);
