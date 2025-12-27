import React from 'react';
import { LayoutDashboard, PlusCircle, List, FileText, Settings, User, FileEdit, Bell, Cloud, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  paginaAtual: string;
  onNavegar: (pagina: string) => void;
  theme?: 'dark' | 'light';
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ paginaAtual, onNavegar, theme = 'dark', isOpen, onClose }) => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', pagina: 'dashboard' },
    { icon: <PlusCircle size={20} />, label: 'Novo Registro', pagina: 'novo' },
    { icon: <List size={20} />, label: 'Meus Registros', pagina: 'historico' },
    { icon: <Ticket size={20} />, label: 'ServiceDesk', pagina: 'servicedesk' },
    { icon: <FileEdit size={20} />, label: 'Gerar Descritivos', pagina: 'descritivos' },
    { icon: <Bell size={20} />, label: 'Lembretes', pagina: 'lembretes' },
    { icon: <FileText size={20} />, label: 'Relatórios', pagina: 'relatorios' },
    { icon: <Cloud size={20} />, label: 'Weather', pagina: 'clima' },
    { icon: <User size={20} />, label: 'Perfil', pagina: 'perfil' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 border-r backdrop-blur-md h-full transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } md:relative ${theme === 'dark'
            ? 'border-white/10 bg-slate-950/95 md:bg-white/5'
            : 'border-slate-300 bg-white/95 shadow-2xl'
          }`}
      >
        <div className="flex gap-4 items-center mb-4 p-4 text-left">
          <div className="relative size-10 rounded-full overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.5)] border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
            <img src="/shadow-logo-final.png" alt="ShadowDesk Logo" className="w-6 h-6 object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>ShadowDesk</h1>
            <p className={`text-xs font-medium tracking-wider uppercase ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
              }`}>UNESP</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.pagina}
              onClick={() => {
                onNavegar(item.pagina);
                onClose();
              }}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left ${paginaAtual === item.pagina
                ? theme === 'dark'
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] border border-cyan-500/20'
                  : 'bg-cyan-50 text-cyan-700 shadow-lg shadow-cyan-500/10 border border-cyan-200 font-bold'
                : theme === 'dark'
                  ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
            >
              <span className={`${paginaAtual === item.pagina
                ? theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
                : theme === 'dark' ? 'text-slate-500 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800'
                }`}>
                {item.icon}
              </span>
              <p className="text-sm font-medium">{item.label}</p>
              {paginaAtual === item.pagina && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className={`mt-auto rounded-xl border p-4 ${theme === 'dark'
          ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-white/5'
          : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-slate-300 shadow-inner'
          }`}>
          <p className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>ShadowDesk v3.0.1</p>
          <div className="w-full bg-slate-800/50 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
          <p className="text-[10px] text-emerald-400 mt-1 text-right">Operacional</p>
        </div>
      </motion.aside >
    </>
  );
};

export default Sidebar;