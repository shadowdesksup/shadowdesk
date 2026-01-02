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
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  // WhatsApp settings state
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [salvandoWhatsapp, setSalvandoWhatsapp] = useState(false);
  const [erroWhatsapp, setErroWhatsapp] = useState('');
  const [sucessoWhatsapp, setSucessoWhatsapp] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha('');
    setSucessoSenha('');

    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem');
      return;
    }

    setCarregando(true);

    try {
      await atualizarSenhaUsuario(usuario, novaSenha);
      setSucessoSenha('Senha atualizada com sucesso!');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      setErroSenha(error.message || 'Erro ao atualizar senha. Talvez seja necessário fazer login novamente.');
    } finally {
      setCarregando(false);
    }
  };

  // State for Profile Update
  const [nome, setNome] = useState(dadosUsuario?.nomeCompleto || usuario.displayName || '');
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [erroPerfil, setErroPerfil] = useState('');
  const [sucessoPerfil, setSucessoPerfil] = useState('');

  // Update effect when data loads
  React.useEffect(() => {
    if (dadosUsuario?.nomeCompleto) {
      setNome(dadosUsuario.nomeCompleto);
    } else if (usuario.displayName) {
      setNome(usuario.displayName);
    }
    // Load WhatsApp settings
    if (dadosUsuario?.telefone) {
      setWhatsappPhone(dadosUsuario.telefone);
    }
    if (dadosUsuario?.whatsappLembretesEnabled !== undefined) {
      setWhatsappEnabled(dadosUsuario.whatsappLembretesEnabled);
    }
  }, [dadosUsuario, usuario]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroPerfil('');
    setSucessoPerfil('');

    if (!nome.trim()) {
      setErroPerfil('O nome não pode estar vazio');
      return;
    }

    setCarregandoPerfil(true);
    try {
      await atualizarPerfilUsuario(usuario, nome.trim());
      setSucessoPerfil('Perfil atualizado com sucesso!');
    } catch (error: any) {
      setErroPerfil(error.message || 'Erro ao atualizar perfil.');
    } finally {
      setCarregandoPerfil(false);
    }
  };

  // Save WhatsApp settings
  const handleSaveWhatsapp = async () => {
    setErroWhatsapp('');
    setSucessoWhatsapp('');
    setSalvandoWhatsapp(true);

    try {
      // Import Firestore functions
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');

      await updateDoc(doc(db, 'users', usuario.uid), {
        telefone: whatsappPhone.trim(),
        whatsappLembretesEnabled: whatsappEnabled
      });

      setSucessoWhatsapp('Configurações de WhatsApp salvas!');
    } catch (error: any) {
      setErroWhatsapp(error.message || 'Erro ao salvar configurações de WhatsApp.');
    } finally {
      setSalvandoWhatsapp(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-8 max-w-4xl mx-auto pb-16"
    >
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

          {/* Feedback Messages for Password Section */}
          {erroSenha && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle size={16} />
              <span>{erroSenha}</span>
            </motion.div>
          )}

          {sucessoSenha && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
            >
              <CheckCircle2 size={16} />
              <span>{sucessoSenha}</span>
            </motion.div>
          )}

          <div className="flex justify-end mt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={carregando || !novaSenha}
              className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${theme === 'dark'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-50'
                : 'bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100 disabled:opacity-50'
                }`}
            >
              {carregando ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Save size={18} />
                  Atualizar Senha
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {/* WhatsApp Card */}
      <div className={`rounded-2xl border p-8 transition-colors duration-300 ${theme === 'dark'
        ? 'border-white/10 bg-slate-900/30 backdrop-blur-sm'
        : 'border-slate-200 bg-white/50 backdrop-blur-sm'
        }`}>
        <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          <span className="w-1 h-6 bg-[#25D366] rounded-full"></span>
          Notificações WhatsApp
        </h3>

        <div className="flex flex-col gap-6">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                Receber lembretes por WhatsApp
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Para lembretes e notificações de chamados do ServiceDesk
              </p>
            </div>
            <div
              className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${whatsappEnabled ? 'bg-[#25D366]' : (theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300')
                }`}
              onClick={() => setWhatsappEnabled(!whatsappEnabled)}
            >
              <motion.div
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                animate={{ x: whatsappEnabled ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>

          {/* Phone Input - Only show when enabled */}
          {whatsappEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2"
            >
              <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Número do WhatsApp
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#25D366]">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="14999077324"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border font-medium transition-all ${theme === 'dark'
                    ? 'bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus:border-[#25D366]/50 focus:bg-slate-900/80'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#25D366] focus:bg-white'
                    } focus:outline-none`}
                />
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                Digite apenas números (DDD + número). Ex: 14999077324
              </p>
            </motion.div>
          )}

          {/* Feedback Messages for WhatsApp Section */}
          {erroWhatsapp && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle size={16} />
              <span>{erroWhatsapp}</span>
            </motion.div>
          )}

          {sucessoWhatsapp && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
            >
              <CheckCircle2 size={16} />
              <span>{sucessoWhatsapp}</span>
            </motion.div>
          )}

          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveWhatsapp}
            disabled={salvandoWhatsapp}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 self-end ${theme === 'dark'
              ? 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 disabled:opacity-50'
              : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 disabled:opacity-50'
              }`}
          >
            <Save size={16} />
            {salvandoWhatsapp ? 'Salvando...' : 'Salvar WhatsApp'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
