import React, { useState } from 'react';
import { User, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onLogin: (email: string, senha: string) => Promise<void>;
  onCriarConta: () => void;
  onEsqueciSenha: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onCriarConta, onEsqueciSenha }) => {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await onLogin(username, senha);
    } catch (error: any) {
      setErro(error.message || 'Erro ao fazer login');
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px]"></div>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl shadow-black/20 p-8">
          {/* Logo e Título */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-4 p-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            >
              <img src="/shadow-logo-final.png" alt="ShadowDesk Logo" className="w-12 h-12 object-contain" />
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ShadowDesk</h1>
            <p className="text-slate-400 text-sm text-center">
              Sistema de Registro de Atendimentos Informais
            </p>
            <p className="text-cyan-400 text-xs mt-1 font-medium">UNESP</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Campo Usuário */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">
                Usuário
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 text-slate-200 h-12 pl-11 pr-4 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all placeholder:text-slate-600"
                  required
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors" size={18} />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">
                Senha
              </label>
              <div className="relative group">
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 text-slate-200 h-12 pl-11 pr-4 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all placeholder:text-slate-600"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors" size={18} />
              </div>
            </div>

            {/* Mensagem de Erro */}
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

            {/* Botão Entrar */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={carregando}
              className="mt-2 flex items-center justify-center rounded-xl h-12 bg-gradient-to-r from-cyan-500 to-blue-600 text-white gap-3 text-base font-bold tracking-wide transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                'Entrar'
              )}
            </motion.button>
          </form>

          {/* Credenciais Padrão */}
          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3">
            <p className="text-xs text-slate-500 text-center">
              <button
                type="button"
                onClick={onEsqueciSenha}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Esqueci minha senha
              </button>
            </p>
            <p className="text-xs text-slate-500 text-center">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={onCriarConta}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Criar conta
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Sistema desenvolvido para suporte técnico UNESP
        </p>
      </motion.div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};

export default LoginPage;
