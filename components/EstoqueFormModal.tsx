import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Package, Save, Plus, Image as ImageIcon, Wrench, ShieldCheck, Server } from 'lucide-react';
import { EquipamentoEstoque, StatusEquipamento, TipoEquipamento, MarcaEquipamento, ModeloEquipamento, AgenciaProjeto } from '../types';
import EstoqueSidePanel from './EstoqueSidePanel';
import { listarTiposEquipamento, criarTipoEquipamento } from '../firebase/tiposEquipamento';
import { listarMarcasEquipamento } from '../firebase/marcasEquipamento';
import { listarModelosEquipamento } from '../firebase/modelosEquipamento';
import { listarAgenciasProjeto } from '../firebase/agenciasProjeto';
import { listarUsuarios, UserData } from '../firebase/auth';
import { listarVinculosEquipamento, VinculoEquipamento } from '../firebase/vinculosEquipamento';
import { listarOrigensEquipamento, OrigemEquipamento } from '../firebase/origensEquipamento';
import { listarLocaisTransferencia } from '../firebase/locaisTransferencia';
import { LocalTransferencia } from '../types';

interface EstoqueFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (dados: Partial<EquipamentoEstoque>) => Promise<void>;
  equipamentoEditando?: EquipamentoEstoque | null;
  theme?: 'dark' | 'light';
  carregando?: boolean;
  onAbreGerenciarTipos: () => void;
  onAbreGerenciarMarcas: () => void;
  onAbreGerenciarModelos: () => void;
  onAbreGerenciarAgencias: () => void;
  onAbreGerenciarVinculos: () => void;
  onAbreGerenciarOrigens: () => void;
  onAbreGerenciarLocais: () => void;
}

