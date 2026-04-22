import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface EstoqueSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  theme?: 'dark' | 'light';
  width?: string;
}

const EstoqueSidePanel: React.FC<EstoqueSidePanelProps> = ({ isOpen, onClose, title, children, theme = 'dark', width = 'max-w-xl' }) => {
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} // Faster fade avoids locking main thread for too long
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            style={{ willChange: 'opacity' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ willChange: 'transform, opacity' }}
            className={`fixed top-0 right-0 bottom-0 z-50 w-full ${width} shadow-2xl flex flex-col ${
              isDark ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-slate-200'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex-1">
                {title}
              </div>
              <button 
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EstoqueSidePanel;
