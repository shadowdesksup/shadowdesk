import React, { useState } from 'react';
import { User as UserIcon, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from 'firebase/auth';
import { atualizarSenhaUsuario, atualizarPerfilUsuario, UserData } from '../firebase/auth';

interface ProfilePageProps {
  usuario: User;
  dadosUsuario: UserData | null;
  theme?: 'dark' | 'light';
}

const ProfilePage: React.FC<ProfilePageProps> = ({ usuario, dadosUsuario, theme = 'dark' }) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    setCarregando(true);

    try {
      await atualizarSenhaUsuario(usuario, novaSenha);
      setSucesso('Senha atualizada com sucesso!');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      setErro(error.message || 'Erro ao atualizar senha. Talvez seja necessário fazer login novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // State for Profile Update
  const [nome, setNome] = useState(dadosUsuario?.nomeCompleto || usuario.displayName || '');
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);

  // Update effect when data loads
  React.useEffect(() => {
    if (dadosUsuario?.nomeCompleto) {
      setNome(dadosUsuario.nomeCompleto);
    } else if (usuario.displayName) {
      setNome(usuario.displayName);
    }
  }, [dadosUsuario, usuario]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!nome.trim()) {
      setErro('O nome não pode estar vazio');
      return;
    }

    setCarregandoPerfil(true);
    try {
      await atualizarPerfilUsuario(usuario, nome.trim());
      setSucesso('Perfil atualizado com sucesso!');
    } catch (error: any) {
      setErro(error.message || 'Erro ao atualizar perfil.');
    } finally {
      setCarregandoPerfil(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className={`text-3xl font-bold tracking-tight mb-2 flex items-center gap-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <UserIcon className="text-cyan-400" size={32} />
          Meu Perfil
        </h2>
        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Gerencie suas informações e segurança
        </p>
      </div>

      {/* Info Card */}
      <div className={`rounded-2xl border p-8 transition-colors duration-300 ${theme === 'dark'
        ? 'border-white/10 bg-slate-900/30 backdrop-blur-sm'
        : 'border-slate-200 bg-white/50 backdrop-blur-sm'
        }`}>
        <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
          Informações Pessoais
        </h3>

        <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Nome Completo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className={`w-full px-4 py-3 rounded-xl border font-medium outline-none transition-all ${theme === 'dark'
                ? 'bg-slate-900/50 border-white/10 text-white focus:border-cyan-500/50 focus:bg-slate-900/80'
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:bg-white'
                }`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
              Email
            </label>
            <div className={`font-medium px-4 py-3 rounded-xl border opacity-70 cursor-not-allowed ${theme === 'dark'
              ? 'text-slate-400 bg-slate-900/30 border-white/10'
              : 'text-slate-500 bg-slate-100 border-slate-200'
              }`}>
              {usuario.email}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={carregandoPerfil}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${theme === 'dark'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-50'
                : 'bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100 disabled:opacity-50'
                }`}
            >
              <Save size={16} />
              {carregandoPerfil ? 'Salvando...' : 'Salvar Alterações'}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Security Card */}
      <div className={`rounded-2xl border p-8 transition-colors duration-300 ${theme === 'dark'
        ? 'border-white/10 bg-slate-900/30 backdrop-blur-sm'
        : 'border-slate-200 bg-white/50 backdrop-blur-sm'
        }`}>
        <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
          Segurança
        </h3>

        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Nova Senha
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className={`w-full rounded-xl border h-12 pl-11 pr-4 focus:outline-none transition-all ${theme === 'dark'
                    ? 'border-white/10 bg-slate-900/50 text-white focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-500'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
                    }`}
                />
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-cyan-500`} size={18} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Confirmar Nova Senha
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className={`w-full rounded-xl border h-12 pl-11 pr-4 focus:outline-none transition-all ${theme === 'dark'
                    ? 'border-white/10 bg-slate-900/50 text-white focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-500'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
                    }`}
                />
                <CheckCircle2 className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-cyan-500`} size={18} />
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
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
              <span>{sucesso}</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={carregando || !novaSenha}
            className={`flex items-center justify-center rounded-xl h-12 gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 ${theme === 'dark'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
              : 'bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100'
              }`}
          >
            {carregando ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Save size={18} />
                Atualizar Senha
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
