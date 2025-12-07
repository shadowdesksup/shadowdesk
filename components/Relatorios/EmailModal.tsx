import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { RegistroAtendimento } from '../../types';
import { generateHTMLContent } from './HTMLGenerator';

// CONFIGURAÇÃO DO EMAILJS
// PREENCHIDO PELO USUÁRIO
const EMAILJS_SERVICE_ID = 'service_gxvb32o';
const EMAILJS_TEMPLATE_ID = 'template_u0i1z6q';
const EMAILJS_PUBLIC_KEY = 'fLg_9AO-psCSRiCqT';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  registros: RegistroAtendimento[];
  usuario: string;
  theme: 'dark' | 'light';
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, registros, usuario, theme }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'generating' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Verificar se as chaves foram configuradas
    if (EMAILJS_SERVICE_ID.includes('SEU_ID_AQUI')) {
      setStatus('error');
      setErrorMessage('Configure as chaves do EmailJS no código (EmailModal.tsx) primeiro!');
      return;
    }

    try {
      setStatus('generating');

      // Gerar conteúdo em HTML (Substituindo TXT para melhor visualização)
      const htmlContent = generateHTMLContent(registros);

      setStatus('sending');

      const templateParams = {
        to_email: email,
        from_name: usuario,
        message: htmlContent, // Enviando o relatório HTML no CORPO do email
        content: ''
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setEmail('');
      }, 3000);

    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      setStatus('error');
      setErrorMessage(error.text || 'Falha ao enviar e-mail. Verifique o console.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with optimized blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            style={{ willChange: 'opacity' }}
          />

          {/* Modal - Centered with flexbox */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`w-full max-w-md p-6 rounded-2xl shadow-2xl pointer-events-auto ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white'
                }`}
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                  <Mail className="text-cyan-500" size={24} />
                  Enviar Relatório
                </h3>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                >
                  <X size={20} />
                </button>
              </div>

              {status === 'success' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                    Email Enviado!
                  </h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    O relatório foi enviado com sucesso para {email}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex flex-col gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      E-mail do Destinatário
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${theme === 'dark'
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-cyan-500'
                        }`}
                    />
                  </div>

                  {status === 'error' && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                      <p className="text-sm text-red-400 font-medium">
                        {errorMessage}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status !== 'idle'}
                    className={`mt-2 w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                      ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700'
                      }`}
                  >
                    {status === 'idle' && (
                      <>
                        <Send size={18} />
                        Enviar Agora
                      </>
                    )}
                    {status === 'generating' && (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Gerando Texto...
                      </>
                    )}
                    {status === 'sending' && (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enviando Email...
                      </>
                    )}
                  </button>

                  <p className={`text-xs text-center mt-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Nota: O plano grátis do EmailJS limita anexos, então o relatório será enviado como texto no corpo do email.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EmailModal;
