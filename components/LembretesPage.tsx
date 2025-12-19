import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Bell,
  Send,
  Inbox,
  AlertCircle,
  Check,
  CheckCircle,
  X,
  Trash2,
  Users
} from 'lucide-react';
import { Lembrete, CorLembrete, SomNotificacao, Friend } from '../types';
import { UseRemindersReturn } from '../hooks/useReminders';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { listarAmigos } from '../firebase/friends';
import LembreteCard from './LembreteCard';
import LembreteModal from './LembreteModal';
import LembreteViewModal from './LembreteViewModal';
import ConfirmationModal from './ConfirmationModal';
import FriendManager from './FriendManager';

interface LembretesPageProps {
  remindersData: UseRemindersReturn;
  theme?: 'dark' | 'light';
  initialContext?: any;
  onContextUsed?: () => void;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const COR_CLASSES: Record<CorLembrete, string> = {
  rose: 'bg-rose-200',
  blush: 'bg-red-200',
  peach: 'bg-orange-200',
  sand: 'bg-amber-200',
  mint: 'bg-emerald-200',
  sage: 'bg-green-200',
  sky: 'bg-sky-200',
  periwinkle: 'bg-indigo-200',
  lavender: 'bg-purple-200',
  mist: 'bg-slate-200'
};

// Helper hook for precise time
function useCurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return time.toLocaleTimeString('pt-BR');
}

