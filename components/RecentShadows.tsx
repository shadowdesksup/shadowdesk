import React from 'react';
import { motion } from 'framer-motion';
import { ShadowTicket } from '../types';
import { Clock, CheckCircle2, AlertCircle, XCircle, ArrowUpRight } from 'lucide-react';

const MOCK_DATA: ShadowTicket[] = [
  { id: '#74821', title: 'API Integration Failure', status: 'In Progress', timestamp: '2h ago' },
  { id: '#74820', title: 'Database Connection Timeout', status: 'Resolved', timestamp: '1d ago' },
  { id: '#74819', title: 'Login Page UI Glitch', status: 'Closed', timestamp: '3d ago' },
  { id: '#74818', title: 'User Authentication Loop', status: 'Open', timestamp: '5d ago' },
  { id: '#74815', title: 'Payment Gateway Error', status: 'Open', timestamp: '6d ago' },
  { id: '#74812', title: 'Dashboard Latency Spike', status: 'Resolved', timestamp: '1w ago' },
];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let styles = '';
  let icon = null;

  switch (status) {
    case 'Open':
      styles = 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      icon = <AlertCircle size={12} />;
      break;
    case 'In Progress':
      styles = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]';
      icon = <Clock size={12} />;
      break;
    case 'Resolved':
      styles = 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
      icon = <CheckCircle2 size={12} />;
      break;
    case 'Closed':
      styles = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      icon = <XCircle size={12} />;
      break;
    default:
      styles = 'bg-slate-500/10 text-slate-400';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {icon}
      {status}
    </span>
  );
};

const RecentShadows: React.FC = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md h-full min-h-[500px]"
    >
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h3 className="text-white text-2xl font-bold tracking-tight">Sombras Recentes</h3>
        <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors">VIEW ALL</button>
      </div>
      
      <motion.div 
        className="flex flex-col gap-4 overflow-y-auto pr-2 -mr-2 custom-scrollbar h-full"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {MOCK_DATA.map((ticket) => (
          <motion.div 
            key={ticket.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 }
            }}
            whileHover={{ 
              scale: 1.02, 
              backgroundColor: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.2)" 
            }}
            className="group relative flex flex-col gap-3 rounded-xl border border-white/5 bg-white/5 p-5 transition-all cursor-pointer overflow-hidden"
          >
            {/* Subtle gradient hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
              <h4 className="font-bold text-white text-lg leading-tight group-hover:text-cyan-100 transition-colors pr-8">
                {ticket.title}
              </h4>
              <span className="font-mono text-xs text-slate-500 bg-slate-950/30 px-2 py-0.5 rounded border border-white/5">
                {ticket.id}
              </span>
            </div>
            
            <div className="flex justify-between items-end relative z-10 mt-1">
              <StatusBadge status={ticket.status} />
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <span>{ticket.timestamp}</span>
              </div>
            </div>

            <div className="absolute top-5 right-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
               <ArrowUpRight size={16} className="text-cyan-400" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};

export default RecentShadows;