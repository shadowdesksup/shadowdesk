import React, { useState } from 'react';
import { Hash, Type, Save, AlertCircle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const ShadowForm: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl shadow-black/20"
    >
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <h3 className="text-white text-2xl font-bold tracking-tight flex items-center gap-3">
          <span className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
          Lançar Nova Sombra
        </h3>
        <div className="text-xs font-mono text-slate-500 px-2 py-1 bg-white/5 rounded">ID GENERATOR: ACTIVE</div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col flex-1 gap-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Ticket ID</label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Enter Ticket ID"
                className="w-full rounded-xl border border-white/10 bg-slate-900/50 text-slate-200 h-12 pl-4 pr-10 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all placeholder:text-slate-600"
              />
              <Hash className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors" size={18} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Title</label>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Enter a brief title for the note"
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 text-slate-200 h-12 pl-4 pr-10 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all placeholder:text-slate-600"
            />
            <Type className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors" size={18} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Description</label>
          <div className="relative group">
            <textarea 
              rows={6}
              placeholder="Detailed notes about the call..."
              className="w-full rounded-xl border border-white/10 bg-slate-900/50 text-slate-200 p-4 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all placeholder:text-slate-600 resize-none"
            ></textarea>
            <div className="absolute bottom-3 right-3 pointer-events-none">
              <div className="w-2 h-2 bg-slate-600 rounded-full group-focus-within:bg-cyan-500 transition-colors"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">Status</label>
          <div className="relative group">
            <select className="w-full appearance-none rounded-xl border border-white/10 bg-slate-900/50 text-slate-200 h-12 pl-4 pr-10 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-900/80 transition-all cursor-pointer">
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors pointer-events-none" size={18} />
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02, shadow: "0 0 20px rgba(6,182,212,0.4)" }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center rounded-xl h-14 bg-gradient-to-r from-cyan-500 to-blue-600 text-white gap-3 text-base font-bold tracking-wide transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
           {loading ? (
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
               className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
             />
           ) : (
             <>
                <Save size={20} className="group-hover:scale-110 transition-transform" />
                Gravar Sombra
             </>
           )}
        </motion.button>
      </form>
    </motion.section>
  );
};

export default ShadowForm;