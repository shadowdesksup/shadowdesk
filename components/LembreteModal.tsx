import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Bell,
  Calendar,
  Clock,
  Palette,
  Volume2,
  Send,
  Search,
  User,
  Play
} from 'lucide-react';
import { Lembrete, CorLembrete, SomNotificacao } from '../types';
import { useNotifications } from '../hooks/useNotifications';

interface LembreteModalProps {
  lembrete?: Lembrete | null;
  dataPadrao?: Date | null;
  theme?: 'dark' | 'light';
  onSave: (dados: {
    titulo: string;
    descricao: string;
    dataHora: string;
    cor: CorLembrete;
    somNotificacao: SomNotificacao;
  }) => Promise<void>;
  onClose: () => void;
  onEnviar?: (lembreteId: string, destinatarioId: string, destinatarioNome: string) => Promise<void>;
  buscarUsuarios?: (termo: string) => Promise<Array<{ uid: string; email: string; nomeCompleto: string }>>;
}

const CORES: { valor: CorLembrete; label: string; classe: string }[] = [
  { valor: 'amarelo', label: 'Amarelo', classe: 'bg-yellow-200 hover:bg-yellow-300' },
  { valor: 'rosa', label: 'Rosa', classe: 'bg-pink-200 hover:bg-pink-300' },
  { valor: 'azul', label: 'Azul', classe: 'bg-blue-200 hover:bg-blue-300' },
  { valor: 'verde', label: 'Verde', classe: 'bg-green-200 hover:bg-green-300' },
  { valor: 'laranja', label: 'Laranja', classe: 'bg-orange-200 hover:bg-orange-300' },
  { valor: 'roxo', label: 'Roxo', classe: 'bg-purple-200 hover:bg-purple-300' }
];

const SONS: { valor: SomNotificacao; label: string; emoji: string }[] = [
  { valor: 'sino', label: 'Sino', emoji: '🔔' },
  { valor: 'campainha', label: 'Campainha', emoji: '🛎️' },
  { valor: 'alerta', label: 'Alerta', emoji: '⚠️' },
  { valor: 'gentil', label: 'Gentil', emoji: '🎵' },
  { valor: 'urgente', label: 'Urgente', emoji: '🚨' }
];

