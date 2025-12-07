import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Settings } from 'lucide-react';
import { Local } from '../firebase/locais';

interface LocalSelectorProps {
  value: string;
  onChange: (value: string) => void;
  locais: Local[];
  onGerenciar: () => void;
  theme?: 'dark' | 'light';
  required?: boolean;
}

const LocalSelector: React.FC<LocalSelectorProps> = ({
  value,
  onChange,
  locais,
  onGerenciar,
  theme = 'dark',
  required = false
}) => {
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [showAll, setShowAll] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar locais baseado no input ou mostrar todos
  const locaisFiltrados = showAll
    ? locais
    : locais.filter(local =>
      local.nome.toLowerCase().includes((filtro || value).toLowerCase())
    );

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      // Verifica se o clique foi fora do container principal
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMostrarDropdown(false);
        setShowAll(false);
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = e.target.value;
    onChange(novoValor);
    setFiltro(novoValor);
    setMostrarDropdown(true);
    setShowAll(false); // Digitar desativa o modo "mostrar todos"
  };

  const handleSelectLocal = (nomeLocal: string) => {
    onChange(nomeLocal);
    setFiltro('');
    setMostrarDropdown(false);
    setShowAll(false);
  };

  const handleInputFocus = () => {
    setMostrarDropdown(true);
    // Se o campo estiver vazio, mostra todos. Se tiver texto, filtra.
    if (!value) {
      setShowAll(true);
    } else {
      setShowAll(false);
      setFiltro(value);
    }
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Garante que não haja bolhas de evento

    // Toggle simples e direto
    const novoEstado = !mostrarDropdown;
    setMostrarDropdown(novoEstado);

    if (novoEstado) {
      setShowAll(true); // Se abriu via seta, mostra tudo
      // NÃO focamos o input automaticamente para evitar disparo de onFocus que causaria loop
    } else {
      setShowAll(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        {/* Input Field */}
        <div className="relative group flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Ex: Sala 205 - Bloco A"
            className={`w-full rounded-xl border h-12 pl-11 pr-10 focus:outline-none transition-all ${theme === 'dark'
              ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-600'
              : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
              }`}
            required={required}
          />
          <MapPin
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
              } group-focus-within:text-cyan-500`}
            size={18}
          />
          <button
            type="button"
            onClick={handleArrowClick}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${mostrarDropdown ? 'rotate-180' : ''
              } ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Botão Gerenciar */}
        <button
          type="button"
          onClick={onGerenciar}
          className={`px-4 rounded-xl border transition-colors ${theme === 'dark'
            ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white hover:border-cyan-500/50'
            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:border-cyan-500'
            }`}
          title="Gerenciar Locais"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Dropdown */}
      {mostrarDropdown && locais.length > 0 && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 w-full mt-2 rounded-xl border shadow-2xl max-h-[50vh] overflow-y-auto ${theme === 'dark'
            ? 'bg-slate-900/95 border-white/10 backdrop-blur-xl'
            : 'bg-white border-slate-200'
            }`}
        >
          {locaisFiltrados.length > 0 ? (
            locaisFiltrados.map((local) => (
              <button
                key={local.id}
                type="button"
                onClick={() => handleSelectLocal(local.nome)}
                className={`w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 ${theme === 'dark'
                  ? 'hover:bg-white/10 text-slate-200 border-white/5'
                  : 'hover:bg-slate-50 text-slate-900 border-slate-100'
                  } ${value === local.nome
                    ? theme === 'dark'
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'bg-cyan-50 text-cyan-600'
                    : ''
                  }`}
              >
                {local.nome}
              </button>
            ))
          ) : (
            <div
              className={`px-4 py-6 text-center text-sm ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}
            >
              {filtro || value
                ? 'Nenhum local encontrado'
                : 'Nenhum local cadastrado'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocalSelector;
