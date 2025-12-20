import React from 'react';
import { motion } from 'framer-motion';
import { Estatisticas, Lembrete } from '../types';
import { TrendingUp, Clock, CheckCircle2, BarChart3, Calendar } from 'lucide-react';
import { obterDiasRestantesEncerramento } from '../utils/helpers';
import ReminderTicker from './ReminderTicker';

interface DashboardProps {
  estatisticas: Estatisticas;
  theme?: 'dark' | 'light';
  proximoLembrete?: Lembrete | null;
  onLembreteClick?: () => void;
  onEncerramentoClick?: (data: Date) => void;
}

const StatCard: React.FC<{
  titulo: string;
  valor: number;
  subtitulo?: string;
  icon: React.ReactNode;
  cor: string;
  sombraCor: string;
  delay?: number;
  theme?: 'dark' | 'light';
}> = ({ titulo, valor, subtitulo, icon, cor, sombraCor, delay = 0, theme = 'dark' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      style={{
        boxShadow: theme === 'light' ? undefined : undefined
      }}
      className={`relative rounded-xl border p-6 overflow-hidden group cursor-pointer transition-all duration-300 ${theme === 'dark'
        ? 'border-white/10 bg-slate-900/50 hover:border-white/20'
        : `border-slate-100 bg-white shadow-sm hover:shadow-xl ${sombraCor}`
        }`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cor} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
            {titulo}
          </p>
          <p className={`text-4xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
            {valor}
          </p>
          {subtitulo && (
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 font-medium'
              }`}>
              {subtitulo}
            </p>
          )}
        </div>
        <div className="relative p-3 rounded-xl">
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${cor} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
          <div className="relative z-10">
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ estatisticas, theme = 'dark', proximoLembrete, onLembreteClick, onEncerramentoClick }) => {
  const { diasRestantes, dataEncerramento, progressoMes } = obterDiasRestantesEncerramento();

  // Lógica de destaque do card de encerramento
  const mostrarBordaAnimada = diasRestantes <= 7;
  const isUrgente = diasRestantes <= 3;
  const corBorda = isUrgente ? "#ef4444" : "#f97316"; // Red or Orange
  const duracaoAnimacao = isUrgente ? 1.5 : 3;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h2 className={`text-3xl font-bold tracking-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
            Dashboard
          </h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
            Visão geral dos atendimentos registrados
          </p>
        </div>

        {/* Ticker de Lembrete ao lado direito */}
        {proximoLembrete && (
          <div className="hidden md:block">
            <ReminderTicker
              lembrete={proximoLembrete}
              theme={theme}
              onClick={onLembreteClick}
            />
          </div>
        )}

        {/* Ticker visível apenas em mobile (abaixo do título) */}
        {proximoLembrete && (
          <div className="md:hidden w-full">
            <ReminderTicker
              lembrete={proximoLembrete}
              theme={theme}
              onClick={onLembreteClick}
            />
          </div>
        )}
      </motion.div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          titulo="Total Geral"
          valor={estatisticas.total}
          subtitulo="Todos os registros"
          icon={<BarChart3 size={24} className="text-white" />}
          cor="from-blue-500 to-cyan-500"
          sombraCor="hover:shadow-cyan-500/20"
          delay={0.1}
          theme={theme}
        />

        <StatCard
          titulo="Pendentes"
          valor={estatisticas.pendentes}
          subtitulo="Total registrado"
          icon={<Clock size={24} className="text-white" />}
          cor="from-yellow-500 to-orange-500"
          sombraCor="hover:shadow-orange-500/20"
          delay={0.2}
          theme={theme}
        />

        <StatCard
          titulo="Atendidos"
          valor={estatisticas.atendidos}
          subtitulo="Total registrado"
          icon={<CheckCircle2 size={24} className="text-white" />}
          cor="from-green-500 to-emerald-500"
          sombraCor="hover:shadow-emerald-500/20"
          delay={0.3}
          theme={theme}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
          style={{
            boxShadow: theme === 'light' ? undefined : undefined
          }}
          onClick={() => onEncerramentoClick?.(dataEncerramento)}
          className={`relative rounded-xl border p-6 overflow-hidden group cursor-pointer transition-all duration-300 ${theme === 'dark'
            ? 'border-white/10 bg-slate-900/50 hover:border-white/20'
            : 'border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-rose-500/20'
            }`}>
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>

          {/* Animated Border Line - Conditional */}
          {mostrarBordaAnimada && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-xl overflow-visible">
              <motion.rect
                x="2"
                y="2"
                width="calc(100% - 4px)"
                height="calc(100% - 4px)"
                rx="10"
                fill="none"
                stroke={corBorda}
                strokeWidth="3"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="0.35 0.65"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -1 }}
                transition={{
                  duration: duracaoAnimacao,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </svg>
          )}

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                Encerramento de Chamados
              </p>
              <div className="flex items-baseline gap-2">
                <p className={`text-4xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>
                  {diasRestantes}
                </p>
                <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'
                  }`}>Dias Restantes</span>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600 font-medium'
                }`}>
                Até {dataEncerramento.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Círculo de Progresso Animado */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className={theme === 'dark' ? "text-slate-700" : "text-slate-200"}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: obterDiasRestantesEncerramento().progressoMes / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className="text-rose-500"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="100, 100"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-rose-400">
                <Calendar size={18} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Resumo Detalhado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className={`rounded-2xl border p-8 backdrop-blur-md transition-colors duration-300 ${theme === 'dark'
          ? 'border-white/10 bg-white/5'
          : 'border-slate-200 bg-white shadow-sm'
          }`}
      >
        <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}>
          <span className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
          Resumo por Período
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hoje */}
          <div className={`flex flex-col gap-3 p-4 rounded-xl border transition-colors duration-300 ${theme === 'dark'
            ? 'bg-white/5 border-white/5'
            : 'bg-slate-50 border-slate-200'
            }`}>
            <p className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
              Hoje
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-500 text-2xl font-bold">
                  {estatisticas.hoje.atendidos}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 font-medium'
                  }`}>Atendidos</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-500 text-2xl font-bold">
                  {estatisticas.hoje.pendentes}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 font-medium'
                  }`}>Pendentes</p>
              </div>
            </div>
          </div>

          {/* Esta Semana */}
          <div className={`flex flex-col gap-3 p-4 rounded-xl border transition-colors duration-300 ${theme === 'dark'
            ? 'bg-white/5 border-white/5'
            : 'bg-slate-50 border-slate-200'
            }`}>
            <p className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
              Esta Semana
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-500 text-2xl font-bold">
                  {estatisticas.semana.atendidos}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 font-medium'
                  }`}>Atendidos</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-500 text-2xl font-bold">
                  {estatisticas.semana.pendentes}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 font-medium'
                  }`}>Pendentes</p>
              </div>
            </div>
          </div>

          {/* Este Mês */}
          <div className={`flex flex-col gap-3 p-4 rounded-xl border transition-colors duration-300 ${theme === 'dark'
            ? 'bg-white/5 border-white/5'
            : 'bg-slate-50 border-slate-200'
            }`}>
            <p className={`text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
              Este Mês
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-500 text-2xl font-bold">
                  {estatisticas.mes.atendidos}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 font-medium'
                  }`}>Atendidos</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-500 text-2xl font-bold">
                  {estatisticas.mes.pendentes}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400 font-medium'
                  }`}>Pendentes</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div >
  );
};

export default Dashboard;
