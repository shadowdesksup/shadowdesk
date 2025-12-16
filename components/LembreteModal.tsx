import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Play,
  Check,
  BellRing,
  AlertTriangle,
  Music,
  Siren,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Lembrete, CorLembrete, SomNotificacao, Friend } from '../types';
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
    destinatarioId?: string;
    destinatarioNome?: string;
    manterCopia?: boolean;
    telefone?: string;
  }) => Promise<void>;
  onClose: () => void;
  onEnviar?: (lembreteId: string, destinatarioId: string, destinatarioNome: string) => Promise<void>;
  buscarUsuarios?: (termo: string) => Promise<Array<{ uid: string; email: string; nomeCompleto: string }>>;
  amigos?: Friend[];
  destinatarioPreSelecionado?: { uid: string; nome: string };
}

const CORES: { valor: CorLembrete; label: string; classe: string; border: string }[] = [
  { valor: 'rose', label: 'Rose', classe: 'bg-rose-200 hover:bg-rose-300', border: 'border-rose-300' },
  { valor: 'blush', label: 'Blush', classe: 'bg-red-200 hover:bg-red-300', border: 'border-red-300' },
  { valor: 'peach', label: 'Peach', classe: 'bg-orange-200 hover:bg-orange-300', border: 'border-orange-300' },
  { valor: 'sand', label: 'Sand', classe: 'bg-amber-200 hover:bg-amber-300', border: 'border-amber-300' },
  { valor: 'mint', label: 'Mint', classe: 'bg-emerald-200 hover:bg-emerald-300', border: 'border-emerald-300' },
  { valor: 'sage', label: 'Sage', classe: 'bg-green-200 hover:bg-green-300', border: 'border-green-300' },
  { valor: 'sky', label: 'Sky', classe: 'bg-cyan-200 hover:bg-cyan-300', border: 'border-cyan-300' },
  { valor: 'periwinkle', label: 'Peri', classe: 'bg-indigo-300 hover:bg-indigo-400', border: 'border-indigo-400' },
  { valor: 'lavender', label: 'Lavender', classe: 'bg-purple-300 hover:bg-purple-400', border: 'border-purple-400' },
  { valor: 'mist', label: 'Mist', classe: 'bg-slate-300 hover:bg-slate-400', border: 'border-slate-400' }
];

const SONS: { valor: SomNotificacao; label: string; icon: React.ElementType }[] = [
  { valor: 'sino', label: 'Sino Digital', icon: Bell },
  { valor: 'campainha', label: 'Campainha', icon: BellRing },
  { valor: 'alerta', label: 'Alerta Sistema', icon: AlertTriangle },
  { valor: 'gentil', label: 'Melodia Suave', icon: Music },
  { valor: 'urgente', label: 'Sirene Urgente', icon: Siren }
];

