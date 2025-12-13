import React, { useState, useMemo } from 'react';
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
  X
} from 'lucide-react';
import { Lembrete, CorLembrete, SomNotificacao } from '../types';
import { UseRemindersReturn } from '../hooks/useReminders';
import LembreteCard from './LembreteCard';
import LembreteModal from './LembreteModal';
import LembreteViewModal from './LembreteViewModal';

interface LembretesPageProps {
  remindersData: UseRemindersReturn;
  theme?: 'dark' | 'light';
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const COR_CLASSES: Record<CorLembrete, string> = {
  amarelo: 'bg-yellow-200',
  rosa: 'bg-pink-200',
  azul: 'bg-blue-200',
  verde: 'bg-green-200',
  laranja: 'bg-orange-200',
  roxo: 'bg-purple-200'
};

const LembretesPage: React.FC<LembretesPageProps> = ({ remindersData, theme = 'dark' }) => {
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
    hoje
  } = remindersData;

  // Estado do calendário
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(new Date());

  // Estado de modais
  const [modalCriar, setModalCriar] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState<Lembrete | null>(null);
  const [lembreteEditando, setLembreteEditando] = useState<Lembrete | null>(null);

  // Tab atual
  const [tabAtual, setTabAtual] = useState<'meus' | 'expirados' | 'recebidos'>('meus');

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
  }) => {
    if (lembreteEditando) {
      await atualizar(lembreteEditando.id, dados);
    } else {
      await criar(dados);
    }
    setModalCriar(false);
    setLembreteEditando(null);
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
      default:
        return diaSelecionado ? lembretesDodia : pendentes;
    }
  }, [tabAtual, expirados, lembretesRecebidos, diaSelecionado, lembretesDodia, pendentes]);

  return (
    <div className="p-8 w-full max-w-[1920px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
          <Bell className="inline-block mr-3 text-cyan-400" size={32} />
          Lembretes
        </h1>
        <p className={`mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          Gerencie seus lembretes e nunca esqueça compromissos importantes
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendário */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`lg:col-span-1 rounded-2xl border p-8 ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-lg'
            }`}
        >
          {/* Header do calendário */}
          <div className="flex items-center justify-between mb-4">
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
                  onClick={() => setDiaSelecionado(data)}
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
                          className={`w-1.5 h-1.5 rounded-full ${COR_CLASSES[l.cor]}`}
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

          {/* Resumo do dia */}
          {diaSelecionado && (
            <div className={`mt-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'
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
            </div>
          )}
        </motion.div>

        {/* Lista de lembretes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`lg:col-span-2 rounded-2xl border min-h-[500px] ${theme === 'dark'
            ? 'bg-slate-900/50 border-white/10'
            : 'bg-white border-slate-200 shadow-lg'
            }`}
        >
          {/* Tabs */}
          <div className={`flex border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
            }`}>
            <button
              onClick={() => setTabAtual('meus')}
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
              onClick={() => setTabAtual('expirados')}
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
              {expirados.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {expirados.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setTabAtual('recebidos')}
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
              Recebidos
              {lembretesRecebidos.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {lembretesRecebidos.length}
                </span>
              )}
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-8">
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
                      ? 'Nenhum lembrete recebido'
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
                          De: {lembrete.remetenteNome || 'Usuário'}
                        </p>
                        <h3 className={`text-lg font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                          }`}>
                          {lembrete.titulo}
                        </h3>
                        <p className={`mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          {lembrete.descricao}
                        </p>
                        <p className={`text-sm mt-2 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                          }`}>
                          <Clock size={14} />
                          {new Date(lembrete.dataHora).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAceitar(lembrete)}
                          className="p-2 bg-green-500 text-white rounded-lg shadow-lg"
                          title="Aceitar"
                        >
                          <Check size={20} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRecusar(lembrete)}
                          className="p-2 bg-red-500 text-white rounded-lg shadow-lg"
                          title="Recusar"
                        >
                          <X size={20} />
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
                      setLembreteEditando(lembrete);
                      setModalCriar(true);
                    }}
                    onDelete={() => deletar(lembrete.id)}
                    onFinish={() => finalizar(lembrete.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Botão flutuante para criar */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setModalCriar(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center text-white z-50"
        aria-label="Criar Lembrete"
      >
        <Plus size={28} />
      </motion.button>

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
            }}
            onEnviar={enviar}
            buscarUsuarios={buscarUsuariosParaCompartilhar}
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
    </div>
  );
};

export default LembretesPage;
