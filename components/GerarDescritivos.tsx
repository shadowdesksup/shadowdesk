import React, { useState, useEffect } from 'react';
import { motion, Reorder, useDragControls, AnimatePresence } from 'framer-motion';
import { Save, Download, Plus, Trash2, LayoutTemplate, GripVertical, ChevronLeft, ChevronRight, FileText, Edit, X, AlertTriangle, Check } from 'lucide-react';
import { DescricaoEquipamento } from '../types';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import DescritivoDocument from './Relatorios/DescritivoDocument';

// Helper de ID
const gerarId = () => Math.random().toString(36).substr(2, 9);

interface ItemComId {
  id: string;
  item: string;
  status: string;
  observacao: string;
}

interface ImagemComId {
  id: string;
  file: string;
}

interface ModeloDescritivo extends Omit<DescricaoEquipamento, 'id' | 'criadoEm' | 'dataLaudo'> {
  id: string;
  nomeModelo: string;
}

interface GerarDescritivosProps {
  theme?: 'dark' | 'light';
  usuarioId: string;
  nomeUsuario: string;
  onSalvar: (dados: Omit<DescricaoEquipamento, 'id' | 'criadoEm'>) => Promise<void>;
}

// Subcomponente para Item Arrastável (Componentes e Acessórios)
const DraggableItem = ({ item, onChange, onRemove, isDark, placeholderItem, placeholderStatus }: {
  item: ItemComId;
  onChange: (id: string, field: 'item' | 'status', value: string) => void;
  onRemove: (id: string) => void;
  isDark: boolean;
  placeholderItem: string;
  placeholderStatus: string;
}) => {
  const controls = useDragControls();

  // Styles
  const inputClass = `w-full rounded-xl border h-11 px-4 focus:outline-none transition-all ${isDark
    ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-600'
    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
    }`;

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={controls}
      className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors mb-3 ${isDark ? 'border-white/5 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}
    >
      <div className="flex gap-3 items-center">
        {/* Drag Handle com prevenção de seleção */}
        <div
          onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
          className={`cursor-grab active:cursor-grabbing p-2 rounded-lg transition-colors flex-shrink-0 touch-none select-none ${isDark ? 'hover:bg-white/5 text-slate-600 hover:text-slate-300' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'}`}
        >
          <GripVertical size={20} />
        </div>

        <input
          value={item.item}
          onChange={e => onChange(item.id, 'item', e.target.value)}
          className={`${inputClass} font-semibold w-1/3`}
          placeholder={placeholderItem}
        />
        <input
          value={item.status}
          onChange={e => onChange(item.id, 'status', e.target.value)}
          className={`${inputClass} flex-1`}
          placeholder={placeholderStatus}
        />
        <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0">
          <Trash2 size={18} />
        </button>
      </div>
    </Reorder.Item>
  );
};

