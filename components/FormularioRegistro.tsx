import React, { useState, useEffect } from 'react';
import { User, MapPin, FileText, Calendar, Save, AlertCircle, ChevronDown, CheckCircle2, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { TipoSolicitante, StatusAtendimento } from '../types';
import { isoParaDatetimeLocal, obterDataHoraAtual } from '../utils/helpers';
import { useLocais } from '../hooks/useLocais';
import LocalSelector from './LocalSelector';
import ModalGerenciarLocais from './ModalGerenciarLocais';

interface FormularioRegistroProps {
  onSalvar: (dados: any) => Promise<void>;
  usuarioAtual: string;
  registroInicial?: any;
  theme?: 'dark' | 'light';
}

const FormularioRegistro: React.FC<FormularioRegistroProps> = ({
  onSalvar,
  usuarioAtual,
  registroInicial,
  theme = 'dark'
}) => {
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [modalLocaisAberto, setModalLocaisAberto] = useState(false);
  const [fixarTexto, setFixarTexto] = useState(false);
  const [usarHorarioAtual, setUsarHorarioAtual] = useState(false);

  // Hook para gerenciar locais
  const {
    locais,
    carregando: carregandoLocais,
    criar: criarLocal,
    atualizar: atualizarLocal,
    deletar: deletarLocal,
    inicializarPadrao
  } = useLocais(usuarioAtual);


  const [nomeSolicitante, setNomeSolicitante] = useState(registroInicial?.nomeSolicitante || '');
  const [tipoSolicitante, setTipoSolicitante] = useState<TipoSolicitante>(registroInicial?.tipoSolicitante || 'Aluno');
  const [local, setLocal] = useState(registroInicial?.local || '');
  const [descricaoRequisicao, setDescricaoRequisicao] = useState(registroInicial?.descricaoRequisicao || '');
  const [dataHora, setDataHora] = useState(
    registroInicial?.dataHora
      ? isoParaDatetimeLocal(registroInicial.dataHora)
      : isoParaDatetimeLocal(obterDataHoraAtual())
  );
  const [status, setStatus] = useState<StatusAtendimento>(registroInicial?.status || 'Atendido');
  const [email, setEmail] = useState(registroInicial?.email || '');
  const [telefone, setTelefone] = useState(registroInicial?.telefone || '');

  useEffect(() => {
    if (registroInicial) {
      setNomeSolicitante(registroInicial.nomeSolicitante);
      setTipoSolicitante(registroInicial.tipoSolicitante);
      setLocal(registroInicial.local);
      setDescricaoRequisicao(registroInicial.descricaoRequisicao);
      setDataHora(isoParaDatetimeLocal(registroInicial.dataHora));
      setStatus(registroInicial.status);
      setEmail(registroInicial.email || '');
      setTelefone(registroInicial.telefone || '');
    } else {
      setNomeSolicitante('');
      setTipoSolicitante('Aluno');
      setLocal('');
      setDescricaoRequisicao('');
      setDataHora(isoParaDatetimeLocal(obterDataHoraAtual()));
      setStatus('Atendido');
      setEmail('');
      setTelefone('');
    }
  }, [registroInicial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);
    setCarregando(true);

    try {
      await onSalvar({
        nomeSolicitante: nomeSolicitante.trim(),
        tipoSolicitante,
        local: local.trim(),
        descricaoRequisicao: descricaoRequisicao.trim(),
        dataHora: new Date(usarHorarioAtual ? obterDataHoraAtual() : dataHora).toISOString(),
        status,
        email: email.trim(),
        telefone: telefone.trim(),
        criadoPor: usuarioAtual,
      });

      setSucesso(true);

      // Limpar formulário após 1.5s
      setTimeout(() => {
        if (!registroInicial) {
          if (!fixarTexto) {
            setNomeSolicitante('');
            setTipoSolicitante('Aluno');
            setLocal('');
            setDescricaoRequisicao('');
            // setDataHora(isoParaDatetimeLocal(obterDataHoraAtual())); // Mantenho a data atual ou atualizo? 
            // Se fixar texto, talvez queira manter a data do form anterior? Não, "proxima solicitação" usually implica novo registro.
            // Mas se "mantém o que foi escrito", talvez o usuário queira mudar só o nome.
            // Vou assumir que se o texto está fixado, TUDO está fixado, exceto talvez IDs internos se houvesse.
            // Mas como é um novo POST, resetar para data atual faz sentido se não estiver fixado.
            // Se estiver fixado, mantém a data que estava lá (que agora é passado).
          }
          if (!fixarTexto) {
            setDataHora(isoParaDatetimeLocal(obterDataHoraAtual()));
            setStatus('Atendido');
            setEmail('');
            setTelefone('');
          }
        }
        setSucesso(false);
      }, 1500);

    } catch (error: any) {
      setErro(error.message || 'Erro ao salvar registro');
    } finally {
      setCarregando(false);
    }
  };

  const tiposSolicitante: TipoSolicitante[] = ['Docente', 'Aluno', 'Aluno - Educação Especial', 'Aluno - Permanência', 'Servidor', 'Estagiário', 'Visitante', 'Faxineiro(a)', 'Médico', 'Secretário(a)', 'Terceirizado', 'Outro'];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`flex flex-col h-[calc(100vh-8rem)] rounded-2xl border shadow-2xl transition-colors duration-300 overflow-hidden ${theme === 'dark'
        ? 'border-white/10 bg-slate-900/80 shadow-black/20'
        : 'border-slate-200 bg-white shadow-slate-200/50'
        }`}
    >
      <div className={`flex justify-between items-center p-6 border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
        <h3 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <span className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
          {registroInicial ? 'Editar Registro' : 'Novo Registro'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Nome do Solicitante *
            </label>
            <div className="relative group">
              <input
                type="text"
                value={nomeSolicitante}
                onChange={(e) => setNomeSolicitante(e.target.value)}
                placeholder="Ex: Prof. João Silva"
                className={`w-full rounded-xl border h-11 pl-10 pr-4 focus:outline-none transition-all ${theme === 'dark'
                  ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-600'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
                  }`}
                required
              />
              <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-cyan-500`} size={18} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Vínculo *
            </label>
            <div className="relative group">
              <select
                value={tipoSolicitante}
                onChange={(e) => setTipoSolicitante(e.target.value as TipoSolicitante)}
                className={`w-full appearance-none rounded-xl border h-11 pl-4 pr-10 focus:outline-none transition-all cursor-pointer ${theme === 'dark'
                  ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                  }`}
              >
                {tiposSolicitante.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
              <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-cyan-500`} size={18} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Local / Setor *
            </label>
            <LocalSelector
              value={local}
              onChange={setLocal}
              locais={locais}
              onGerenciar={() => setModalLocaisAberto(true)}
              theme={theme}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Email (Opcional)
            </label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@unesp.br"
                className={`w-full rounded-xl border h-11 pl-10 pr-4 focus:outline-none transition-all ${theme === 'dark'
                  ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-600'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
                  }`}
              />
              <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-cyan-500`} size={18} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Celular / Ramal (Opcional)
            </label>
            <div className="relative group">
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className={`w-full rounded-xl border h-11 pl-10 pr-4 focus:outline-none transition-all ${theme === 'dark'
                  ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-600'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
                  }`}
              />
              <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-cyan-500`} size={18} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Data e Hora *
            </label>
            <div className="relative group">
              <input
                type="datetime-local"
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
                disabled={usarHorarioAtual}
                className={`w-full rounded-xl border h-11 pl-10 pr-4 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                  ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                  }`}
                required={!usarHorarioAtual}
              />
              <Calendar className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-cyan-500`} size={18} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-h-[100px]">
          <div className="flex justify-between items-end ml-1">
            <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Descrição da Requisição *
            </label>
            <div className="flex items-center gap-6 mb-2.5">
              <button
                type="button"
                onClick={() => setUsarHorarioAtual(!usarHorarioAtual)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${usarHorarioAtual
                  ? 'text-cyan-500'
                  : (theme === 'dark' ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')
                  }`}
              >
                <div className={`w-8 h-4 rounded-full relative transition-colors ${usarHorarioAtual ? 'bg-cyan-500/20' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')
                  }`}>
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${usarHorarioAtual
                      ? 'bg-cyan-500 left-4.5'
                      : 'bg-slate-400 left-0.5'
                      }`}
                    style={{ left: usarHorarioAtual ? '1.125rem' : '0.125rem' }}
                  />
                </div>
                Horário atual
              </button>
              <button
                type="button"
                onClick={() => setFixarTexto(!fixarTexto)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${fixarTexto
                  ? 'text-cyan-500'
                  : (theme === 'dark' ? 'text-slate-500 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')
                  }`}
              >
                <div className={`w-8 h-4 rounded-full relative transition-colors ${fixarTexto ? 'bg-cyan-500/20' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200')
                  }`}>
                  <div
                    className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${fixarTexto
                      ? 'bg-cyan-500 left-4.5'
                      : 'bg-slate-400 left-0.5'
                      }`}
                    style={{ left: fixarTexto ? '1.125rem' : '0.125rem' }}
                  />
                </div>
                Fixar as informações
              </button>
            </div>
          </div>
          <div className="relative group flex-1">
            <textarea
              value={descricaoRequisicao}
              onChange={(e) => setDescricaoRequisicao(e.target.value)}
              placeholder="Descreva o problema ou solicitação..."
              className={`w-full h-full rounded-xl border p-4 focus:outline-none transition-all resize-none ${theme === 'dark'
                ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-600'
                : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
                }`}
              required
            ></textarea>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 items-end mt-auto pt-2">
          <div className="col-span-4 flex flex-col gap-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Status *
            </label>
            <div className="relative group">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAtendimento)}
                className={`w-full appearance-none rounded-xl border h-12 pl-4 pr-10 focus:outline-none transition-all cursor-pointer ${theme === 'dark'
                  ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80'
                  : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white'
                  }`}
              >
                <option value="Pendente">Pendente</option>
                <option value="Atendido">Atendido</option>
              </select>
              <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-cyan-500`} size={18} />
            </div>
          </div>

          <div className="col-span-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={carregando}
              className="w-full flex items-center justify-center rounded-xl h-12 bg-gradient-to-r from-cyan-500 to-blue-600 text-white gap-3 text-base font-bold tracking-wide transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {carregando ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Save size={20} className="group-hover:scale-110 transition-transform" />
                  {registroInicial ? 'Atualizar' : 'Salvar Registro'}
                </>
              )}
            </motion.button>
          </div>
        </div>



        {/* Mensagens de Erro/Sucesso */}
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle size={16} />
            <span>{erro}</span>
          </motion.div>
        )}

        {sucesso && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
          >
            <CheckCircle2 size={16} />
            <span>Registro salvo com sucesso!</span>
          </motion.div>
        )}
      </form>

      {/* Modal de Gerenciamento de Locais */}
      <ModalGerenciarLocais
        isOpen={modalLocaisAberto}
        onClose={() => setModalLocaisAberto(false)}
        locais={locais}
        onAdicionar={async (nome) => await criarLocal(nome, usuarioAtual)}
        onEditar={atualizarLocal}
        onDeletar={deletarLocal}
        theme={theme}
      />
    </motion.section >
  );
};

export default FormularioRegistro;