const LembreteModal: React.FC<LembreteModalProps> = ({
  lembrete,
  dataPadrao,
  theme = 'dark',
  onSave,
  onClose,
  onEnviar,
  buscarUsuarios
}) => {
  const { tocarSom } = useNotifications('');

  // Estados do formulário
  const [titulo, setTitulo] = useState(lembrete?.titulo || '');
  const [descricao, setDescricao] = useState(lembrete?.descricao || '');
  const [data, setData] = useState(() => {
    if (lembrete) {
      return new Date(lembrete.dataHora).toISOString().split('T')[0];
    }
    if (dataPadrao) {
      return dataPadrao.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [hora, setHora] = useState(() => {
    if (lembrete) {
      const d = new Date(lembrete.dataHora);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const agora = new Date();
    agora.setHours(agora.getHours() + 1);
    return `${String(agora.getHours()).padStart(2, '0')}:00`;
  });
  const [cor, setCor] = useState<CorLembrete>(lembrete?.cor || 'amarelo');
  const [somNotificacao, setSomNotificacao] = useState<SomNotificacao>(lembrete?.somNotificacao || 'sino');

  // Estados de compartilhamento
  const [mostrarEnviar, setMostrarEnviar] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<Array<{ uid: string; email: string; nomeCompleto: string }>>([]);
  const [buscando, setBuscando] = useState(false);

  // Estados de loading/erro
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Buscar usuários quando digita
  useEffect(() => {
    if (!buscarUsuarios || termoBusca.length < 2) {
      setUsuariosEncontrados([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setBuscando(true);
      try {
        const usuarios = await buscarUsuarios(termoBusca);
        setUsuariosEncontrados(usuarios);
      } catch (err) {
        console.error('Erro ao buscar usuários:', err);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [termoBusca, buscarUsuarios]);

  // Handler de salvar
  const handleSalvar = async () => {
    if (!titulo.trim()) {
      setErro('O título é obrigatório');
      return;
    }

    const dataHora = new Date(`${data}T${hora}:00`);
    if (dataHora < new Date()) {
      setErro('A data/hora deve ser no futuro');
      return;
    }

    setSalvando(true);
    setErro(null);

    try {
      await onSave({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        dataHora: dataHora.toISOString(),
        cor,
        somNotificacao
      });
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar lembrete');
    } finally {
      setSalvando(false);
    }
  };

  // Handler de testar som
  const handleTestarSom = (som: SomNotificacao) => {
    tocarSom(som);
  };

  // Handler de enviar para usuário
  const handleEnviarPara = async (usuario: { uid: string; nomeCompleto: string }) => {
    if (!lembrete || !onEnviar) return;

    try {
      await onEnviar(lembrete.id, usuario.uid, usuario.nomeCompleto);
      setMostrarEnviar(false);
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao enviar lembrete');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl border overflow-hidden ${theme === 'dark'
            ? 'bg-slate-900 border-white/10'
            : 'bg-white border-slate-200 shadow-2xl'
          }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
          }`}>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
            <Bell className="text-cyan-400" size={24} />
            {lembrete ? 'Editar Lembrete' : 'Novo Lembrete'}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
              }`}
          >
            <X size={20} className={theme === 'dark' ? 'text-white' : 'text-slate-600'} />
          </motion.button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Título */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
              Título *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião importante"
              className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark'
                  ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes do lembrete..."
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border resize-none ${theme === 'dark'
                  ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                <Calendar size={14} />
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                <Clock size={14} />
                Hora
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-white border-slate-200 text-slate-800'
                  } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className={`block text-sm font-medium mb-2 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
              <Palette size={14} />
              Cor do Lembrete
            </label>
            <div className="flex gap-2 flex-wrap">
              {CORES.map((c) => (
                <motion.button
                  key={c.valor}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCor(c.valor)}
                  className={`w-10 h-10 rounded-lg ${c.classe} ${cor === c.valor ? 'ring-2 ring-cyan-500 ring-offset-2' : ''
                    } transition-all`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Som de Notificação */}
          <div>
            <label className={`block text-sm font-medium mb-2 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
              <Volume2 size={14} />
              Som de Notificação
            </label>
            <div className="flex gap-2 flex-wrap">
              {SONS.map((s) => (
                <motion.button
                  key={s.valor}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSomNotificacao(s.valor)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 ${somNotificacao === s.valor
                      ? 'bg-cyan-500 text-white'
                      : theme === 'dark'
                        ? 'bg-white/10 text-slate-300 hover:bg-white/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    } transition-all`}
                >
                  <span>{s.emoji}</span>
                  <span className="text-sm">{s.label}</span>
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestarSom(s.valor);
                    }}
                    className="ml-1 opacity-60 hover:opacity-100"
                    title="Testar som"
                  >
                    <Play size={12} />
                  </motion.button>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {erro}
            </div>
          )}

          {/* Seção de Enviar para Alguém (apenas para edição) */}
          {lembrete && onEnviar && (
            <div className={`border-t pt-4 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
              }`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMostrarEnviar(!mostrarEnviar)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${theme === 'dark'
                    ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  } transition-colors`}
              >
                <Send size={16} />
                Enviar para alguém
              </motion.button>

              {mostrarEnviar && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      placeholder="Buscar usuário por nome ou email..."
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark'
                          ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                        } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  {buscando && (
                    <div className="mt-2 text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto" />
                    </div>
                  )}

                  {!buscando && usuariosEncontrados.length > 0 && (
                    <div className={`mt-2 rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                      }`}>
                      {usuariosEncontrados.map((usuario) => (
                        <motion.button
                          key={usuario.uid}
                          whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                          onClick={() => handleEnviarPara(usuario)}
                          className={`w-full flex items-center gap-3 p-3 text-left ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                            }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {usuario.nomeCompleto.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{usuario.nomeCompleto}</p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                              {usuario.email}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {!buscando && termoBusca.length >= 2 && usuariosEncontrados.length === 0 && (
                    <p className={`mt-2 text-center py-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                      Nenhum usuário encontrado
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-3 p-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
          }`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg font-medium ${theme === 'dark'
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              } transition-colors`}
          >
            Cancelar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 py-2 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 disabled:opacity-50 transition-all"
          >
            {salvando ? 'Salvando...' : lembrete ? 'Salvar Alterações' : 'Criar Lembrete'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LembreteModal;