const LembreteModal: React.FC<LembreteModalProps> = ({
  lembrete,
  dataPadrao,
  theme = 'dark',
  onSave,
  onClose,
  onEnviar,
  buscarUsuarios,
  amigos = [],
  destinatarioPreSelecionado
}) => {
  const { tocarSom } = useNotifications('');

  // Estados do formulário
  const [titulo, setTitulo] = useState(lembrete?.titulo || '');
  const [descricao, setDescricao] = useState(lembrete?.descricao || '');
  const [data, setData] = useState(() => {
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (lembrete) {
      return new Date(lembrete.dataHora).toISOString().split('T')[0];
    }
    if (dataPadrao) {
      return formatDate(dataPadrao);
    }
    return formatDate(new Date());
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

  const [cor, setCor] = useState<CorLembrete>(lembrete?.cor || 'sand');
  const [somNotificacao, setSomNotificacao] = useState<SomNotificacao>(lembrete?.somNotificacao || 'sino');
  const [telefone, setTelefone] = useState(lembrete?.telefone || localStorage.getItem('last_whatsapp_number') || '');

  // View State for Sound Selection Overlay
  const [view, setView] = useState<'form' | 'sound_selection'>('form');

  // Estados de compartilhamento
  const [mostrarEnviar, setMostrarEnviar] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [usuariosEncontrados, setUsuariosEncontrados] = useState<Array<{ uid: string; email: string; nomeCompleto: string }>>([]);
  const [buscando, setBuscando] = useState(false);

  // Estados de loading/erro
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estados para enviar para amigo
  const [enviarParaAmigo, setEnviarParaAmigo] = useState(!!destinatarioPreSelecionado);
  const [amigoSelecionado, setAmigoSelecionado] = useState<{ uid: string; nome: string } | null>(
    destinatarioPreSelecionado || null
  );
  const [manterCopia, setManterCopia] = useState(true);

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
        somNotificacao,
        ...(enviarParaAmigo && amigoSelecionado ? {
          destinatarioId: amigoSelecionado.uid,
          destinatarioNome: amigoSelecionado.nome,
          manterCopia
        } : {}),
        telefone: telefone.trim()
      });
      if (telefone.trim()) {
        localStorage.setItem('last_whatsapp_number', telefone.trim());
      }
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



  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-lg rounded-2xl border overflow-hidden flex flex-col relative max-h-[85vh] ${theme === 'dark'
            ? 'bg-slate-900 border-white/10'
            : 'bg-white border-slate-200 shadow-2xl'
            }`}
        >
          {/* Main Content (Form) */}
          <div className={`flex flex-col h-full transition-transform duration-300 ${view === 'form' ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                <Bell className="text-cyan-400" size={20} />
                {lembrete ? 'Editar' : 'Novo Lembrete'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-1.5 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              >
                <X size={18} className={theme === 'dark' ? 'text-white' : 'text-slate-600'} />
              </motion.button>
            </div>

            {/* Conteúdo Scrollable */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              {/* Título */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Título
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Reunião importante"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    } focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Descrição <span className="text-[10px] font-normal lowercase opacity-70">(opcional)</span>
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes..."
                  rows={2}
                  className={`w-full px-3 py-2 rounded-lg border resize-none text-sm ${theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    } focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`}
                />
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  WhatsApp Notificação <span className="text-[10px] font-normal lowercase opacity-70">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: 5514999999999"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    } focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`}
                />
                <p className="text-[10px] mt-1 text-slate-500">
                  O bot enviará a mensagem para este número (apenas números, com DDD).
                </p>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Data
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                    <Calendar size={14} className="text-cyan-500 shrink-0" />
                    <input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-inherit outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Hora
                  </label>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                    <Clock size={14} className="text-cyan-500 shrink-0" />
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-inherit outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Cor e Som Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Som Selection Trigger - More Compact */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Som
                  </label>
                  <button
                    onClick={() => setView('sound_selection')}
                    className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between text-sm ${theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      } transition-colors`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {(() => {
                        const sound = SONS.find(s => s.valor === somNotificacao);
                        const Icon = sound?.icon || Bell;
                        return <Icon className="text-cyan-500 shrink-0" size={16} />;
                      })()}
                      <span className="truncate">
                        {SONS.find(s => s.valor === somNotificacao)?.label}
                      </span>
                    </div>
                    <ChevronRight size={16} className="opacity-50 shrink-0" />
                  </button>
                </div>

                {/* Cor Selection - Compact */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Cor
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CORES.slice(0, 5).map((c) => ( // First row
                      <motion.button
                        key={c.valor}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCor(c.valor)}
                        className={`w-8 h-8 rounded-full ${c.classe} border ${cor === c.valor ? 'border-cyan-500 shadow-md scale-110' : 'border-transparent'
                          } transition-all relative flex items-center justify-center`}
                        title={c.label}
                      >
                        {cor === c.valor && (
                          <div className="text-slate-800/60">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CORES.slice(5).map((c) => ( // Second row
                      <motion.button
                        key={c.valor}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCor(c.valor)}
                        className={`w-8 h-8 rounded-full ${c.classe} border ${cor === c.valor ? 'border-cyan-500 shadow-md scale-110' : 'border-transparent'
                          } transition-all relative flex items-center justify-center`}
                        title={c.label}
                      >
                        {cor === c.valor && (
                          <div className="text-slate-800/60">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enviar para Amigo */}
              {amigos.length > 0 && !lembrete && (
                <div className={`mt-2 pt-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        <Send size={16} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          Enviar para um amigo
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          O lembrete aparecerá para ele(a)
                        </p>
                      </div>
                    </div>

                    <div
                      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer pointer-events-auto ${enviarParaAmigo
                        ? 'bg-purple-500'
                        : (theme === 'dark' ? 'bg-white/10' : 'bg-slate-200')
                        }`}
                      onClick={() => {
                        const novoValor = !enviarParaAmigo;
                        setEnviarParaAmigo(novoValor);
                        if (!novoValor) setAmigoSelecionado(null);
                      }}
                    >
                      <motion.div
                        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                        animate={{ x: enviarParaAmigo ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </div>

                  {/* Dropdown de Amigos */}
                  <AnimatePresence>
                    {enviarParaAmigo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="relative">
                          <User className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} size={16} />

                          <select
                            value={amigoSelecionado?.uid || ''}
                            onChange={(e) => {
                              const amigo = amigos.find(a => a.id === e.target.value);
                              if (amigo) {
                                setAmigoSelecionado({ uid: amigo.id, nome: amigo.name });
                              } else {
                                setAmigoSelecionado(null);
                              }
                            }}
                            className={`w-full appearance-none pl-10 pr-10 py-3 rounded-xl border text-sm font-medium transition-all ${theme === 'dark'
                              ? 'bg-white/5 border-white/10 text-white focus:bg-purple-500/10 focus:border-purple-500/50'
                              : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-purple-500'
                              } focus:outline-none focus:ring-0 cursor-pointer`}
                          >
                            <option value="" className={theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'text-slate-400'}>Selecione um amigo...</option>
                            {amigos.map(amigo => (
                              <option key={amigo.id} value={amigo.id} className={theme === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-800'}>
                                {amigo.name}
                              </option>
                            ))}
                          </select>

                          <ChevronRight
                            size={16}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
                          />
                        </div>

                        {/* Checkbox Manter Cópia */}
                        <div className="mt-3 flex items-center gap-2 px-1">
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${manterCopia
                              ? 'bg-cyan-500 border-cyan-500'
                              : (theme === 'dark' ? 'border-slate-600 bg-white/5' : 'border-slate-300 bg-white')
                              }`}
                            onClick={() => setManterCopia(!manterCopia)}
                          >
                            {manterCopia && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <label
                            className={`text-sm cursor-pointer ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
                            onClick={() => setManterCopia(!manterCopia)}
                          >
                            Manter uma cópia para mim
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Erro */}
              {erro && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  {erro}
                </div>
              )}


            </div>

            {/* Footer */}
            <div className={`flex gap-3 p-4 border-t shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`py-2 px-4 rounded-lg font-medium text-sm ${theme === 'dark'
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
                className="flex-1 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 disabled:opacity-50 transition-all"
              >
                {salvando ? 'Salvando...' : lembrete ? 'Salvar' : 'Criar Lembrete'}
              </motion.button>
            </div>
          </div>

          {/* Sound Selection Overlay */}
          <div className={`absolute inset-0 z-20 flex flex-col transition-transform duration-300 ${view === 'sound_selection' ? 'translate-x-0' : 'translate-x-full'} ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
            <div className={`flex items-center gap-3 p-4 border-b shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
              <button
                onClick={() => setView('form')}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              >
                <ChevronLeft size={20} className={theme === 'dark' ? 'text-white' : 'text-slate-800'} />
              </button>
              <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Escolher Som
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {SONS.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.valor}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${somNotificacao === s.valor
                      ? (theme === 'dark' ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-100')
                      : (theme === 'dark' ? 'bg-white/5 border border-transparent hover:bg-white/10' : 'bg-slate-50 border border-transparent hover:bg-slate-100')
                      }`}
                    onClick={() => {
                      setSomNotificacao(s.valor);
                      handleTestarSom(s.valor);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${somNotificacao === s.valor ? 'bg-cyan-500 text-white' : (theme === 'dark' ? 'bg-white/10 text-slate-400' : 'bg-white text-slate-400')
                        }`}>
                        <Icon size={18} />
                      </div>
                      <span className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                        {s.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestarSom(s.valor);
                        }}
                        className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-white/20' : 'hover:bg-white'
                          }`}
                        title="Ouvir"
                      >
                        <Play size={14} className={somNotificacao === s.valor ? 'text-cyan-500' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')} />
                      </button>
                      {somNotificacao === s.valor && <Check size={18} className="text-cyan-500" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`p-4 border-t shrink-0 ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
              <button
                onClick={() => setView('form')}
                className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LembreteModal;
