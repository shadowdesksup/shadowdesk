import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import Dashboard from './components/Dashboard';
import FormularioRegistro from './components/FormularioRegistro';
import ListaRegistros from './components/ListaRegistros';
import ConfirmationModal from './components/ConfirmationModal';
import { useAuth } from './hooks/useAuth';
import { useRegistros } from './hooks/useRegistros';
import { useDescritivos } from './hooks/useDescritivos';
import { useTheme } from './hooks/useTheme';
import { recuperarSenha } from './firebase/auth';
import ProfilePage from './components/ProfilePage';
import RelatoriosPage from './components/Relatorios/RelatoriosPage';
import GerarDescritivos from './components/GerarDescritivos';
import { SessionExpiredModal } from './components/SessionExpiredModal';
import { RegistrationSuspendedModal } from './components/RegistrationSuspendedModal';

type TelasAuth = 'login' | 'registro' | 'esqueci-senha';

import { useSessionTimer } from './hooks/useSessionTimer';



const REGISTRATION_SUSPENDED = true;

function App() {
  const { usuario, dadosUsuario, estaAutenticado, login, registrar, logout, carregando: authCarregando } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  // Timer de sessão - Apenas verificação de expiração, sem countdown visual para evitar re-render
  const { isExpired, resetSession, clearSession } = useSessionTimer(estaAutenticado, usuario?.uid, false);

  const {
    registros,
    criar,
    atualizar,
    deletar,
    obterEstatisticas,
    carregando: registrosCarregando
  } = useRegistros(usuario?.uid);

  const {
    descritivos,
    criar: criarDescritivo,
    atualizar: atualizarDescritivo,
    deletar: deletarDescritivo,
    carregando: descritivosCarregando
  } = useDescritivos(usuario?.uid);

  const [telaAuth, setTelaAuth] = useState<TelasAuth>('login');
  const [paginaAtual, setPaginaAtual] = useState('dashboard');
  const [registroEditando, setRegistroEditando] = useState<any>(null);
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({
    isOpen: false,
    id: null
  });

  const [mostrarModalExpiracao, setMostrarModalExpiracao] = useState(false);
  const [mostrarModalSuspenso, setMostrarModalSuspenso] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Efeito para redirecionar para dashboard ao logar
  React.useEffect(() => {
    if (estaAutenticado) {
      setPaginaAtual('dashboard');
    }
  }, [estaAutenticado]);

  // Efeito para lidar com sessão expirada
  React.useEffect(() => {
    if (isExpired) {
      setMostrarModalExpiracao(true);
      logout();
      setTelaAuth('login');
      clearSession();
    }
  }, [isExpired, logout, clearSession]);

  // Mostrar tela de carregamento
  if (authCarregando) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="text-cyan-400 text-lg">Carregando...</div>
        </div>
      </div>
    );
  }

  // Wrapper para controlar suspensão de cadastro
  const handleRegistrar = async (email: string, senha: string, nome: string) => {
    if (REGISTRATION_SUSPENDED) {
      setMostrarModalSuspenso(true);
      return;
    }
    await registrar(email, senha, nome);
  };

  // Telas de autenticação
  if (!estaAutenticado) {
    let authScreen;

    if (telaAuth === 'registro') {
      authScreen = (
        <RegisterPage
          onRegistrar={handleRegistrar}
          onVoltarLogin={() => setTelaAuth('login')}
        />
      );
    } else if (telaAuth === 'esqueci-senha') {
      authScreen = (
        <ForgotPasswordPage
          onEnviarEmail={recuperarSenha}
          onVoltar={() => setTelaAuth('login')}
        />
      );
    } else {
      // Tela de login (padrão)
      authScreen = (
        <LoginPage
          onLogin={login}
          onCriarConta={() => setTelaAuth('registro')}
          onEsqueciSenha={() => setTelaAuth('esqueci-senha')}
        />
      );
    }

    return (
      <>
        {authScreen}
        <SessionExpiredModal
          isOpen={mostrarModalExpiracao}
          onClose={() => setMostrarModalExpiracao(false)}
          theme={theme}
        />
        <RegistrationSuspendedModal
          isOpen={mostrarModalSuspenso}
          onClose={() => {
            setMostrarModalSuspenso(false);
            setTelaAuth('login');
          }}
          theme={theme}
        />
      </>
    );
  }

  // Renderizar conteúdo baseado na página atual
  const renderizarConteudo = () => {
    switch (paginaAtual) {
      case 'dashboard':
        const estatisticas = obterEstatisticas();
        return (
          <div className="h-full flex flex-col gap-8 pr-8 overflow-y-auto">
            <Dashboard estatisticas={estatisticas} theme={theme} />
            <ListaRegistros
              key="lista-registros-dashboard"
              registros={registros}
              limite={15}
              customMaxHeight="1200px"
              customMinHeight="1000px"
              onEditar={(registro) => {
                setRegistroEditando(registro);
                setPaginaAtual('novo');
              }}
              onDeletar={(id) => {
                setModalConfirmacao({ isOpen: true, id });
              }}
              onAtualizarStatus={async (id, novoStatus) => {
                await atualizar(id, { status: novoStatus });
              }}
              theme={theme}
            />
          </div>
        );

      case 'novo':
        return (
          <div className="flex flex-col wide:grid wide:grid-cols-12 gap-8 wide:h-full wide:overflow-hidden">
            <div className="wide:col-span-7 wide:h-full wide:overflow-hidden flex flex-col">
              <FormularioRegistro
                onSalvar={async (dados) => {
                  if (registroEditando) {
                    await atualizar(registroEditando.id, dados);
                    setRegistroEditando(null);
                  } else {
                    await criar(dados);
                  }
                  // Manter na mesma página, apenas limpar seleção se for edição
                  if (registroEditando) {
                    setRegistroEditando(null);
                  } else {
                    // Se for novo, talvez limpar o form? O form já limpa sozinho com o reset no create
                    // setRegistroEditando(null) já garante que registroInicial é null
                  }
                  // setPaginaAtual('dashboard'); // Removido a pedido
                }}
                usuarioAtual={usuario?.email || ''}
                registroInicial={registroEditando}
                key={registroEditando ? registroEditando.id : 'novo'}
                theme={theme}
              />
            </div>
            <div className="wide:col-span-5 wide:h-full wide:overflow-hidden flex flex-col">
              <ListaRegistros
                registros={registros}
                limite={10}
                customMaxHeight="100%"
                ocultarBusca={true}
                onEditar={(registro) => {
                  // Clear first to force unmount, then set new record
                  setRegistroEditando(null);
                  setTimeout(() => setRegistroEditando(registro), 0);
                }}
                onDeletar={(id) => {
                  setModalConfirmacao({ isOpen: true, id });
                }}
                onAtualizarStatus={async (id, novoStatus) => {
                  await atualizar(id, { status: novoStatus });
                }}
                theme={theme}
              />
            </div>
          </div>
        );

      case 'historico':
        return (
          <div className="flex flex-col gap-6 h-full overflow-hidden">
            <ListaRegistros
              registros={registros}
              customMaxHeight="100%"
              onEditar={(registro) => {
                setRegistroEditando(registro);
                setPaginaAtual('novo');
              }}
              onDeletar={(id) => {
                setModalConfirmacao({ isOpen: true, id });
              }}
              onAtualizarStatus={async (id, novoStatus) => {
                await atualizar(id, { status: novoStatus });
              }}
              theme={theme}
            />
          </div>
        );

      case 'relatorios':
        return (
          <RelatoriosPage
            registros={registros}
            theme={theme}
            usuario={dadosUsuario?.nomeCompleto || usuario?.displayName || usuario?.email || 'Usuário'}
          />
        );

      case 'perfil':
        return <ProfilePage usuario={usuario!} dadosUsuario={dadosUsuario} theme={theme} />;

      case 'descritivos':
        return (
          <GerarDescritivos
            theme={theme}
            usuarioId={usuario?.uid || ''}
            nomeUsuario={dadosUsuario?.nomeCompleto || usuario?.displayName || usuario?.email || 'Usuário'}
            onSalvar={criarDescritivo}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Global Scrollbar Styles */}
      <style>{`
        /* Webkit browsers (Chrome, Safari, Edge) */
        ::-webkit-scrollbar {
          width: 12px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(226, 232, 240, 0.5)'};
        }
        ::-webkit-scrollbar-thumb {
          background: rgb(34, 211, 238);
          border-radius: 6px;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.5), 0 0 20px rgba(34, 211, 238, 0.3);
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgb(6, 182, 212);
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.7), 0 0 30px rgba(34, 211, 238, 0.5);
        }
        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgb(34, 211, 238) ${isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(226, 232, 240, 0.5)'};
        }
      `}</style>
      <div className={`relative min-h-screen w-full font-sans transition-colors duration-300 ${isDark
        ? 'bg-slate-950 selection:bg-cyan-500/30 selection:text-cyan-200'
        : 'bg-slate-100 selection:bg-cyan-200 selection:text-cyan-900'
        }`}>
        {/* Background Ambience */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className={`absolute inset-0 ${isDark
            ? 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]'
            : 'bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.08),rgba(255,255,255,0))]'
            }`}></div>
          <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-cyan-500/20' : 'via-cyan-500/30'
            }`}></div>
          <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[80px] ${isDark ? 'bg-blue-600/10' : 'bg-blue-600/5'
            }`}></div>
          <div className={`absolute top-1/2 right-0 w-64 h-64 rounded-full blur-[60px] ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-500/8'
            }`}></div>
        </div>

        <div className="relative z-10 flex h-screen overflow-hidden">
          {/* Navigation Sidebar */}
          <Sidebar
            paginaAtual={paginaAtual}
            onNavegar={(pagina) => {
              setPaginaAtual(pagina);
              setRegistroEditando(null);
            }}
            theme={theme}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header
              nomeUsuario={dadosUsuario?.nomeCompleto || usuario?.displayName || usuario?.email || 'Usuário'}
              userId={usuario?.uid}
              onLogout={() => {
                logout();
                setTelaAuth('login');
                clearSession();
              }}
              theme={theme}
              onToggleTheme={toggleTheme}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <main className="flex-1 overflow-y-auto wide:overflow-hidden py-8 px-8 wide:pl-8 wide:pr-0">
              {renderizarConteudo()}
            </main>
          </div>
        </div>

        {/* Grid Pattern Overlay for texture - REMOVED for performance */}
        {/* <div className={`fixed inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay ${isDark ? 'opacity-[0.03]' : 'opacity-[0.015]'
          }`}></div> */}

        <ConfirmationModal
          isOpen={modalConfirmacao.isOpen}
          onClose={() => setModalConfirmacao({ ...modalConfirmacao, isOpen: false })}
          onConfirm={async () => {
            if (modalConfirmacao.id) {
              try {
                await deletar(modalConfirmacao.id);
              } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Não foi possível excluir o registro. Verifique se você tem permissão para realizar esta ação.');
              }
            }
          }}
          title="Excluir Registro"
          message="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          isDestructive={true}
        />
      </div>
    </>
  );
}

export default App;