import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { EquipamentoEstoque } from '../types';

interface EstoqueGridProps {
  estoque: EquipamentoEstoque[];
  busca: string;
  theme?: 'dark' | 'light';
  onSelectGroup: (grupoInfo: GrupoEstoque) => void;
}

export interface GrupoEstoque {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  imagemUrl?: string;
  itens: EquipamentoEstoque[];
  quantidade: number;
}

const EstoqueGrid: React.FC<EstoqueGridProps> = ({ estoque, busca, theme = 'dark', onSelectGroup }) => {
  const isDark = theme === 'dark';

  const grupos = useMemo(() => {
    let filtrado = estoque;
    if (busca) {
      const l = busca.toLowerCase();
      filtrado = estoque.filter(i => 
        i.tipo.toLowerCase().includes(l) ||
        i.marca.toLowerCase().includes(l) ||
        i.modelo.toLowerCase().includes(l) ||
        (i.patrimonio && i.patrimonio.toLowerCase().includes(l)) ||
        (i.numeroSerie && i.numeroSerie.toLowerCase().includes(l)) ||
        (i.numeroProcesso && i.numeroProcesso.toLowerCase().includes(l))
      );
    }

    const mapa = new Map<string, EquipamentoEstoque[]>();
    filtrado.forEach(item => {
      const key = `${item.tipo}|${item.marca}|${item.modelo}`;
      if (!mapa.has(key)) mapa.set(key, []);
      mapa.get(key)!.push(item);
    });
    
    return Array.from(mapa.entries()).map(([key, list]) => {
      const itemPrincipal = list.find(i => i.isImagemPrincipal && i.imagemUrl);
      const capaUrl = itemPrincipal ? itemPrincipal.imagemUrl : list.find(i => i.imagemUrl)?.imagemUrl;
      return {
        id: key,
        tipo: list[0].tipo,
        marca: list[0].marca,
        modelo: list[0].modelo,
        imagemUrl: capaUrl,
        itens: list,
        quantidade: list.filter(i => i.status !== 'DESCARTADO' && i.status !== 'DESCARTE' && i.status !== 'TRANSFERIDO').length
      } as GrupoEstoque;
    }).sort((a, b) => a.tipo.localeCompare(b.tipo) || a.marca.localeCompare(b.marca));
  }, [estoque, busca]);

  if (grupos.length === 0) {
    return (
      <div className={`p-12 text-center rounded-2xl border backdrop-blur-md ${isDark ? 'bg-slate-900/60 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-xl'}`}>
        <Package size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">Nenhum equipamento encontrado no estoque.</p>
        <p className="text-sm opacity-70 mt-2">Tente buscar por outro termo ou cadastre um novo item.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {grupos.map((grupo, idx) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          key={grupo.id} className={`group cursor-pointer rounded-2xl overflow-hidden border backdrop-blur-md transition-all hover:shadow-2xl hover:-translate-y-1 ${
            isDark ? 'bg-slate-900/60 border-white/10 hover:border-cyan-500/50' : 'bg-white border-slate-200 shadow-lg hover:border-cyan-500'
          }`}
          onClick={() => onSelectGroup(grupo)}
        >
          {/* Imagem (Hero) */}
          <div className={`h-48 w-full relative flex items-center justify-center overflow-hidden ${isDark ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
            {grupo.imagemUrl ? (
              <img src={grupo.imagemUrl} alt={grupo.modelo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <ImageIcon size={48} className="text-slate-400 opacity-30" />
            )}
            
            {/* Badge de Quantidade Flutuante */}
            <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {grupo.quantidade} unid.
            </div>
          </div>

          {/* Info Card */}
          <div className="p-5 relative">
            <h3 className={`text-sm tracking-wide uppercase font-semibold mb-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
              {grupo.tipo} • {grupo.marca}
            </h3>
            <h2 className={`text-xl font-bold truncate mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {grupo.modelo}
            </h2>
            
            <button className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors text-sm font-medium ${
              isDark ? 'bg-slate-800/50 hover:bg-slate-700 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              Gerenciar Unidades
              <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default React.memo(EstoqueGrid);