// Subcomponente para Imagem com Setas de Ordenação
const ImageCard = ({
  img,
  onRemove,
  onMove,
  index,
  total
}: {
  img: ImagemComId;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: 'left' | 'right') => void;
  index: number;
  total: number;
}) => {
  return (
    <div
      className="relative group rounded-xl overflow-hidden border border-slate-700/50 bg-black w-[200px] aspect-video flex-shrink-0 shadow-sm hover:shadow-md transition-all"
    >
      <img src={img.file} alt="Equipamento" className="w-full h-full object-cover pointer-events-none select-none opacity-90 group-hover:opacity-100 transition-opacity" />

      {/* Botões de Ordenação (Setas) */}
      <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {/* Seta Esquerda */}
        <button
          onClick={(e) => { e.stopPropagation(); onMove(index, 'left'); }}
          disabled={index === 0}
          className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-sm transition-all ${index === 0 ? 'bg-black/20 text-white/30 cursor-not-allowed' : 'bg-black/60 hover:bg-black/80 text-white hover:scale-110 cursor-pointer'
            }`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Seta Direita */}
        <button
          onClick={(e) => { e.stopPropagation(); onMove(index, 'right'); }}
          disabled={index === total - 1}
          className={`pointer-events-auto p-1.5 rounded-full backdrop-blur-sm transition-all ${index === total - 1 ? 'bg-black/20 text-white/30 cursor-not-allowed' : 'bg-black/60 hover:bg-black/80 text-white hover:scale-110 cursor-pointer'
            }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Botão Remover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
          className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm shadow-sm"
          title="Remover"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// Default items com IDs
const DEFAULT_COMPONENTES: ItemComId[] = [
  { id: '1', item: 'Carcaça / Moldura / Gabinete', status: 'Boas condições, sem detalhes ou riscos.', observacao: '' },
  { id: '2', item: 'Botões', status: 'Foram testados. Estão em boas condições e pleno funcionamento.', observacao: '' },
  { id: '3', item: 'Tela / Display', status: 'Tela apresenta problema...', observacao: '' },
  { id: '4', item: 'Entradas USB / Card Reader / Entrada P2', status: 'Entradas USB testadas e funcionais...', observacao: '' },
  { id: '5', item: 'Webcam / Microfone / Speaker', status: 'Microfone e webcam foram testados...', observacao: '' },
  { id: '6', item: 'Ethernet / Wi-Fi', status: 'Interface de rede Ethernet e WIFI testadas...', observacao: '' }
];

const GerarDescritivos: React.FC<GerarDescritivosProps> = ({ theme = 'dark', usuarioId, nomeUsuario, onSalvar }) => {
  const isDark = theme === 'dark';

  // Form State
  const [dataLaudo, setDataLaudo] = useState(new Date().toISOString().split('T')[0]);

  // Info Tecnica
  const [equipamento, setEquipamento] = useState('ALL-IN-ONE');
  const [marca, setMarca] = useState('HP');
  const [modelo, setModelo] = useState('AIO 200 - 5120br');
  const [patrimonio, setPatrimonio] = useState('27041');
  const [ns, setNs] = useState('BRH1240K47');

  // Descrições
  const [descricaoAvaliacao, setDescricaoAvaliacao] = useState('A avaliação inicial das condições físicas do equipamento, considerando o estado de conservação da carcaça, moldura, botões, tela/display, driver CD/DVD, speaker interno, microfone, webcam; bem como suas conexões de: rede, usb, P2, vídeo out VGA/HDMI e leitor de cartão. Avaliação do hardware interno, memória RAM, processador, HD/SSD, etc...');

  // Componentes Dinâmicos (com Reorder)
  const [componentes, setComponentes] = useState<ItemComId[]>(DEFAULT_COMPONENTES);

  // Acessórios Dinâmicos (com Reorder)
  const [acessorios, setAcessorios] = useState<ItemComId[]>([{ id: 'acc1', item: 'Fonte de alimentação', status: 'Fonte de alimentação inclusa.', observacao: '' }]);

  const [conclusao, setConclusao] = useState('O microcomputador HP All-in-One 200-5120br está condenado por falha irreversível de hardware. Recomendamos o descarte.');

  const [showPreview, setShowPreview] = useState(true);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [imagensEquipamento, setImagensEquipamento] = useState<ImagemComId[]>([]);

  // Modelos State
  const [modelos, setModelos] = useState<ModeloDescritivo[]>([]);
  const [modeloSelecionado, setModeloSelecionado] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'delete'>('create');
  const [modelNameInput, setModelNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Models
  useEffect(() => {
    const q = query(collection(db, 'modelos_descritivos'), orderBy('nomeModelo'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const models = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ModeloDescritivo[];
      setModelos(models);
    });
    return () => unsubscribe();
  }, []);

  // Modal Handlers
  const handleOpenCreate = () => {
    setModalMode('create');
    setModelNameInput('');
    setModalOpen(true);
  };

  const handleOpenEdit = () => {
    if (!modeloSelecionado) return;
    const currentModel = modelos.find(m => m.id === modeloSelecionado);
    if (currentModel) {
      setModalMode('edit');
      setModelNameInput(currentModel.nomeModelo);
      setModalOpen(true);
    }
  };

  const handleOpenDelete = () => {
    if (!modeloSelecionado) return;
    setModalMode('delete');
    setModalOpen(true);
  };

  const handleConfirmModal = async () => {
    if (isProcessing) return;

    // Verificar autenticação antes de salvar
    if (!usuarioId) {
      alert('Você precisa estar autenticado para salvar um modelo.');
      return;
    }

    setIsProcessing(true);

    try {
      const modeloData = {
        nomeModelo: modelNameInput,
        equipamento,
        marca,
        modelo,
        patrimonio,
        ns,
        descricaoAvaliacao,
        componentes: componentes.map(({ id, ...rest }) => rest),
        acessorios: acessorios.map(({ id, ...rest }) => rest),
        conclusao,
        imagensEquipamento: imagensEquipamento.map(img => img.file),
        criadoPor: usuarioId,
        criadoEm: new Date().toISOString()
      };

      if (modalMode === 'create') {
        if (!modelNameInput.trim()) {
          alert("Por favor, insira um nome para o modelo.");
          setIsProcessing(false);
          return;
        }
        const docRef = await addDoc(collection(db, 'modelos_descritivos'), modeloData);
        setModeloSelecionado(docRef.id);
      } else if (modalMode === 'edit') {
        if (!modeloSelecionado) return;
        if (!modelNameInput.trim()) {
          alert("Por favor, insira um nome para o modelo.");
          setIsProcessing(false);
          return;
        }
        const docRef = doc(db, 'modelos_descritivos', modeloSelecionado);
        await updateDoc(docRef, modeloData);
      } else if (modalMode === 'delete') {
        if (!modeloSelecionado) return;
        const docRef = doc(db, 'modelos_descritivos', modeloSelecionado);
        await deleteDoc(docRef);
        setModeloSelecionado('');
      }
      setModalOpen(false);
    } catch (error: any) {
      console.error("Erro ao processar ação:", error);
      let errorMsg = "Ocorreu um erro desconhecido.";

      if (error.code === 'storage/quota-exceeded' || error.message?.includes('exceeded')) {
        errorMsg = "Erro: O tamanho do modelo excede o limite permitido (1MB). Tente reduzir o número de imagens ou a qualidade delas.";
      } else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
        errorMsg = "Erro: Permissão negada no Firestore. As regras de segurança precisam ser publicadas. Execute 'firebase deploy --only firestore:rules' no terminal.";
      } else if (error.message) {
        errorMsg = `Erro: ${error.message}`;
      }

      console.error('Detalhes do erro:', { code: error.code, message: error.message, error });

      alert(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };


  const carregarModelo = (modeloId: string) => {
    setModeloSelecionado(modeloId);
    if (!modeloId) return;

    const modelo = modelos.find(m => m.id === modeloId);
    if (modelo) {
      setEquipamento(modelo.equipamento);
      setMarca(modelo.marca);
      setModelo(modelo.modelo);
      setPatrimonio(modelo.patrimonio);
      setNs(modelo.ns);
      setDescricaoAvaliacao(modelo.descricaoAvaliacao);
      setConclusao(modelo.conclusao);

      // Regenerate IDs for imported items to allow independent manipulation
      setComponentes(modelo.componentes.map(c => ({ ...c, id: generatingId() })));
      setAcessorios(modelo.acessorios.map(a => ({ ...a, id: generatingId() })));

      // Load Images
      if (modelo.imagensEquipamento && Array.isArray(modelo.imagensEquipamento)) {
        setImagensEquipamento(modelo.imagensEquipamento.map(file => ({ id: generatingId(), file })));
      } else {
        setImagensEquipamento([]);
      }
    }
  };


  // Handlers para Imagens
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagensEquipamento(prev => [...prev, { id: generatingId(), file: base64 }]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Wrapper para gerar ID unico no contexto
  const generatingId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

  const removeImage = (id: string) => {
    setImagensEquipamento(prev => prev.filter(img => img.id !== id));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === imagensEquipamento.length - 1) return;

    setImagensEquipamento(prev => {
      const newArr = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      const temp = newArr[index];
      newArr[index] = newArr[targetIndex];
      newArr[targetIndex] = temp;
      return newArr;
    });
  };

  // Handlers para Componentes
  const handleComponentChange = (id: string, field: 'item' | 'status', value: string) => {
    setComponentes(prev => prev.map(comp => comp.id === id ? { ...comp, [field]: value } : comp));
  };

  const addComponent = () => {
    setComponentes([...componentes, { id: generatingId(), item: 'Novo Item', status: 'Em bom estado', observacao: '' }]);
  };

  const removeComponent = (id: string) => {
    setComponentes(prev => prev.filter(c => c.id !== id));
  };

  // Handlers para Acessórios
  const handleAcessorioChange = (id: string, field: 'item' | 'status', value: string) => {
    setAcessorios(prev => prev.map(acc => acc.id === id ? { ...acc, [field]: value } : acc));
  };

  const addAcessorio = () => {
    setAcessorios([...acessorios, { id: generatingId(), item: 'Novo Acessório', status: 'Incluso', observacao: '' }]);
  };

  const removeAcessorio = (id: string) => {
    setAcessorios(prev => prev.filter(a => a.id !== id));
  };


  // PDF Generation
  const handleDownloadPDF = async () => {
    try {
      setGerandoPDF(true);
      const blob = (await pdf(<DescritivoDocument descritivo={dadosAtuais} />).toBlob()) as Blob;
      saveAs(blob, `Descritivo_${patrimonio}_${dataLaudo}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF", error);
      alert("Erro ao baixar PDF");
    } finally {
      setGerandoPDF(false);
    }
  };


  // Live Data Object
  const dadosAtuais: DescricaoEquipamento = {
    id: 'preview',
    dataLaudo: dataLaudo,
    equipamento,
    marca,
    modelo,
    patrimonio,
    ns,
    descricaoAvaliacao,
    componentes: componentes.map(({ id, ...rest }) => rest),
    acessorios: acessorios.map(({ id, ...rest }) => rest),
    conclusao,
    imagensEquipamento: imagensEquipamento.map(img => img.file),
    criadoPor: usuarioId,
    criadoEm: new Date().toISOString()
  };

  // Styles
  const inputClass = `w-full rounded-xl border h-11 px-4 focus:outline-none transition-all ${isDark
    ? 'border-white/10 bg-slate-900/50 text-slate-200 focus:border-cyan-500/50 focus:bg-slate-900/80 placeholder:text-slate-600'
    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-cyan-500 focus:bg-white placeholder:text-slate-400'
    }`;

  const labelClass = `block text-xs font-bold uppercase tracking-wider mb-1.5 ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

  const cardClass = `p-6 rounded-2xl border shadow-lg transition-colors duration-300 ${isDark
    ? 'border-white/10 bg-slate-900/80 shadow-black/20'
    : 'border-slate-200 bg-white shadow-slate-200/50'
    }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full flex flex-col wide:flex-row gap-4 overflow-y-auto wide:overflow-hidden p-2 relative"
    >

      {/* MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}
            >
              <button
                onClick={() => setModalOpen(false)}
                className={`absolute top-4 right-4 p-1 rounded-full hover:bg-black/10 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${modalMode === 'delete' ? 'bg-red-500/10 text-red-500' :
                  modalMode === 'edit' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                  {modalMode === 'delete' ? <Trash2 size={24} /> :
                    modalMode === 'edit' ? <Edit size={24} /> :
                      <Save size={24} />}
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {modalMode === 'delete' ? 'Excluir Modelo' :
                    modalMode === 'edit' ? 'Editar Modelo' :
                      'Salvar Novo Modelo'}
                </h3>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {modalMode === 'delete'
                    ? 'Tem certeza que deseja excluir este modelo? Esta ação não pode ser desfeita.'
                    : modalMode === 'edit'
                      ? 'Atualize o nome do modelo se desejar. Isso substituirá os dados do modelo existente pelos dados atuais do formulário.'
                      : 'Dê um nome para o seu novo modelo para identificá-lo posteriormente.'}
                </p>
              </div>

              {modalMode !== 'delete' && (
                <div className="mb-6">
                  <label className={labelClass}>Nome do Modelo</label>
                  <input
                    autoFocus
                    value={modelNameInput}
                    onChange={(e) => setModelNameInput(e.target.value)}
                    placeholder="Ex: PC Padrão Sala 101"
                    className={inputClass}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmModal()}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmModal}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${modalMode === 'delete'
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                    : modalMode === 'edit'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                    } ${isProcessing ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isProcessing ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: FORM */}
      <div className={`flex-1 flex flex-col gap-4 pr-2 w-full ${showPreview ? 'wide:max-w-[50%]' : ''} wide:overflow-y-auto custom-scrollbar`}>

        {/* Header Compacto */}
        <div
          className={cardClass}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-bold tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
              Dados do Laudo
            </h2>
            <div className="flex items-center gap-3">
              {/* Dropdown de Modelos */}
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <select
                    value={modeloSelecionado}
                    onChange={(e) => carregarModelo(e.target.value)}
                    className={`appearance-none py-2 pl-9 pr-8 rounded-lg text-sm font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all ${isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <option value="">Carregar Modelo...</option>
                    {modelos.map(m => (
                      <option key={m.id} value={m.id}>{m.nomeModelo}</option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <FileText size={16} />
                  </div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>

                {/* Edit/Delete Actions */}
                {modeloSelecionado && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleOpenEdit}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-amber-500/20 text-slate-400 hover:text-amber-500' : 'hover:bg-amber-100 text-slate-500 hover:text-amber-600'}`}
                      title="Editar Modelo Atual"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={handleOpenDelete}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-500' : 'hover:bg-red-100 text-slate-500 hover:text-red-600'}`}
                      title="Excluir Modelo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className={`w-px h-6 mx-1 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'}`}
                title="Toggle Preview"
              >
                <LayoutTemplate size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Data</label>
              <input type="date" value={dataLaudo} onChange={e => setDataLaudo(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Patrimônio</label>
              <input value={patrimonio} onChange={e => setPatrimonio(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Equipamento</label>
              <input value={equipamento} onChange={e => setEquipamento(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Marca</label>
              <input value={marca} onChange={e => setMarca(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-1">
              <label className={labelClass}>Modelo</label>
              <input value={modelo} onChange={e => setModelo(e.target.value)} className={inputClass} />
            </div>
            <div className="col-span-1">
              <label className={labelClass}>Nº Série (NS)</label>
              <input value={ns} onChange={e => setNs(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Avaliação Técnica */}
        {/* Avaliação Técnica */}
        <div
          className={cardClass}
        >
          <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Descrição da Avaliação
          </h3>
          <textarea
            value={descricaoAvaliacao}
            onChange={e => setDescricaoAvaliacao(e.target.value)}
            rows={4}
            className={`${inputClass} h-auto py-3 resize-y min-h-[120px]`}
          />
        </div>

        {/* Componentes Dinâmicos */}
        {/* Componentes Dinâmicos */}
        <div
          className={cardClass}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Componentes
            </h3>
            <button onClick={addComponent} className="text-cyan-500 hover:text-cyan-400 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
              <Plus size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Reorder.Group axis="y" values={componentes} onReorder={setComponentes} className="flex flex-col">
              {componentes.map((comp) => (
                <DraggableItem
                  key={comp.id}
                  item={comp}
                  onChange={handleComponentChange}
                  onRemove={removeComponent}
                  isDark={isDark}
                  placeholderItem="Nome do Componente"
                  placeholderStatus="Status / Condição"
                />
              ))}
            </Reorder.Group>
          </div>
        </div>

        {/* Acessórios Dinâmicos */}
        {/* Acessórios Dinâmicos */}
        <div
          className={cardClass}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Acessórios
            </h3>
            <button onClick={addAcessorio} className="text-cyan-500 hover:text-cyan-400 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors">
              <Plus size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <Reorder.Group axis="y" values={acessorios} onReorder={setAcessorios} className="flex flex-col">
              {acessorios.map((acc) => (
                <DraggableItem
                  key={acc.id}
                  item={acc}
                  onChange={handleAcessorioChange}
                  onRemove={removeAcessorio}
                  isDark={isDark}
                  placeholderItem="Nome do Item"
                  placeholderStatus="Status / Observação"
                />
              ))}
            </Reorder.Group>
          </div>

          <div>
            <label className={labelClass}>Conclusão</label>
            <textarea
              value={conclusao}
              onChange={e => setConclusao(e.target.value)}
              rows={4}
              className={`${inputClass} h-auto py-3 resize-y min-h-[120px]`}
            />
          </div>
        </div>

        {/* Imagens do Equipamento */}
        {/* Imagens do Equipamento */}
        <div
          className={cardClass}
        >
          <label className={labelClass}>Imagens do Equipamento</label>
          {/* Enhanced drag-and-drop area */}
          <div
            onClick={() => document.getElementById('image-upload')?.click()}
            className={`flex items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 group ${isDark
              ? 'border-cyan-500/30 bg-slate-900/50 hover:bg-slate-900/80 hover:border-cyan-500'
              : 'border-cyan-600/30 bg-slate-50 hover:bg-slate-100 hover:border-cyan-600'}`}
            style={{ minHeight: '160px' }}
          >
            <div className="flex flex-col items-center">
              <div className={`p-4 rounded-full mb-3 transition-transform group-hover:scale-110 ${isDark ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Clique para carregar imagens</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>ou arraste e solte aqui</p>
            </div>
          </div>
          <input id="image-upload" type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />

          {imagensEquipamento.length > 0 && (
            <div className="mt-6 w-full overflow-x-auto pb-4 custom-scrollbar">
              <div className="flex gap-4 min-w-max">
                {imagensEquipamento.map((img, index) => (
                  <ImageCard
                    key={img.id}
                    img={img}
                    onRemove={removeImage}
                    onMove={moveImage}
                    index={index}
                    total={imagensEquipamento.length}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex gap-4 pb-8 pt-2"
        >
          <button
            onClick={handleOpenCreate}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-900/20 transition-all"
          >
            <Save size={20} /> Salvar Modelo
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={gerandoPDF}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-900/20 transition-all disabled:opacity-50"
          >
            <Download size={20} /> {gerandoPDF ? 'Gerando...' : 'Baixar PDF'}
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: PREVIEW - Hidden on mobile (<768px), visible and stacked on tablet (768-1089px), side-by-side on wide (≥1090px) */}
      {showPreview && (
        <div className="hidden md:flex flex-1 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-zinc-900 min-h-[600px] wide:h-full">
          <PDFViewer style={{ width: '100%', height: '100%' }} showToolbar={true}>
            <DescritivoDocument descritivo={dadosAtuais} />
          </PDFViewer>
        </div>
      )}

    </motion.div>
  );
};

export default GerarDescritivos;