const EstoqueFormModal: React.FC<EstoqueFormModalProps> = ({
  isOpen, onClose, onSalvar, equipamentoEditando, theme = 'dark', carregando = false,
  onAbreGerenciarTipos, onAbreGerenciarMarcas, onAbreGerenciarModelos, onAbreGerenciarAgencias,
  onAbreGerenciarVinculos, onAbreGerenciarOrigens, onAbreGerenciarLocais
}) => {
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tiposBanco, setTiposBanco] = useState<TipoEquipamento[]>([]);
  const [showTiposDropdown, setShowTiposDropdown] = useState(false);
  const [confirmacaoNovoTipo, setConfirmacaoNovoTipo] = useState<{ tipo: string; prosseguir: () => void } | null>(null);

  const [marcasBanco, setMarcasBanco] = useState<MarcaEquipamento[]>([]);
  const [showMarcasDropdown, setShowMarcasDropdown] = useState(false);

  const [modelosBanco, setModelosBanco] = useState<ModeloEquipamento[]>([]);
  const [showModelosDropdown, setShowModelosDropdown] = useState(false);

  const [agenciasBanco, setAgenciasBanco] = useState<AgenciaProjeto[]>([]);
  const [showAgenciasDropdown, setShowAgenciasDropdown] = useState(false);

  const [tecnicosBanco, setTecnicosBanco] = useState<UserData[]>([]);

  const [origensBanco, setOrigensBanco] = useState<OrigemEquipamento[]>([]);
  const [showOrigensDropdown, setShowOrigensDropdown] = useState(false);

  const [vinculosBanco, setVinculosBanco] = useState<VinculoEquipamento[]>([]);
  const [showVinculosDropdown, setShowVinculosDropdown] = useState(false);

  const [tipo, setTipo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [patrimonio, setPatrimonio] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [semRegistro, setSemRegistro] = useState(false);

  // Projeto Fields
  const [temProjeto, setTemProjeto] = useState(false);
  const [agenciaFomento, setAgenciaFomento] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [numeroTermo, setNumeroTermo] = useState('');

  // Imagem & Status
  const [imagemUrl, setImagemUrl] = useState('');
  const [isImagemPrincipal, setIsImagemPrincipal] = useState(false);
  const [permitirSemImagem, setPermitirSemImagem] = useState(false);
  const [erroImagem, setErroImagem] = useState('');
  const [erroSalvar, setErroSalvar] = useState('');
  const [status, setStatus] = useState<StatusEquipamento | ''>('');
  const [manterAberto, setManterAberto] = useState(false);
  const [sucessoSalvar, setSucessoSalvar] = useState('');

  // Bens Ativos Fields
  const [baSolicitante, setBaSolicitante] = useState('');
  const [baVinculo, setBaVinculo] = useState('');
  const [baDataEntrada, setBaDataEntrada] = useState(new Date().toISOString().split('T')[0]);
  const [baOrigem, setBaOrigem] = useState('');
  const [baAlocadoEm, setBaAlocadoEm] = useState('DTI - Sala 12 - Suporte');
  const [baCondicao, setBaCondicao] = useState<'Boa' | 'Ruim'>('Boa');

  // Manutenção Fields
  const [manutencaoSolicitante, setManutencaoSolicitante] = useState('');
  const [manutencaoDataInicio, setManutencaoDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [manutencaoProblema, setManutencaoProblema] = useState('');
  const [manutencaoTecnicoId, setManutencaoTecnicoId] = useState('');

  const carregarTipos = async () => {
    try {
      const res = await listarTiposEquipamento();
      setTiposBanco(res);
    } catch (err) {
      console.error("Erro ao carregar tipos de equipamento:", err);
    }
  };

  const carregarMarcas = async () => {
    try {
      const res = await listarMarcasEquipamento();
      setMarcasBanco(res);
    } catch (err) {
      console.error("Erro ao carregar marcas de equipamento:", err);
    }
  };

  const carregarModelos = async () => {
    try {
      const res = await listarModelosEquipamento();
      setModelosBanco(res);
    } catch (err) {
      console.error("Erro ao carregar modelos de equipamento:", err);
    }
  };

  const carregarAgencias = async () => {
    try {
      const res = await listarAgenciasProjeto();
      setAgenciasBanco(res);
    } catch (err) {
      console.error("Erro ao carregar agências de fomento:", err);
    }
  };

  const carregarTecnicos = async () => {
    try {
      const res = await listarUsuarios();
      setTecnicosBanco(res);
    } catch (err) {
      console.error("Erro ao carregar técnicos:", err);
    }
  };

  const carregarOrigens = async () => {
    try {
      const res = await listarOrigensEquipamento();
      setOrigensBanco(res);
    } catch (err) {
      console.error("Erro ao carregar origens:", err);
    }
  };

  const carregarVinculos = async () => {
    try {
      const res = await listarVinculosEquipamento();
      setVinculosBanco(res);
    } catch (err) {
      console.error("Erro ao carregar vínculos:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarTipos();
      carregarMarcas();
      carregarModelos();
      carregarAgencias();
      carregarTecnicos();
      carregarOrigens();
      carregarVinculos();
    }
  }, [isOpen]);

  useEffect(() => {
    if (equipamentoEditando) {
      setTipo(equipamentoEditando.tipo);
      setMarca(equipamentoEditando.marca);
      setModelo(equipamentoEditando.modelo);
      
      const isSemRegistro = equipamentoEditando.patrimonio === 'Sem informação' && equipamentoEditando.numeroSerie === 'Sem informação';
      setSemRegistro(isSemRegistro);
      setPatrimonio(isSemRegistro ? '' : (equipamentoEditando.patrimonio || ''));
      setNumeroSerie(isSemRegistro ? '' : (equipamentoEditando.numeroSerie || ''));

      setTemProjeto(!!equipamentoEditando.temProjeto);
      setAgenciaFomento(equipamentoEditando.agenciaFomento || '');
      setNumeroProcesso(equipamentoEditando.numeroProcesso || '');
      setNumeroTermo(equipamentoEditando.numeroTermo || '');

      setImagemUrl(equipamentoEditando.imagemUrl || '');
      setIsImagemPrincipal(!!equipamentoEditando.isImagemPrincipal);
      setPermitirSemImagem(false);
      setErroImagem('');
      setStatus(equipamentoEditando.status);

      if (equipamentoEditando.bensAtivos) {
        setBaSolicitante(equipamentoEditando.bensAtivos.solicitante);
        setBaVinculo(equipamentoEditando.bensAtivos.vinculo);
        setBaDataEntrada(equipamentoEditando.bensAtivos.dataEntradaItem?.split('T')[0] || new Date().toISOString().split('T')[0]);
        setBaOrigem(equipamentoEditando.bensAtivos.origem);
        setBaAlocadoEm(equipamentoEditando.bensAtivos.alocadoEm || 'DTI - Sala 12 - Suporte');
        setBaCondicao(equipamentoEditando.bensAtivos.condicao || 'Boa');
      } else {
        setBaSolicitante(''); setBaVinculo(''); setBaDataEntrada(new Date().toISOString().split('T')[0]); setBaOrigem(''); setBaAlocadoEm('DTI - Sala 12 - Suporte'); setBaCondicao('Boa');
      }

      if (equipamentoEditando.manutencaoAtual) {
        setManutencaoSolicitante(equipamentoEditando.manutencaoAtual.solicitante);
        setManutencaoDataInicio(equipamentoEditando.manutencaoAtual.dataInicio.split('T')[0]);
        setManutencaoProblema(equipamentoEditando.manutencaoAtual.problema);
        setManutencaoTecnicoId(equipamentoEditando.manutencaoAtual.tecnicoResponsavelId);
      } else {
        setManutencaoSolicitante('');
        setManutencaoDataInicio(new Date().toISOString().split('T')[0]);
        setManutencaoProblema('');
        setManutencaoTecnicoId('');
      }

    } else {
      setTipo(''); setMarca(''); setModelo(''); setPatrimonio(''); setNumeroSerie(''); setSemRegistro(false);
      setTemProjeto(false); setAgenciaFomento(''); setNumeroProcesso(''); setNumeroTermo('');
      setImagemUrl(''); setIsImagemPrincipal(false); setStatus('');
      setPermitirSemImagem(false);
      setBaSolicitante(''); setBaVinculo(''); setBaDataEntrada(new Date().toISOString().split('T')[0]); setBaOrigem(''); setBaAlocadoEm('DTI - Sala 12 - Suporte'); setBaCondicao('Boa');
      setErroImagem(''); setErroSalvar(''); setSucessoSalvar('');

      setManutencaoSolicitante('');
      setManutencaoDataInicio(new Date().toISOString().split('T')[0]);
      setManutencaoProblema('');
      setManutencaoTecnicoId('');
    }
  }, [equipamentoEditando, isOpen]);

  const comprimirImagem = (file: File, maxDim: number = 1024, quality: number = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject('Canvas não suportado'); return; }
          ctx.drawImage(img, 0, 0, w, h);
          // Tenta WebP (muito mais leve), com fallback JPEG
          const webp = canvas.toDataURL('image/webp', quality);
          if (webp.startsWith('data:image/webp')) {
            resolve(webp);
          } else {
            resolve(canvas.toDataURL('image/jpeg', quality));
          }
        };
        img.onerror = () => reject('Erro ao processar imagem');
        img.src = reader.result as string;
      };
      reader.onerror = () => reject('Erro ao ler arquivo');
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await comprimirImagem(file);
        setImagemUrl(compressed);
        setErroImagem('');
      } catch (err) {
        console.error('Erro ao comprimir imagem:', err);
        // Fallback: tenta usar sem compressão
        const reader = new FileReader();
        reader.onloadend = () => setImagemUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSalvar('');

    if (!status) {
      setErroSalvar('Selecione o Status Inicial antes de salvar.');
      return;
    }

    let finalPatrimonio = patrimonio.trim();
    let finalSerial = numeroSerie.trim();

    if (semRegistro) {
      finalPatrimonio = 'Sem informação';
      finalSerial = 'Sem informação';
    } else if (!finalPatrimonio && !finalSerial) {
      setErroSalvar('É obrigatório informar o Número de Patrimônio ou o Número de Série. Caso o item não possua, marque a caixa "Bem sem informação de registro".');
      return;
    }

    if (!imagemUrl && !permitirSemImagem) {
      setErroImagem('A imagem é obrigatória. Marque a caixa abaixo se deseja anexar depois.');
      return;
    }
    setErroImagem('');

    const dadosSave: Partial<EquipamentoEstoque> = {
      tipo,
      marca,
      modelo,
      patrimonio: finalPatrimonio,
      numeroSerie: finalSerial,
      temProjeto,
      agenciaFomento: temProjeto ? agenciaFomento : '',
      numeroProcesso: temProjeto ? numeroProcesso : '',
      numeroTermo: temProjeto ? numeroTermo : '',
      imagemUrl,
      isImagemPrincipal,
      status: status as StatusEquipamento
    };

    if (status === 'BENS_ATIVOS') {
      dadosSave.bensAtivos = {
        solicitante: baSolicitante,
        vinculo: baVinculo,
        dataEntradaItem: baDataEntrada ? new Date(baDataEntrada).toISOString() : new Date().toISOString(),
        origem: baOrigem,
        alocadoEm: baAlocadoEm,
        condicao: baCondicao
      };
    }

    if (status === 'MANUTENCAO') {
      const tecNome = tecnicosBanco.find(t => t.uid === manutencaoTecnicoId)?.nomeCompleto || 'Técnico';
      dadosSave.manutencaoAtual = {
        solicitante: manutencaoSolicitante,
        dataInicio: new Date(manutencaoDataInicio).toISOString(),
        problema: manutencaoProblema,
        tecnicoResponsavelId: manutencaoTecnicoId,
        tecnicoResponsavelNome: tecNome
      };
    }

    const salvarFinal = async (criarTipo: boolean) => {
      if (criarTipo) {
        try {
          await criarTipoEquipamento(tipo.trim());
          carregarTipos();
        } catch (err: any) {
          setErroSalvar(`Erro ao cadastrar o novo tipo de equipamento: ${err?.message || ''}`);
          return;
        }
      }

      try {
        await onSalvar(dadosSave);
        if (manterAberto) {
          setPatrimonio('');
          setNumeroSerie('');
          setSucessoSalvar(`Unidade do tipo "${tipo}" cadastrada com sucesso!`);
          setTimeout(() => setSucessoSalvar(''), 4000); // clears message after 4s
        } else {
          onClose();
        }
      } catch (err: any) {
        console.error('Erro ao salvar equipamento:', err);
        setErroSalvar(err?.message || 'Erro desconhecido ao salvar. A imagem pode ser grande demais. Tente uma foto menor.');
      }
    };

    if (tipo.trim()) {
      const tipoExiste = tiposBanco.some(t => t.nome.toLowerCase() === tipo.trim().toLowerCase());
      if (!tipoExiste) {
        setConfirmacaoNovoTipo({
          tipo: tipo.trim(),
          prosseguir: () => {
            setConfirmacaoNovoTipo(null);
            salvarFinal(true);
          }
        });
        return; // intercepta e aguarda o botão OK do modal
      }
    }

    salvarFinal(false);
  };

  const titleNode = (
    <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
      <Package className="text-cyan-500" />
      {equipamentoEditando?.id ? 'Editar Equipamento' : 'Novo Equipamento'}
    </h2>
  );

  const isExactTypeMatch = tiposBanco.some(t => t.nome.toLowerCase() === tipo.trim().toLowerCase());
  const tiposToShow = isExactTypeMatch ? tiposBanco : tiposBanco.filter(t => t.nome.toLowerCase().includes(tipo.toLowerCase()));

  const isExactMarcaMatch = marcasBanco.some(m => m.nome.toLowerCase() === marca.trim().toLowerCase());
  const marcasToShow = isExactMarcaMatch ? marcasBanco : marcasBanco.filter(m => m.nome.toLowerCase().includes(marca.toLowerCase()));

  const isExactModeloMatch = modelosBanco.some(m => m.nome.toLowerCase() === modelo.trim().toLowerCase());
  const modelosToShow = isExactModeloMatch ? modelosBanco : modelosBanco.filter(m => m.nome.toLowerCase().includes(modelo.toLowerCase()));

  const isExactAgenciaMatch = agenciasBanco.some(m => m.nome.toLowerCase() === agenciaFomento.trim().toLowerCase());
  const agenciasToShow = isExactAgenciaMatch ? agenciasBanco : agenciasBanco.filter(m => m.nome.toLowerCase().includes(agenciaFomento.toLowerCase()));

  const bloqueiaEdicaoGrupo = !!equipamentoEditando;

  return (
    <EstoqueSidePanel isOpen={isOpen} onClose={onClose} theme={theme} title={titleNode} width="md:w-[calc(100vw-16rem)] max-w-none">
      <form onSubmit={handleSave} className="p-8 pb-32 flex flex-col lg:flex-row items-start gap-12">

        {/* Imagem */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center pt-6">
          <div
            className={`w-64 h-64 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors relative group ${isDark ? 'border-slate-700 hover:border-cyan-500 bg-slate-800/50' : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
              }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagemUrl ? (
              <>
                <img src={imagemUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <Upload className="text-white" size={32} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <ImageIcon size={40} className="mb-2 opacity-50" />
                <span className="text-sm font-medium">Fazer Upload</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          {imagemUrl && (
            <div className="mt-4 flex items-start gap-2 max-w-[16rem] bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
              <input
                type="checkbox"
                id="isImagemPrincipal"
                checked={isImagemPrincipal}
                onChange={(e) => setIsImagemPrincipal(e.target.checked)}
                className={`mt-1 rounded cursor-pointer w-4 h-4 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'} text-cyan-500 focus:ring-cyan-500`}
              />
              <label htmlFor="isImagemPrincipal" className={`text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-700'} cursor-pointer select-none leading-relaxed`}>
                Definir esta foto como capa padrão do modelo ({tipo} {marca})
              </label>
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 max-w-[16rem]">
            <input
              type="checkbox"
              id="permitirSemImagem"
              checked={permitirSemImagem}
              onChange={(e) => {
                setPermitirSemImagem(e.target.checked);
                if (e.target.checked) setErroImagem('');
              }}
              className={`mt-1 rounded cursor-pointer w-4 h-4 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'} text-cyan-500 focus:ring-cyan-500`}
            />
            <label htmlFor="permitirSemImagem" className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} cursor-pointer select-none leading-relaxed`}>
              Registrar sem imagem temporariamente (anexar depois na edição)
            </label>
          </div>
          {erroImagem && (
            <div className="mt-2 text-red-500 text-xs font-bold text-center max-w-[16rem] bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              {erroImagem}
            </div>
          )}
        </div>

        {/* Campos Principais */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          {/* Tipo (Combobox Customizado com botão +) */}
          <div>
            <label className={`block text-sm font-medium mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Tipo de Equipamento *
            </label>
            <div className="flex gap-3 relative">
              <div className="relative flex-1">
                <input
                  type="text" required
                  value={tipo}
                  readOnly={bloqueiaEdicaoGrupo}
                  onChange={e => {
                    if (bloqueiaEdicaoGrupo) return;
                    setTipo(e.target.value);
                    setShowTiposDropdown(true);
                  }}
                  onFocus={() => {
                    if (bloqueiaEdicaoGrupo) return;
                    carregarTipos();
                    setShowTiposDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowTiposDropdown(false), 200)}
                  placeholder="Ex: Computador, Notebook"
                  className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${
                    bloqueiaEdicaoGrupo 
                      ? (isDark ? 'bg-transparent border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
                      : (isDark ? 'bg-[#162033] border-slate-500 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)]')
                  } border`}
                />

                {/* Custom Dropdown */}
                {showTiposDropdown && (tiposBanco.length > 0 || tipo.length > 0) && (
                  <div className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border shadow-2xl z-[80] overflow-y-auto max-h-60 custom-scrollbar ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                    {tiposToShow.length === 0 ? (
                      <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Nenhuma sugestão para "{tipo}". Apenas salve para registrar.
                      </div>
                    ) : (
                      tiposToShow.map(t => (
                        <div
                          key={t.id}
                          className={`px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-cyan-50 text-slate-700'}`}
                          onClick={() => {
                            setTipo(t.nome);
                            setShowTiposDropdown(false);
                          }}
                        >
                          {t.nome}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {!bloqueiaEdicaoGrupo && (
                <button
                  type="button"
                  onClick={onAbreGerenciarTipos}
                  className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/30"
                  title="Novo Tipo Padrão (Banco)"
                >
                  <Plus size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Status Inicial *</label>
            <select
              value={status} onChange={e => setStatus(e.target.value as StatusEquipamento | '')}
              required
              className={`w-full rounded-xl px-4 py-3 outline-none transition-all font-bold ${status === 'MANUTENCAO'
                  ? (isDark ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-orange-50 border-orange-400 text-orange-600')
                  : status === 'BENS_ATIVOS'
                    ? (isDark ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-cyan-50 border-cyan-400 text-cyan-600')
                    : status === 'DESCARTE'
                      ? (isDark ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-rose-50 border-rose-400 text-rose-600')
                      : (isDark ? 'bg-[#162033] border-slate-700 text-slate-400 focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-500 focus:border-cyan-500')
                } border`}
            >
              <option value="">Selecione uma opção</option>
              <option value="BENS_ATIVOS">Bens Ativos</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="DESCARTE">Descarte</option>
            </select>
          </div>

          {/* Bloco Bens Ativos */}
          <AnimatePresence initial={false}>
            {status === 'BENS_ATIVOS' && (
              <motion.div
                key="bens_ativos_block"
                initial={{ opacity: 0, height: 0, scaleY: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
                exit={{ opacity: 0, height: 0, scaleY: 0.9 }}
                className={`col-span-1 md:col-span-2 overflow-visible rounded-2xl border-2 ${isDark ? 'bg-cyan-950/30 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'}`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-500 text-white'}`}>
                      <ShieldCheck size={24} className={isDark ? '' : 'text-white'} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>Dados do Bem Ativo</h3>
                      <p className={`text-sm ${isDark ? 'text-cyan-500/70' : 'text-cyan-600/70'}`}>Informações de registro patrimonial e origem.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Solicitante */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        Proprietário <span className="text-[10px] font-normal lowercase">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={baSolicitante} onChange={e => setBaSolicitante(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-cyan-500/50 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white border-cyan-300 text-slate-900 focus:border-cyan-500'} border`}
                        placeholder="Ex: Paulo Cunha"
                      />
                    </div>

                    {/* Vínculo (combobox + botão gerenciar) */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        Vínculo <span className="text-[10px] font-normal lowercase">(Opcional)</span>
                      </label>
                      <div className="flex gap-3 relative">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={baVinculo}
                            onChange={e => { setBaVinculo(e.target.value); setShowVinculosDropdown(true); }}
                            onFocus={() => { carregarVinculos(); setShowVinculosDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowVinculosDropdown(false), 200)}
                            placeholder="Ex: Docente, Servidor"
                            className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-cyan-500/50 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white border-cyan-300 text-slate-900 focus:border-cyan-500'} border`}
                          />
                          {showVinculosDropdown && vinculosBanco.length > 0 && (
                            <div className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border shadow-2xl z-[80] overflow-y-auto max-h-60 custom-scrollbar ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                              {vinculosBanco.filter(v => v.nome.toLowerCase().includes(baVinculo.toLowerCase())).map(v => (
                                <div key={v.id} className={`px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-cyan-50 text-slate-700'}`}
                                  onClick={() => { setBaVinculo(v.nome); setShowVinculosDropdown(false); }}>
                                  {v.nome}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={onAbreGerenciarVinculos}
                          className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/30"
                          title="Gerenciar Vínculos">
                          <Plus size={24} />
                        </button>
                      </div>
                    </div>

                    {/* Data de Entrada do Item */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        Data de Entrada *
                      </label>
                      <input
                        type="date" required={status === 'BENS_ATIVOS'}
                        value={baDataEntrada} onChange={e => setBaDataEntrada(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-cyan-500/50 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white border-cyan-300 text-slate-900 focus:border-cyan-500'} border`}
                      />
                    </div>

                    {/* Origem (combobox original) */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                        Origem *
                      </label>
                      <div className="flex gap-3 relative">
                        <div className="relative flex-1">
                          <input
                            type="text" required={status === 'BENS_ATIVOS'}
                            value={baOrigem}
                            onChange={e => { setBaOrigem(e.target.value); setShowOrigensDropdown(true); }}
                            onFocus={() => { carregarOrigens(); setShowOrigensDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowOrigensDropdown(false), 200)}
                            placeholder="Ex: DPTO - DEFITO"
                            className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-cyan-500/50 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white border-cyan-300 text-slate-900 focus:border-cyan-500'} border`}
                          />
                          {showOrigensDropdown && origensBanco.length > 0 && (
                            <div className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border shadow-2xl z-[80] overflow-y-auto max-h-60 custom-scrollbar ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                              {origensBanco.filter(o => o.nome.toLowerCase().includes(baOrigem.toLowerCase())).map(o => (
                                <div key={o.id} className={`px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-cyan-50 text-slate-700'}`}
                                  onClick={() => { setBaOrigem(o.nome); setShowOrigensDropdown(false); }}>
                                  {o.nome}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={onAbreGerenciarOrigens}
                          className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/30"
                          title="Gerenciar Origem de Aquisição">
                          <Plus size={24} />
                        </button>
                      </div>
                    </div>

                    {/* Alocar Em e Condição na mesma linha */}
                    <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          Alocar em: * <span className="text-[10px] font-normal lowercase italic text-cyan-600 dark:text-cyan-500">(Onde o item ficará fisicamente)</span>
                        </label>
                        <input
                          type="text" required={status === 'BENS_ATIVOS'} readOnly
                          value={baAlocadoEm}
                          className={`w-full rounded-xl px-4 py-3 outline-none transition-all cursor-not-allowed ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'} border`}
                        />
                      </div>
                      <div className="w-full md:w-1/3">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          Condição *
                        </label>
                        <select
                          value={baCondicao}
                          onChange={(e) => setBaCondicao(e.target.value as 'Boa' | 'Ruim')}
                          className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-cyan-500/50 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white border-cyan-300 text-slate-900 focus:border-cyan-500'} border appearance-none cursor-pointer`}
                        >
                          <option value="Boa">Boa</option>
                          <option value="Ruim">Ruim</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bloco Em Manutenção */}
          <AnimatePresence initial={false}>
            {status === 'MANUTENCAO' && (
              <motion.div
                key="manutencao_block"
                initial={{ opacity: 0, height: 0, scaleY: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
                exit={{ opacity: 0, height: 0, scaleY: 0.9 }}
                className={`col-span-1 md:col-span-2 overflow-hidden rounded-2xl border-2 ${isDark ? 'bg-orange-950/30 border-orange-500/30' : 'bg-orange-50/50 border-orange-200'}`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-xl ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500 text-white'}`}>
                      <Wrench size={24} className={isDark ? '' : 'text-white'} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>Registro de Manutenção</h3>
                      <p className={`text-sm ${isDark ? 'text-orange-500/70' : 'text-orange-600/70'}`}>Preencha os dados abaixo para acompanhamento e geração do laudo de serviço.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Solicitante */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                        Solicitante (Técnico Residente ou Usuário) *
                      </label>
                      <input
                        type="text" required={status === 'MANUTENCAO'}
                        value={manutencaoSolicitante} onChange={e => setManutencaoSolicitante(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-orange-500/50 text-white focus:border-orange-500 focus:shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white border-orange-300 text-slate-900 focus:border-orange-500'} border`}
                        placeholder="Ex: Prof. Roberto"
                      />
                    </div>

                    {/* Data de Início */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                        Data Inicial *
                      </label>
                      <input
                        type="date" required={status === 'MANUTENCAO'}
                        value={manutencaoDataInicio} onChange={e => setManutencaoDataInicio(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-orange-500/50 text-white focus:border-orange-500 focus:shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white border-orange-300 text-slate-900 focus:border-orange-500'} border`}
                      />
                    </div>

                    {/* Técnico Responsável */}
                    <div className="col-span-1 md:col-span-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                        Técnico Designado (Responsável pelo Reparo) *
                      </label>
                      <select
                        required={status === 'MANUTENCAO'}
                        value={manutencaoTecnicoId} onChange={e => setManutencaoTecnicoId(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-orange-500/50 text-white focus:border-orange-500 focus:shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white border-orange-300 text-slate-900 focus:border-orange-500'} border`}
                      >
                        <option value="">Selecione um técnico da base...</option>
                        {tecnicosBanco.map(tec => (
                          <option key={tec.uid} value={tec.uid}>{tec.nomeCompleto}</option>
                        ))}
                      </select>
                    </div>

                    {/* Problema Reportado */}
                    <div className="col-span-1 md:col-span-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                        Descrição do Problema Reportado *
                      </label>
                      <textarea
                        required={status === 'MANUTENCAO'}
                        value={manutencaoProblema} onChange={e => setManutencaoProblema(e.target.value)}
                        className={`w-full rounded-xl px-4 py-3 min-h-[100px] outline-none transition-all ${isDark ? 'bg-slate-900 border-orange-500/50 text-white focus:border-orange-500 focus:shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-white border-orange-300 text-slate-900 focus:border-orange-500'} border`}
                        placeholder="Descreva detalhadamente o defeito relatado para a manutenção..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Marca (Combobox Customizado) */}
          <div>
            <label className={`block text-sm font-medium mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Marca *
            </label>
            <div className="flex gap-3 relative">
              <div className="relative flex-1">
                <input
                  type="text" required
                  value={marca}
                  readOnly={bloqueiaEdicaoGrupo}
                  onChange={e => {
                    if (bloqueiaEdicaoGrupo) return;
                    setMarca(e.target.value);
                    setShowMarcasDropdown(true);
                  }}
                  onFocus={() => {
                    if (bloqueiaEdicaoGrupo) return;
                    carregarMarcas();
                    setShowMarcasDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowMarcasDropdown(false), 200)}
                  placeholder="Ex: Dell, HP, Lenovo"
                  className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${
                    bloqueiaEdicaoGrupo 
                      ? (isDark ? 'bg-transparent border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
                      : (isDark ? 'bg-[#162033] border-slate-500 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)]')
                  } border`}
                />

                {/* Custom Dropdown */}
                {showMarcasDropdown && (marcasBanco.length > 0 || marca.length > 0) && (
                  <div className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border shadow-2xl z-[79] overflow-y-auto max-h-60 custom-scrollbar ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                    {marcasToShow.length === 0 ? (
                      <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Nenhuma sugestão para "{marca}". Apenas salve para registrar.
                      </div>
                    ) : (
                      marcasToShow.map(t => (
                        <div
                          key={t.id}
                          className={`px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-cyan-50 text-slate-700'}`}
                          onClick={() => {
                            setMarca(t.nome);
                            setShowMarcasDropdown(false);
                          }}
                        >
                          {t.nome}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {!bloqueiaEdicaoGrupo && (
                <button
                  type="button"
                  onClick={onAbreGerenciarMarcas}
                  className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/30"
                  title="Nova Marca Padrão (Banco)"
                >
                  <Plus size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Modelo (Combobox Customizado) */}
          <div>
            <label className={`block text-sm font-medium mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Modelo *
            </label>
            <div className="flex gap-3 relative">
              <div className="relative flex-1">
                <input
                  type="text" required
                  value={modelo}
                  readOnly={bloqueiaEdicaoGrupo}
                  onChange={e => {
                    if (bloqueiaEdicaoGrupo) return;
                    setModelo(e.target.value);
                    setShowModelosDropdown(true);
                  }}
                  onFocus={() => {
                    if (bloqueiaEdicaoGrupo) return;
                    carregarModelos();
                    setShowModelosDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowModelosDropdown(false), 200)}
                  placeholder="Ex: Optiplex 3020"
                  className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${
                    bloqueiaEdicaoGrupo 
                      ? (isDark ? 'bg-transparent border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed')
                      : (isDark ? 'bg-[#162033] border-slate-500 text-white focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)]')
                  } border`}
                />

                {/* Custom Dropdown */}
                {showModelosDropdown && (modelosBanco.length > 0 || modelo.length > 0) && (
                  <div className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border shadow-2xl z-[78] overflow-y-auto max-h-60 custom-scrollbar ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                    {modelosToShow.length === 0 ? (
                      <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Nenhuma sugestão para "{modelo}". Apenas salve para registrar.
                      </div>
                    ) : (
                      modelosToShow.map(t => (
                        <div
                          key={t.id}
                          className={`px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-cyan-50 text-slate-700'}`}
                          onClick={() => {
                            setModelo(t.nome);
                            setShowModelosDropdown(false);
                          }}
                        >
                          {t.nome}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {!bloqueiaEdicaoGrupo && (
                <button
                  type="button"
                  onClick={onAbreGerenciarModelos}
                  className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/30"
                  title="Novo Modelo Padrão (Banco)"
                >
                  <Plus size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Patrimônio e Série Container */}
          <div className="col-span-1 md:col-span-2 mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 p-6 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800">
            {/* Patrimônio */}
            <div>
              <label className={`block text-sm font-bold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Número de Patrimônio
                {!semRegistro && <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>* Obrigatório (se não houver Serial)</span>}
              </label>
              <input
                type="text"
                disabled={semRegistro}
                value={semRegistro ? 'Sem informação' : patrimonio} 
                onChange={e => setPatrimonio(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 outline-none transition-all font-mono ${
                  semRegistro 
                    ? (isDark ? 'bg-transparent border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed')
                    : (isDark ? 'bg-[#162033] border-slate-600 text-cyan-400 focus:border-cyan-500' : 'bg-white border-slate-300 text-cyan-700 focus:border-cyan-500')
                } border`}
                placeholder="Ex: 027442"
              />
            </div>

            {/* Série */}
            <div>
              <label className={`block text-sm font-bold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Número de Série (S/N)
                {!semRegistro && <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>* Obrigatório (se não houver Patrimônio)</span>}
              </label>
              <input
                type="text"
                disabled={semRegistro}
                value={semRegistro ? 'Sem informação' : numeroSerie} 
                onChange={e => setNumeroSerie(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 outline-none transition-all font-mono ${
                  semRegistro 
                    ? (isDark ? 'bg-transparent border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60' : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed')
                    : (isDark ? 'bg-[#162033] border-slate-600 text-cyan-400 focus:border-cyan-500' : 'bg-white border-slate-300 text-cyan-700 focus:border-cyan-500')
                } border`}
                placeholder="Ex: 5CG81234F"
              />
            </div>
            
            {/* Checkbox Sem Registro */}
            <div className="col-span-1 md:col-span-2 flex items-center gap-3 mt-2 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
              <input
                type="checkbox"
                id="semRegistroCheckbox"
                checked={semRegistro}
                onChange={(e) => setSemRegistro(e.target.checked)}
                className={`w-5 h-5 rounded cursor-pointer ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'} text-rose-500 focus:ring-rose-500`}
              />
              <label htmlFor="semRegistroCheckbox" className={`text-sm font-bold cursor-pointer select-none ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                Bem sem informação de registro
              </label>
              <span className={`text-xs ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                (Marque se o item for antigo ou não possuir nenhum número de identificação)
              </span>
            </div>
          </div>

          {/* Projeto Section */}
          <div className={`col-span-1 md:col-span-2 rounded-2xl border p-6 transition-colors ${isDark ? (temProjeto ? 'bg-slate-800/80 border-cyan-500/30' : 'bg-slate-800/30 border-slate-700')
              : (temProjeto ? 'bg-cyan-50/50 border-cyan-200' : 'bg-slate-50 border-slate-200')
            }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Projeto
              </h3>
              <button
                type="button"
                className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors duration-300 focus:outline-none ${temProjeto ? 'bg-cyan-500' : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                  }`}
                onClick={() => setTemProjeto(!temProjeto)}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${temProjeto ? 'translate-x-6' : 'translate-x-0'
                  }`} />
              </button>
            </div>

            <AnimatePresence>
              {temProjeto && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
                >
                  {/* Agência */}
                  <div className="col-span-1 md:col-span-2">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Agência
                    </label>
                    <div className="flex gap-3 relative">
                      <div className="relative flex-1">
                        <input
                          type="text" required={temProjeto}
                          value={agenciaFomento}
                          onChange={e => {
                            setAgenciaFomento(e.target.value);
                            setShowAgenciasDropdown(true);
                          }}
                          onFocus={() => {
                            carregarAgencias();
                            setShowAgenciasDropdown(true);
                          }}
                          onBlur={() => setTimeout(() => setShowAgenciasDropdown(false), 200)}
                          placeholder="Ex: CNPq, FAPESP"
                          className={`w-full rounded-xl px-4 py-3 outline-none transition-all ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500' : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'} border`}
                        />

                        {/* Custom Dropdown */}
                        {showAgenciasDropdown && (agenciasBanco.length > 0 || agenciaFomento.length > 0) && (
                          <div className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border shadow-2xl z-[77] overflow-y-auto max-h-60 custom-scrollbar ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                            {agenciasToShow.length === 0 ? (
                              <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Nenhuma sugestão para "{agenciaFomento}". Apenas salve para registrar.
                              </div>
                            ) : (
                              agenciasToShow.map(t => (
                                <div
                                  key={t.id}
                                  className={`px-4 py-3 cursor-pointer transition-colors text-sm font-medium ${isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-cyan-50 text-slate-700'}`}
                                  onClick={() => {
                                    setAgenciaFomento(t.nome);
                                    setShowAgenciasDropdown(false);
                                  }}
                                >
                                  {t.nome}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={onAbreGerenciarAgencias}
                        className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-cyan-500/30"
                        title="Nova Agência Padrão"
                      >
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>

                  {/* Processo */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Processo
                    </label>
                    <input
                      type="text" required={temProjeto}
                      value={numeroProcesso} onChange={e => setNumeroProcesso(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 outline-none transition-all font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-cyan-400 focus:border-cyan-500' : 'bg-white border-slate-300 text-cyan-600 focus:border-cyan-500'} border`}
                      placeholder="Ex: 312345/2021-0"
                    />
                  </div>

                  {/* Termo */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Termo
                    </label>
                    <input
                      type="text" required={temProjeto}
                      value={numeroTermo} onChange={e => setNumeroTermo(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 outline-none transition-all font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-cyan-400 focus:border-cyan-500' : 'bg-white border-slate-300 text-cyan-600 focus:border-cyan-500'} border`}
                      placeholder="Ex: 123/2022"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Action footer */}
        <div className={`fixed bottom-0 left-0 right-0 p-6 flex flex-col items-end gap-3 backdrop-blur-md border-t ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
          }`}>
          {erroSalvar && (
            <div className="w-full text-red-500 text-sm font-bold text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-pulse">
              ⚠️ {erroSalvar}
            </div>
          )}
          {sucessoSalvar && (
            <div className="w-full text-emerald-500 text-sm font-bold text-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/20">
              ✅ {sucessoSalvar}
            </div>
          )}
          <div className="flex justify-end items-center gap-3 w-full">
            <div className={`mr-auto flex items-center gap-3 text-sm font-medium transition-colors select-none ${isDark ? 'text-slate-400' : 'text-slate-600'}`} title="Mantém os campos preenchidos após salvar (útil para adicionar várias unidades do mesmo tipo)">
              <button
                type="button"
                className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 focus:outline-none ${manterAberto ? 'bg-cyan-500' : (isDark ? 'bg-slate-700' : 'bg-slate-300')
                  }`}
                onClick={() => setManterAberto(!manterAberto)}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${manterAberto ? 'translate-x-6' : 'translate-x-0'
                  }`} />
              </button>
              <span className="cursor-pointer hover:text-cyan-500 transition-colors" onClick={() => setManterAberto(!manterAberto)}>
                Fixar dados formulário (Lote)
              </span>
            </div>
            <button
              type="button" onClick={onClose}
              className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={carregando}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-bold transition-transform active:scale-95 shadow-lg shadow-cyan-500/30 flex items-center gap-2 disabled:opacity-70 disabled:scale-100"
            >
              {carregando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {carregando ? 'Salvando...' : 'Salvar Equipamento'}
            </button>
          </div>
        </div>

        {/* Modal Confirmação Novo Tipo */}
        <AnimatePresence>
          {confirmacaoNovoTipo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmacaoNovoTipo(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                 className={`relative w-full max-w-sm p-8 rounded-3xl shadow-2xl border flex flex-col items-center text-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
              >
                 <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-500 border border-cyan-500/20 shadow-inner">
                    <Server size={32} />
                 </div>
                 <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Novo Tipo Detectado</h3>
                 <p className={`text-sm mb-8 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                   O tipo de equipamento <strong className="text-cyan-500">{confirmacaoNovoTipo.tipo}</strong> ainda não existe no banco de sistemas. Clique em OK para adicioná-lo e concluir o cadastro do item.
                 </p>
                 <div className="flex gap-3 w-full">
                   <button type="button" onClick={() => setConfirmacaoNovoTipo(null)} className={`flex-1 p-3 rounded-xl transition-colors font-bold text-sm ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                     Cancelar
                   </button>
                   <button type="button" onClick={confirmacaoNovoTipo.prosseguir} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-xl transition-all font-bold text-sm shadow-lg shadow-cyan-500/30">
                     OK, Cadastrar
                   </button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </form>
    </EstoqueSidePanel>
  );
};

export default EstoqueFormModal;
