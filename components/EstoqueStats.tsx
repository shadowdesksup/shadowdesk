import React, { useMemo } from 'react';
import { Package, RotateCcw, AlertTriangle, CheckCircle, Trash2, Truck } from 'lucide-react';
import { EquipamentoEstoque } from '../types';

interface EstoqueStatsProps {
  estoque: EquipamentoEstoque[];
  theme?: 'dark' | 'light';
  onMovimentadosClick?: () => void;
  onManutencaoClick?: () => void;
}

const EstoqueStats: React.FC<EstoqueStatsProps> = ({ estoque, theme = 'dark', onMovimentadosClick, onManutencaoClick }) => {
  const isDark = theme === 'dark';

  const stats = useMemo(() => {
    let bensAtivos = 0;
    let disponivel = 0;
    let avaliacao = 0;
    let manutencao = 0;
    let descartado = 0;
    let descarte = 0;
    let transferido = 0;

    estoque.forEach(item => {
      switch (item.status) {
        case 'BENS_ATIVOS': bensAtivos++; break;
        case 'DISPONIVEL': disponivel++; break;
        case 'AVALIACAO': avaliacao++; break;
        case 'MANUTENCAO': manutencao++; break;
        case 'DESCARTADO': descartado++; break;
        case 'DESCARTE': descarte++; break;
        case 'TRANSFERIDO': transferido++; break;
      }
    });

    const ativos = bensAtivos + disponivel + avaliacao;

    return { total: estoque.length, ativos, bensAtivos, disponivel, avaliacao, manutencao, descartado, descarte, transferido };
  }, [estoque]);

  const cards = [
    { title: 'Total Ativos', value: stats.ativos, icon: <Package size={24} />, color: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/20' },
    { title: 'Movimentados', value: stats.transferido, icon: <Truck size={24} />, color: 'from-purple-500 to-indigo-500', shadow: 'shadow-purple-500/20', onClick: onMovimentadosClick },
    { title: 'Manutenção', value: stats.manutencao, icon: <RotateCcw size={24} />, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', onClick: onManutencaoClick },
    { title: 'Descarte', value: stats.descarte + stats.descartado, icon: <Trash2 size={24} />, color: 'from-rose-500 to-red-500', shadow: 'shadow-rose-500/20' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
      {cards.map((card, i) => (
        <div 
          key={i}
          onClick={card.onClick}
          className={`relative overflow-hidden rounded-2xl p-5 border shadow-lg transition-transform duration-200 hover:-translate-y-1 ${
            isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
          } ${card.onClick ? 'cursor-pointer hover:shadow-xl hover:border-cyan-500/50' : ''}`}
        >
          {/* Subtle gradient background glow */}
          <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-20 blur-2xl`} />
          
          <div className="flex items-center justify-between mb-3 relative z-10">
            <h3 className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {card.title}
            </h3>
            <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow}`}>
              {card.icon}
            </div>
          </div>
          
          <div className="relative z-10">
            <span className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(EstoqueStats);
