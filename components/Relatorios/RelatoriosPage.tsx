import React, { useState, useMemo } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { motion } from 'framer-motion';
import { FileDown, FileSpreadsheet, FileText, Image, Mail } from 'lucide-react';
import { RegistroAtendimento, StatusAtendimento, TipoSolicitante } from '../../types';
import LaudoDocument from './LaudoDocument';
import { exportToExcel } from './ExcelGenerator';
import { exportToTXT } from './TXTGenerator';
import { exportToPNG } from './PNGGenerator';
import EmailModal from './EmailModal';

interface RelatoriosPageProps {
  registros: RegistroAtendimento[];
  theme?: 'dark' | 'light';
  usuario: string;
}

const RelatoriosPage: React.FC<RelatoriosPageProps> = ({ registros, theme = 'dark', usuario }) => {
  // Definir período padrão (mês atual)
  const getDataInicioMesAtual = () => {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return `${primeiroDia.getFullYear()}-${String(primeiroDia.getMonth() + 1).padStart(2, '0')}-${String(primeiroDia.getDate()).padStart(2, '0')}`;
  };

  const getDataFimAtual = () => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  };

  // States for filters
  // States for filters
  const [dataInicio, setDataInicio] = useState('2025-01-01');
  const [dataFim, setDataFim] = useState(getDataFimAtual());
  const [status, setStatus] = useState<StatusAtendimento | 'Nenhum' | 'Todos'>('Nenhum');
  const [tipo, setTipo] = useState<TipoSolicitante | 'Nenhum' | 'Todos'>('Nenhum');
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string | null>('todo');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Filter Logic
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      const dataRegistro = new Date(r.dataHora);
      dataRegistro.setHours(0, 0, 0, 0); // Normalizar para início do dia

      const dataInicioDate = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
      const dataFimDate = dataFim ? new Date(dataFim + 'T23:59:59') : null;

      const matchInicio = !dataInicioDate || dataRegistro >= new Date(dataInicioDate.setHours(0, 0, 0, 0));
      const matchFim = !dataFimDate || new Date(r.dataHora) <= dataFimDate;
      const matchStatus = status === 'Todos' || r.status === status;
      const matchTipo = tipo === 'Todos' || r.tipoSolicitante === tipo;

      return matchInicio && matchFim && matchStatus && matchTipo;
    }).sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  }, [registros, dataInicio, dataFim, status, tipo]);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-3xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            Relatório de Atendimentos
          </h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Relatório detalhado de atendimentos e chamados
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => exportToTXT(registrosFiltrados, `Laudo_ShadowDesk_${new Date().getTime()}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold shadow-lg text-sm ${theme === 'dark'
              ? 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border border-slate-500/20'
              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
          >
            <FileText size={18} />
            TXT
          </button>

          <button
            onClick={() => exportToExcel(registrosFiltrados, `Laudo_ShadowDesk_${new Date().getTime()}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold shadow-lg text-sm ${theme === 'dark'
              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
          >
            <FileSpreadsheet size={18} />
            Excel
          </button>

          <button
            onClick={() => exportToPNG('report-visible-content', `Laudo_ShadowDesk_${new Date().getTime()}`)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold shadow-lg text-sm ${theme === 'dark'
              ? 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
          >
            <Image size={18} />
            PNG
          </button>

          <PDFDownloadLink
            document={<LaudoDocument registros={registrosFiltrados} usuario={usuario} />}
            fileName={`Laudo_ShadowDesk_${new Date().getTime()}.pdf`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold shadow-lg text-sm ${theme === 'dark'
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
          >
            {({ loading }) => (
              <>
                <FileDown size={18} />
                {loading ? '...' : 'PDF'}
              </>
            )}
          </PDFDownloadLink>
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold shadow-lg text-sm ${theme === 'dark'
              ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
          >
            <Mail size={18} />
            Email
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border ${theme === 'dark'
          ? 'bg-white/5 border-white/10 backdrop-blur-sm'
          : 'bg-white border-slate-200 shadow-lg'
          }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Period Filter */}
          <div className="lg:col-span-2">
            <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Período
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm border-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all ${theme === 'dark'
                  ? 'bg-slate-700 border-white/30 text-white focus:border-cyan-500'
                  : 'bg-white border-slate-200 text-slate-700 focus:border-cyan-500'
                  }`}
              />
              <span className={`font-bold text-center sm:text-left ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>→</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm border-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all ${theme === 'dark'
                  ? 'bg-slate-700 border-white/30 text-white focus:border-cyan-500'
                  : 'bg-white border-slate-200 text-slate-700 focus:border-cyan-500'
                  }`}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={() => {
                  const hoje = new Date();
                  const primeiroDiaMesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                  const ultimoDiaMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

                  const dataInicio = `${primeiroDiaMesPassado.getFullYear()}-${String(primeiroDiaMesPassado.getMonth() + 1).padStart(2, '0')}-${String(primeiroDiaMesPassado.getDate()).padStart(2, '0')}`;
                  const dataFim = `${ultimoDiaMesPassado.getFullYear()}-${String(ultimoDiaMesPassado.getMonth() + 1).padStart(2, '0')}-${String(ultimoDiaMesPassado.getDate()).padStart(2, '0')}`;

                  setDataInicio(dataInicio);
                  setDataFim(dataFim);
                  setPeriodoSelecionado('mesPassado');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${periodoSelecionado === 'mesPassado'
                  ? theme === 'dark' ? 'bg-cyan-400/40 text-cyan-300 border border-cyan-400/60' : 'bg-cyan-500 text-white border-2 border-cyan-600'
                  : theme === 'dark'
                    ? 'bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/40 shadow-cyan-400/20'
                    : 'bg-cyan-400/20 text-cyan-600 hover:bg-cyan-400/30 border border-cyan-400/30'
                  }`}
              >
                Mês Passado
              </button>
              <button
                onClick={() => {
                  const hoje = new Date();
                  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

                  const dataInicio = `${primeiroDia.getFullYear()}-${String(primeiroDia.getMonth() + 1).padStart(2, '0')}-${String(primeiroDia.getDate()).padStart(2, '0')}`;
                  const dataFim = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

                  setDataInicio(dataInicio);
                  setDataFim(dataFim);
                  setPeriodoSelecionado('mes');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${periodoSelecionado === 'mes'
                  ? theme === 'dark' ? 'bg-cyan-400/40 text-cyan-300 border border-cyan-400/60' : 'bg-cyan-500 text-white border-2 border-cyan-600'
                  : theme === 'dark'
                    ? 'bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/40 shadow-cyan-400/20'
                    : 'bg-cyan-400/20 text-cyan-600 hover:bg-cyan-400/30 border border-cyan-400/30'
                  }`}
              >
                Este Mês
              </button>
              <button
                onClick={() => {
                  const hoje = new Date();
                  const diaSemana = hoje.getDay();
                  const primeiroDiaSemana = new Date(hoje);
                  primeiroDiaSemana.setDate(hoje.getDate() - diaSemana);

                  const dataInicio = `${primeiroDiaSemana.getFullYear()}-${String(primeiroDiaSemana.getMonth() + 1).padStart(2, '0')}-${String(primeiroDiaSemana.getDate()).padStart(2, '0')}`;
                  const dataFim = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

                  setDataInicio(dataInicio);
                  setDataFim(dataFim);
                  setPeriodoSelecionado('semana');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${periodoSelecionado === 'semana'
                  ? theme === 'dark' ? 'bg-cyan-400/40 text-cyan-300 border border-cyan-400/60' : 'bg-cyan-500 text-white border-2 border-cyan-600'
                  : theme === 'dark'
                    ? 'bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/40 shadow-cyan-400/20'
                    : 'bg-cyan-400/20 text-cyan-600 hover:bg-cyan-400/30 border border-cyan-400/30'
                  }`}
              >
                Esta Semana
              </button>
              <button
                onClick={() => {
                  const hoje = new Date();
                  const ontem = new Date(hoje);
                  ontem.setDate(hoje.getDate() - 1);

                  const dataOntem = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`;

                  setDataInicio(dataOntem);
                  setDataFim(dataOntem);
                  setPeriodoSelecionado('ontem');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${periodoSelecionado === 'ontem'
                  ? theme === 'dark' ? 'bg-cyan-400/40 text-cyan-300 border border-cyan-400/60' : 'bg-cyan-500 text-white border-2 border-cyan-600'
                  : theme === 'dark'
                    ? 'bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/40 shadow-cyan-400/20'
                    : 'bg-cyan-400/20 text-cyan-600 hover:bg-cyan-400/30 border border-cyan-400/30'
                  }`}
              >
                Ontem
              </button>
              <button
                onClick={() => {
                  const hoje = new Date();
                  const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

                  setDataInicio(dataHoje);
                  setDataFim(dataHoje);
                  setPeriodoSelecionado('hoje');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${periodoSelecionado === 'hoje'
                  ? theme === 'dark' ? 'bg-cyan-400/40 text-cyan-300 border border-cyan-400/60' : 'bg-cyan-500 text-white border-2 border-cyan-600'
                  : theme === 'dark'
                    ? 'bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30 border border-cyan-400/40 shadow-cyan-400/20'
                    : 'bg-cyan-400/20 text-cyan-600 hover:bg-cyan-400/30 border border-cyan-400/30'
                  }`}
              >
                Hoje
              </button>
              <button
                onClick={() => {
                  const hoje = new Date();
                  const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

                  // Define data inicial como 01 de janeiro de 2025
                  setDataInicio('2025-01-01');
                  setDataFim(dataHoje);
                  setPeriodoSelecionado('todo');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${periodoSelecionado === 'todo'
                  ? 'bg-[rgb(254,85,85)] text-white border-2 border-[rgb(254,85,85)]'
                  : theme === 'dark'
                    ? 'bg-[rgb(254,85,85)]/20 text-[rgb(254,85,85)] hover:bg-[rgb(254,85,85)]/30 border border-[rgb(254,85,85)]/40'
                    : 'bg-[rgb(254,85,85)]/20 text-[rgb(200,60,60)] hover:bg-[rgb(254,85,85)]/30 border border-[rgb(254,85,85)]/30'
                  }`}
              >
                Todo Período
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className={`w-full rounded-xl px-4 py-3 text-sm border-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all ${theme === 'dark'
                ? 'bg-slate-700 border-white/30 text-white focus:border-cyan-500'
                : 'bg-white border-slate-200 text-slate-700 focus:border-cyan-500'
                }`}
            >
              <option value="Nenhum">Nenhum</option>
              <option value="Pendente">Pendente</option>
              <option value="Atendido">Atendido</option>
              <option value="Todos">Todos</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Vínculo
            </label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value as any)}
              className={`w-full rounded-xl px-4 py-3 text-sm border-2 focus:ring-2 focus:ring-cyan-500 outline-none transition-all ${theme === 'dark'
                ? 'bg-slate-700 border-white/30 text-white focus:border-cyan-500'
                : 'bg-white border-slate-200 text-slate-700 focus:border-cyan-500'
                }`}
            >
              <option value="Nenhum">Nenhum</option>
              <option value="Docente">Docente</option>
              <option value="Aluno">Aluno</option>
              <option value="Aluno - Educação Especial">Aluno - Educação Especial</option>
              <option value="Aluno - Permanência">Aluno - Permanência</option>
              <option value="Servidor">Servidor</option>
              <option value="Estagiário">Estagiário</option>
              <option value="Visitante">Visitante</option>
              <option value="Faxineiro(a)">Faxineiro(a)</option>
              <option value="Médico">Médico</option>
              <option value="Secretário(a)">Secretário(a)</option>
              <option value="Terceirizado">Terceirizado</option>
              <option value="Outro">Outro</option>
              <option value="Todos">Todos</option>
            </select>
          </div>
        </div>

        <div className={`flex justify-end mt-6 pt-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Registros Encontrados
              </p>
              <p className={`text-3xl font-bold leading-none mt-1 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {registrosFiltrados.length}
              </p>
            </div>
            <div className={`p-3 rounded-2xl shadow-lg shadow-cyan-500/10 ${theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'}`}>
              <FileText size={28} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* PDF Viewer */}
      <div className={`flex-1 rounded-2xl border-2 overflow-hidden shadow-2xl ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'
        }`}>
        <PDFViewer className="w-full h-full border-none">
          <LaudoDocument registros={registrosFiltrados} usuario={usuario} />
        </PDFViewer>
      </div>

      {/* Hidden container for PNG generation */}
      <div
        id="report-visible-content"
        className="fixed top-0 left-[-9999px] bg-white p-8 w-[800px] text-slate-800"
        style={{ zIndex: -50 }}
      >
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">Relatório de Atendimentos</h1>
            <p className="text-sm text-slate-500 mt-1">ShadowDesk - Relatório de Atendimentos</p>
          </div>
          <div className="text-right text-xs">
            <p className="font-bold">Gerado em:</p>
            <p>{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {registrosFiltrados.map((item, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50 break-inside-avoid">
              <div className="flex justify-between items-start mb-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Solicitante</span>
                  <span className="font-semibold text-slate-800">{item.nomeSolicitante}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase block">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'Concluído' || item.status === 'Atendido' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Data/Hora</span>
                  <span className="text-sm">{new Date(item.dataHora).toLocaleString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Local</span>
                  <span className="text-sm">{item.local}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Vínculo</span>
                  <span className="text-sm">{item.tipoSolicitante}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Contato</span>
                  <span className="text-sm">{item.contato || '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Descrição</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.descricaoRequisicao}</p>
              </div>
            </div>
          ))}

          {registrosFiltrados.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Nenhum registro encontrado para o filtro selecionado.
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          <p>Documento gerado eletronicamente pelo sistema ShadowDesk.</p>
        </div>
      </div>
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        registros={registrosFiltrados}
        usuario={usuario}
        theme={theme}
      />
    </div>
  );
};

export default RelatoriosPage;
