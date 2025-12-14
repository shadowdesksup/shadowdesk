import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Users,
  Search,
  Check,
  X,
  Clock,
  Shield,
  Bell
} from 'lucide-react';
import {
  buscarUsuarioPorEmail,
  enviarSolicitacaoAmizade,
  listarSolicitacoesRecebidas,
  aceitarSolicitacao,
  recusarSolicitacao,
  listarAmigos,
  escutarSolicitacoesPendentes
} from '../firebase/friends';
import { Usuario, FriendRequest, Friend } from '../types';

interface FriendManagerProps {
  currentUser: Usuario;
  theme?: 'dark' | 'light';
  onClose: () => void;
  onEnviarLembrete?: (friend: Friend) => void;
  initialTab?: 'friends' | 'add' | 'requests';
}

const FriendManager: React.FC<FriendManagerProps> = ({ currentUser, theme = 'dark', onClose, onEnviarLembrete, initialTab = 'friends' }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'add' | 'requests'>(initialTab);

  // Estados para busca/adicionar
  const [emailBusca, setEmailBusca] = useState('');
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<Usuario | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [statusEnvio, setStatusEnvio] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [msgErro, setMsgErro] = useState('');

  // Estados para listas
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    // Escutar solicitações em tempo real
    if (currentUser.uid) {
      const unsubscribe = escutarSolicitacoesPendentes(currentUser.uid, (reqs) => {
        setRequests(reqs);
      });
      return () => unsubscribe();
    }
  }, [currentUser.uid]);

  useEffect(() => {
    carregarAmigos();
  }, [currentUser.uid]);

  const carregarAmigos = async () => {
    if (!currentUser.uid) return;
    const amg = await listarAmigos(currentUser.uid);
    setFriends(amg);
  };

  const handleBuscar = async () => {
    if (!emailBusca) return;
    setBuscando(true);
    setUsuarioEncontrado(null);
    setMsgErro('');
    setStatusEnvio('idle');

    try {
      const user = await buscarUsuarioPorEmail(emailBusca);
      if (user) {
        if (user.uid === currentUser.uid) {
          setMsgErro("Você não pode adicionar a si mesmo.");
        } else if (friends.some(f => f.id === user.uid)) {
          setMsgErro("Este usuário já é seu amigo.");
          setUsuarioEncontrado(user); // Mostra mas avisa
        } else {
          setUsuarioEncontrado(user);
        }
      } else {
        setMsgErro("Usuário não encontrado.");
      }
    } catch (error) {
      console.error(error);
      setMsgErro("Erro ao buscar usuário.");
    } finally {
      setBuscando(false);
    }
  };

  const handleEnviarSolicitacao = async () => {
    if (!usuarioEncontrado) return;
    setStatusEnvio('sending');
    try {
      await enviarSolicitacaoAmizade(currentUser, usuarioEncontrado);
      setStatusEnvio('success');
      setEmailBusca('');
      setUsuarioEncontrado(null);
      setTimeout(() => setStatusEnvio('idle'), 3000);
    } catch (error) {
      console.error(error);
      setStatusEnvio('error');
      setMsgErro(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  };

  const handleAceitar = async (req: FriendRequest) => {
    try {
      await aceitarSolicitacao(req.id, req.fromId, req.toId);
      // setRequests removido pois o listener atualizará automaticamente
      carregarAmigos(); // Atualiza lista de amigos
    } catch (error) {
      console.error("Erro ao aceitar:", error);
      alert("Erro ao aceitar solicitação. Tente novamente.");
    }
  };

  const handleRecusar = async (req: FriendRequest) => {
    try {
      await recusarSolicitacao(req.id, req.fromId, req.toId);
      // setRequests removido pois o listener atualizará automaticamente
    } catch (error) {
      console.error("Erro ao recusar:", error);
      alert("Erro ao recusar solicitação. Tente novamente.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border border-white/10' : 'bg-white'
          }`}
      >
        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className={`w-1/3 border-r ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
            <div className="p-6">
              <h2 className={`text-xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Social
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Gerencie suas conexões
              </p>
            </div>

            <nav className="space-y-1 px-3">
              <button
                onClick={() => setActiveTab('friends')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'friends'
                  ? (theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600')
                  : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')
                  }`}
              >
                <Users size={20} />
                <span className="font-medium">Meus Amigos</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'
                  }`}>
                  {friends.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('add')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'add'
                  ? (theme === 'dark' ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600')
                  : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')
                  }`}
              >
                <UserPlus size={20} />
                <span className="font-medium">Adicionar</span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'requests'
                  ? (theme === 'dark' ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600')
                  : (theme === 'dark' ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')
                  }`}
              >
                <Clock size={20} />
                <span className="font-medium">Solicitações</span>
                {requests.length > 0 && (
                  <span className="ml-auto flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-opacity-50">
            {activeTab === 'add' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Adicionar Novo Amigo
                  </h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={emailBusca}
                        onChange={(e) => setEmailBusca(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                        placeholder="Digite o email do usuário..."
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-purple-500'
                          : 'bg-white border-slate-200 text-slate-800 focus:border-purple-500'
                          } focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all`}
                      />
                    </div>
                    <button
                      onClick={handleBuscar}
                      disabled={buscando || !emailBusca}
                      className="px-6 py-3 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
                    >
                      {buscando ? '...' : 'Buscar'}
                    </button>
                  </div>
                  {msgErro && (
                    <p className="mt-3 text-red-400 text-sm flex items-center gap-2">
                      <Shield size={14} />
                      {msgErro}
                    </p>
                  )}
                </div>

                {usuarioEncontrado && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                        {usuarioEncontrado.nomeCompleto.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          {usuarioEncontrado.nomeCompleto}
                        </h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {usuarioEncontrado.email}
                        </p>
                      </div>
                      {/* Botão de Adicionar - só mostra se não for erro (amigo existente) */}
                      {!msgErro && (
                        <button
                          onClick={handleEnviarSolicitacao}
                          disabled={statusEnvio === 'sending' || statusEnvio === 'success'}
                          className={`ml-auto px-4 py-2 rounded-lg font-medium transition-colors ${statusEnvio === 'success'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                            }`}
                        >
                          {statusEnvio === 'sending' ? 'Enviando...' :
                            statusEnvio === 'success' ? 'Enviado!' :
                              'Adicionar'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div>
                <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Solicitações Pendentes
                </h3>

                {requests.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <Clock size={48} className="mx-auto mb-3" />
                    <p>Nenhuma solicitação pendente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.map(req => (
                      <motion.div
                        key={req.id}
                        layout
                        className={`p-4 rounded-xl border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
                            {req.fromName.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                              {req.fromName}
                            </p>
                            <p className="text-sm opacity-60">quer ser seu amigo</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRecusar(req)}
                            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'
                              }`}
                            title="Recusar"
                          >
                            <X size={18} />
                          </button>
                          <button
                            onClick={() => handleAceitar(req)}
                            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            title="Aceitar"
                          >
                            <Check size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <div>
                <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  Meus Amigos
                </h3>
                {friends.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <Users size={48} className="mx-auto mb-3" />
                    <p>Você ainda não tem amigos adicionados</p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="mt-4 text-purple-400 hover:underline"
                    >
                      Encontrar amigos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {friends.map(friend => (
                      <motion.div
                        key={friend.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer group transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:shadow-md'
                          }`}
                        onClick={() => onEnviarLembrete && onEnviarLembrete(friend)}
                        title="Clique para enviar um lembrete"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            {friend.name}
                          </h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {friend.email}
                          </p>
                        </div>
                        {onEnviarLembrete && (
                          <div className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'
                            }`}>
                            <Bell size={16} />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FriendManager;