const LembretesPage: React.FC<LembretesPageProps> = ({ remindersData, theme = 'dark', initialContext, onContextUsed }) => {
  const { usuario, dadosUsuario } = useAuth();

  // Adaptar usuário do Auth/Firestore para o tipo Usuario esperado pelo componente
  const usuarioAtual = useMemo(() => {
    if (!usuario) return null;
    return {
      uid: usuario.uid,
      email: usuario.email || '',
      nomeCompleto: dadosUsuario?.nomeCompleto || usuario.displayName || 'Usuário',
      friendRequestsSent: [], // Não usado diretamente na prop
      friendRequestsReceived: [],
      friends: []
    } as any; // Cast como any simplificado para evitar erro de tipo estrito agora
  }, [usuario, dadosUsuario]);



  const {
    lembretes,
    lembretesRecebidos,
    loading,
    error,
    criar,
    atualizar,
    deletar,
    finalizar,
    enviar,
    aceitar,
    recusar,
    buscarUsuariosParaCompartilhar,
    pendentes,
    expirados,
    finalizados,
    hoje
  } = remindersData;

  // Estado do calendário
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(new Date());

  // Handle Initial Context (Deep Linking)
  // Handle Initial Context (Deep Linking)
  useEffect(() => {
    if (initialContext) {
      if (initialContext.tab) {
        setTabAtual(initialContext.tab);
      }

      if (initialContext.modal === 'friends') {
        setModalFriends(true);
        if (initialContext.friendTab) {
          setFriendTab(initialContext.friendTab);
        }
      }

      // Buscar lembrete se id for fornecido (para visualizar ou selecionar data)
      if (initialContext.lembreteId || initialContext.highlightId) {
        const targetId = initialContext.lembreteId || initialContext.highlightId;
        // Procurar em todas as listas
        const targetLembrete =
          lembretes.find(l => l.id === targetId) ||
          expirados.find(l => l.id === targetId) ||
          lembretesRecebidos.find(l => l.id === targetId) ||
          finalizados.find(l => l.id === targetId);

        if (targetLembrete) {
          // Se for para visualizar, abrir modal
          if (initialContext.modal === 'view') {
            setModalVisualizar(targetLembrete);
          } else {
            // Navegação (Corpo do click)
            // Se tiver data, selecionar o dia (especialmente para disparados)
            if (targetLembrete.dataHora) {
              const dataLembrete = new Date(targetLembrete.dataHora);

              // Sempre selecionar o dia no calendário e ir para tab Meus
              setDiaSelecionado(dataLembrete);
              if (tabAtual !== 'meus') {
                setTabAtual('meus');
              }
              // Se tiver mudado de mês, atualizar mês também
              if (dataLembrete.getMonth() !== mesAtual.getMonth() || dataLembrete.getFullYear() !== mesAtual.getFullYear()) {
                setMesAtual(new Date(dataLembrete.getFullYear(), dataLembrete.getMonth(), 1));
              }
            }
          }
        }
      }

      if (onContextUsed) {
        onContextUsed();
      }
    }
  }, [initialContext, lembretes, expirados, lembretesRecebidos, finalizados]);

  // Estado de modais
  const [modalCriar, setModalCriar] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState<Lembrete | null>(null);
  const [lembreteEditando, setLembreteEditando] = useState<Lembrete | null>(null);
  const [modalConfirmacaoDelete, setModalConfirmacaoDelete] = useState(false);
  const [modalFriends, setModalFriends] = useState(false);
  const [friendTab, setFriendTab] = useState<'friends' | 'add' | 'requests'>('friends');

  // Estado para amigos (para o dropdown no modal)
  const [amigos, setAmigos] = useState<Friend[]>([]);
  const [destinatarioPreSelecionado, setDestinatarioPreSelecionado] = useState<{ uid: string; nome: string } | null>(null);

  // Carregar lista de amigos
  useEffect(() => {
    if (usuario?.uid) {
      listarAmigos(usuario.uid).then(setAmigos);
    }
  }, [usuario?.uid]);

  // Tab atual
  const [tabAtual, setTabAtual] = useState<'meus' | 'expirados' | 'recebidos' | 'concluidos'>('meus');

  // Estado para controlar últimas visualizações por ID
  const [viewedIds, setViewedIds] = useState<{
    expirados: string[];
    recebidos: string[];
    concluidos: string[];
  }>({
    expirados: [],
    recebidos: [],
    concluidos: []
  });

  // Ref para garantir que a inicialização ocorra apenas uma vez
  const initializedRef = useRef(false);

  // Inicializar viewedIds na primeira carga
  React.useEffect(() => {
    // Só roda quando terminar de carregar e se ainda não foi inicializado
    if (!loading && !initializedRef.current) {
      initializedRef.current = true;

      setViewedIds({
        expirados: expirados.map(l => l.id),
        recebidos: lembretesRecebidos.map(l => l.id),
        concluidos: finalizados.map(l => l.id)
      });
    }
  }, [loading, expirados, lembretesRecebidos, finalizados]);

  // Verificar se há itens não vistos (ID não está na lista de vistos)
  const hasUnreadExpirados = useMemo(() => {
    if (tabAtual === 'expirados') return false;
    return expirados.some(l => !viewedIds.expirados.includes(l.id));
  }, [expirados, viewedIds.expirados, tabAtual]);

  const hasUnreadRecebidos = useMemo(() => {
    if (tabAtual === 'recebidos') return false;
    return lembretesRecebidos.some(l => !viewedIds.recebidos.includes(l.id));
  }, [lembretesRecebidos, viewedIds.recebidos, tabAtual]);

  const hasUnreadConcluidos = useMemo(() => {
    if (tabAtual === 'concluidos') return false;
    return finalizados.some(l => !viewedIds.concluidos.includes(l.id));
  }, [finalizados, viewedIds.concluidos, tabAtual]);

  const handleTabChange = (tab: 'meus' | 'expirados' | 'recebidos' | 'concluidos') => {
    setTabAtual(tab);
    // Atualizar lista de IDs visualizados
    if (tab !== 'meus') {
      setViewedIds(prev => {
        let newIds: string[] = [];
        if (tab === 'expirados') newIds = expirados.map(l => l.id);
        if (tab === 'recebidos') newIds = lembretesRecebidos.map(l => l.id);
        if (tab === 'concluidos') newIds = finalizados.map(l => l.id);

        return {
          ...prev,
          [tab]: newIds
        };
      });
    }
  };

  // Gerar dias do calendário
  const diasCalendario = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();

    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const diasNoMes = ultimoDia.getDate();
    const diaDaSemanaInicio = primeiroDia.getDay();

    const dias: (Date | null)[] = [];

    // Dias vazios no início
    for (let i = 0; i < diaDaSemanaInicio; i++) {
      dias.push(null);
    }

    // Dias do mês
    for (let i = 1; i <= diasNoMes; i++) {
      dias.push(new Date(ano, mes, i));
    }

    return dias;
  }, [mesAtual]);

  // Lembretes por dia
  const lembretesPorDia = useMemo(() => {
    const mapa = new Map<string, Lembrete[]>();

    lembretes.forEach(lembrete => {
      // Ignorar finalizados no calendário
      if (lembrete.status === 'finalizado') return;

      const data = new Date(lembrete.dataHora);
      const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, []);
      }
      mapa.get(chave)!.push(lembrete);
    });

    return mapa;
  }, [lembretes]);

  // Lembretes do dia selecionado
  const lembretesDodia = useMemo(() => {
    if (!diaSelecionado) return [];

    const chave = `${diaSelecionado.getFullYear()}-${diaSelecionado.getMonth()}-${diaSelecionado.getDate()}`;
    return lembretesPorDia.get(chave) || [];
  }, [diaSelecionado, lembretesPorDia]);

  // Navegação do calendário
  const mesAnterior = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1));
  };

  const proximoMes = () => {
    setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1));
  };

  // Verificar se é hoje
  const ehHoje = (data: Date) => {
    const hoje = new Date();
    return data.getDate() === hoje.getDate() &&
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear();
  };

  // Verificar se é o dia selecionado
  const ehSelecionado = (data: Date) => {
    if (!diaSelecionado) return false;
    return data.getDate() === diaSelecionado.getDate() &&
      data.getMonth() === diaSelecionado.getMonth() &&
      data.getFullYear() === diaSelecionado.getFullYear();
  };

  // Handler para criar/editar
  const handleSalvar = async (dados: {
    titulo: string;
    descricao: string;
    dataHora: string;
    cor: CorLembrete;
    somNotificacao: SomNotificacao;
    destinatarioId?: string;
    destinatarioNome?: string;
    manterCopia?: boolean;
    telefone?: string;
  }) => {
    if (lembreteEditando) {
      await atualizar(lembreteEditando.id, dados);
    } else {
      // Se tem destinatário, criar e enviar para o amigo
      if (dados.destinatarioId && dados.destinatarioNome) {

        // Se escolheu manter cópia: cria dois lembretes
        if (dados.manterCopia) {
          // 1. Criar o MEU lembrete (pessoal)
          await criar({
            titulo: dados.titulo,
            descricao: dados.descricao,
            dataHora: dados.dataHora,
            cor: dados.cor,
            somNotificacao: dados.somNotificacao
          });

          // 2. Criar o lembrete para ENVIAR (separado)
          const lembreteParaEnviar = await criar({
            titulo: dados.titulo,
            descricao: dados.descricao,
            dataHora: dados.dataHora,
            cor: dados.cor,
            somNotificacao: dados.somNotificacao
          });

          // 3. Enviar o segundo lembrete
          if (lembreteParaEnviar && enviar) {
            await enviar(
              lembreteParaEnviar.id,
              dados.destinatarioId,
              dados.destinatarioNome,
              dados.titulo
            );
          }

        } else {
          // Se NÃO manter cópia: cria um e envia (ele some da lista "Meus" pois vira compartilhado)
          const novoLembrete = await criar({
            titulo: dados.titulo,
            descricao: dados.descricao,
            dataHora: dados.dataHora,
            cor: dados.cor,
            somNotificacao: dados.somNotificacao
          });
          // Enviar para o amigo
          if (novoLembrete && enviar) {
            await enviar(
              novoLembrete.id,
              dados.destinatarioId,
              dados.destinatarioNome,
              dados.titulo
            );
          }
        }

      } else {
        await criar(dados);
      }

      // Redirecionar para o dia do lembrete criado
      if (dados.dataHora) {
        const novaData = new Date(dados.dataHora);
        // Garantir que a hora não interfira na seleção do dia (embora o comparador use getDate/Month/Year)
        setDiaSelecionado(novaData);
        // Se mudou o mês/ano, atualizar o calendário
        if (novaData.getMonth() !== mesAtual.getMonth() || novaData.getFullYear() !== mesAtual.getFullYear()) {
          setMesAtual(new Date(novaData.getFullYear(), novaData.getMonth(), 1));
        }
        setTabAtual('meus');
      }
    }
    setModalCriar(false);
    setLembreteEditando(null);
    setDestinatarioPreSelecionado(null);
  };

  // Handler para aceitar lembrete recebido
  const handleAceitar = async (lembrete: Lembrete) => {
    await aceitar(lembrete);
  };

  // Handler para recusar lembrete recebido
  const handleRecusar = async (lembrete: Lembrete) => {
    await recusar(lembrete);
  };

  // Lista a exibir baseada na tab
  const listaAtual = useMemo(() => {
    switch (tabAtual) {
      case 'expirados':
        return expirados;
      case 'recebidos':
        return lembretesRecebidos;
      case 'concluidos':
        return finalizados;
      default:
        return diaSelecionado ? lembretesDodia : pendentes;
    }
  }, [tabAtual, expirados, lembretesRecebidos, diaSelecionado, lembretesDodia, pendentes]);

  // Scrollbar hide styles
  const scrollbarHideStyles = `
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;

  // Estado de seleção múltipla
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelectionMode = selectedIds.size > 0;

  const handleLongPress = (id: string) => {
    const newSelected = new Set(selectedIds);
    newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const cancelarSelecao = () => {
    setSelectedIds(new Set());
  };

  const concluirEmMassa = async () => {
    try {
      const idsParaConcluir = Array.from(selectedIds);
      await Promise.all(idsParaConcluir.map(id => finalizar(id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Erro ao concluir em massa:", error);
    }
  };

  const solicitarExclusaoEmMassa = () => {
    setModalConfirmacaoDelete(true);
  };

  const confirmarExclusaoEmMassa = async () => {
    try {
      // Deletar em lote usando Promise.all
      const idsParaDeletar = Array.from(selectedIds);
      await Promise.all(idsParaDeletar.map(id => deletar(id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Erro ao deletar em massa:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] w-full max-w-[1920px] mx-auto overflow-hidden relative">
      <style>{scrollbarHideStyles}</style>

      {/* Bulk Action Bar - Floating Pill */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 50, opacity: 0, x: '-50%' }}
            className="fixed bottom-8 left-1/2 bg-slate-900/90 backdrop-blur-md border border-white/10 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-6"
          >
            <div className="flex items-center gap-3 border-r border-white/20 pr-4">
              <span className="font-bold text-lg whitespace-nowrap">{selectedIds.size} selecionado(s)</span>
              <button
                onClick={cancelarSelecao}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Cancelar seleção"
              >
                <X size={18} />
              </button>
            </div>
            {tabAtual !== 'concluidos' && (
              <button
                onClick={concluirEmMassa}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/80 hover:bg-green-500 rounded-lg font-medium transition-colors shadow-sm"
                title="Concluir selecionados"
              >
                <CheckCircle size={18} />
                <span className="hidden sm:inline">Concluir</span>
              </button>
            )}
            <button
              onClick={solicitarExclusaoEmMassa}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg font-medium transition-colors shadow-sm"
              title="Excluir selecionados"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 delay-75 flex justify-between items-start"
      >
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            <Bell className="inline-block mr-3 text-cyan-400" size={32} />
            Lembretes
          </h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Gerencie seus lembretes e nunca esqueça compromissos importantes
          </p>
        </div>

        {/* Botão de Amigos do Header */}
        <button
          onClick={() => setModalFriends(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${theme === 'dark'
            ? 'bg-white/5 hover:bg-white/10 text-slate-300'
            : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border border-slate-200'
            }`}
        >
          <Users size={20} />
          <span className="hidden sm:inline font-medium">Amigos</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Calendário */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`lg:col-span-1 rounded-2xl border p-8 flex flex-col h-fit gap-6 ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-lg'
            }`}
        >
          {/* Header do calendário */}
          <div className="flex items-center justify-between mb-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={mesAnterior}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
            >
              <ChevronLeft size={20} className={theme === 'dark' ? 'text-white' : 'text-slate-700'} />
            </motion.button>

            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              {MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
            </h2>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={proximoMes}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
            >
              <ChevronRight size={20} className={theme === 'dark' ? 'text-white' : 'text-slate-700'} />
            </motion.button>
          </div>

          <div>
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DIAS_SEMANA.map(dia => (
                <div
                  key={dia}
                  className={`text-center text-xs font-medium py-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-1">
              {diasCalendario.map((data, index) => {
                if (!data) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
                const lembretesDoDia = lembretesPorDia.get(chave) || [];
                const temLembretes = lembretesDoDia.length > 0;

                return (
                  <motion.button
                    key={data.toISOString()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setDiaSelecionado(data);
                      setTabAtual('meus');
                    }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all ${ehSelecionado(data)
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : ehHoje(data)
                        ? theme === 'dark'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        : theme === 'dark'
                          ? 'hover:bg-white/10 text-white'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                  >
                    <span className="text-sm font-medium">{data.getDate()}</span>

                    {/* Indicadores de lembretes */}
                    {temLembretes && (
                      <div className="flex gap-0.5 mt-0.5">
                        {lembretesDoDia.slice(0, 3).map((l, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${COR_CLASSES[l.cor] || COR_CLASSES['rose']}`}
                          />
                        ))}
                        {lembretesDoDia.length > 3 && (
                          <span className="text-[8px] text-slate-400">+{lembretesDoDia.length - 3}</span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Resumo do dia e Botão Criar */}
          <div className="space-y-4">
            {diaSelecionado && (
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'
                }`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {diaSelecionado.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  {lembretesDodia.length} lembrete{lembretesDodia.length !== 1 ? 's' : ''}
                </p>

                {/* Relógio Preciso solicitado */}
                <div className={`mt-2 pt-2 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'} flex items-center gap-2`}>
                  <Clock size={14} className="text-cyan-500" />
                  <span className="font-mono text-sm font-medium tracking-wider text-cyan-500">
                    {useCurrentTime()}
                  </span>
                </div>
              </div>
            )}


            {/* Botão Criar Flutuante no canto esquerdo inferior do calendário */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setModalCriar(true)}
              className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center z-10"
              title="Criar Novo Lembrete"
            >
              <Plus size={28} />
            </motion.button>
          </div>
        </motion.div>

        {/* Lista de lembretes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`lg:col-span-2 min-h-0 rounded-2xl border h-full flex flex-col ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-lg'
            }`}
        >
          {/* Tabs */}
          <div className={`flex border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
            }`}>
            <button
              onClick={() => handleTabChange('meus')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${tabAtual === 'meus'
                ? theme === 'dark'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-cyan-600 border-b-2 border-cyan-600'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Calendar size={18} />
              {diaSelecionado ? 'Dia Selecionado' : 'Meus Lembretes'}
            </button>

            <button
              onClick={() => handleTabChange('expirados')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${tabAtual === 'expirados'
                ? theme === 'dark'
                  ? 'text-red-400 border-b-2 border-red-400'
                  : 'text-red-600 border-b-2 border-red-600'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <AlertCircle size={18} />
              Expirados
              {hasUnreadExpirados && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('recebidos')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${tabAtual === 'recebidos'
                ? theme === 'dark'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-purple-600 border-b-2 border-purple-600'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <Inbox size={18} />
              Recebidos ({lembretesRecebidos.length})
              {hasUnreadRecebidos && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange('concluidos')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${tabAtual === 'concluidos'
                ? theme === 'dark'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-green-600 border-b-2 border-green-600'
                : theme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <CheckCircle size={18} />
              Concluídos
              {hasUnreadConcluidos && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
                </span>
              )}
            </button>
          </div>

          {/* Conteúdo com rolagem e sem barra visível */}
          <div className="p-8 overflow-y-auto no-scrollbar flex-1 pb-4 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
              </div>
            ) : listaAtual.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bell size={64} className={theme === 'dark' ? 'text-slate-700' : 'text-slate-300'} />
                <p className={`mt-4 text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {tabAtual === 'expirados'
                    ? 'Nenhum lembrete expirado'
                    : tabAtual === 'recebidos'
                      ? 'Nenhum convite pendente'
                      : tabAtual === 'concluidos'
                        ? 'Nenhum lembrete concluído'
                        : 'Nenhum lembrete para este dia'}
                </p>
                {tabAtual === 'meus' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setModalCriar(true)}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/30"
                  >
                    <Plus className="inline mr-2" size={18} />
                    Criar Lembrete
                  </motion.button>
                )}
              </div>
            ) : tabAtual === 'recebidos' ? (
              // Lista de lembretes recebidos (pendentes de aceitação)
              <div className="space-y-4">
                {listaAtual.map(lembrete => (
                  <motion.div
                    key={lembrete.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${theme === 'dark'
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-purple-50 border-purple-200'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`}>
                          De: <span className="font-bold">{lembrete.remetenteNome || 'Usuário'}</span>
                        </p>
                        <h3 className={`text-xl font-bold mb-1 mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                          {lembrete.titulo}
                        </h3>
                        <p className={`opacity-85 line-clamp-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          {lembrete.descricao}
                        </p>
                        <p className={`text-sm mt-3 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                          }`}>
                          <Clock size={14} />
                          {new Date(lembrete.dataHora).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          // Se clicar em aceitar, ele vai para a lista principal
                          onClick={() => handleAceitar(lembrete)}
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500/30 backdrop-blur-md border border-green-500/30 text-white shadow-lg shadow-green-500/20 hover:bg-green-500 transition-all"
                          title="Aceitar Convite"
                        >
                          <Check size={22} strokeWidth={2.5} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRecusar(lembrete)}
                          className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500/30 backdrop-blur-md border border-red-500/30 text-white shadow-lg shadow-red-500/20 hover:bg-red-500 transition-all"
                          title="Recusar Convite"
                        >
                          <X size={22} strokeWidth={2.5} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Lista de lembretes normal
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {listaAtual.map(lembrete => (
                  <LembreteCard
                    key={lembrete.id}
                    lembrete={lembrete}
                    theme={theme}
                    onView={() => setModalVisualizar(lembrete)}
                    onEdit={() => {
                      if (isSelectionMode) {
                        handleSelect(lembrete.id);
                        return;
                      }
                      setLembreteEditando(lembrete);
                      setModalCriar(true);
                    }}
                    onDelete={() => deletar(lembrete.id)}
                    onFinish={() => finalizar(lembrete.id)}
                    readonly={tabAtual === 'concluidos'}
                    onLongPress={() => handleLongPress(lembrete.id)}
                    onSelect={() => handleSelect(lembrete.id)}
                    selected={selectedIds.has(lembrete.id)}
                    selectionMode={isSelectionMode}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal de Criar/Editar */}
      <AnimatePresence>
        {modalCriar && (
          <LembreteModal
            lembrete={lembreteEditando}
            dataPadrao={diaSelecionado}
            theme={theme}
            onSave={handleSalvar}
            onClose={() => {
              setModalCriar(false);
              setLembreteEditando(null);
              setDestinatarioPreSelecionado(null);
            }}
            onEnviar={enviar}
            buscarUsuarios={buscarUsuariosParaCompartilhar}
            amigos={amigos}
            destinatarioPreSelecionado={destinatarioPreSelecionado || undefined}
          />
        )}
      </AnimatePresence>

      {/* Modal de Visualização */}
      <AnimatePresence>
        {modalVisualizar && (
          <LembreteViewModal
            lembrete={modalVisualizar}
            theme={theme}
            onClose={() => setModalVisualizar(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal de Amigos */}
      <AnimatePresence>
        {modalFriends && usuarioAtual && (
          <FriendManager
            currentUser={usuarioAtual}
            theme={theme}
            onClose={() => {
              setModalFriends(false);
              setFriendTab('friends'); // Reset to default
            }}
            onEnviarLembrete={(friend) => {
              setModalFriends(false);
              setDestinatarioPreSelecionado({ uid: friend.id, nome: friend.name });
              setModalCriar(true);
            }}
            initialTab={friendTab}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={modalConfirmacaoDelete}
        onClose={() => setModalConfirmacaoDelete(false)}
        onConfirm={confirmarExclusaoEmMassa}
        title="Excluir Lembretes"
        message={`Tem certeza que deseja excluir ${selectedIds.size} lembrete(s)? Esta ação não pode ser desfeita.`}
        confirmText="Excluir Definitivamente"
        isDestructive={true}
      />
    </div>
  );
};

export default LembretesPage;
