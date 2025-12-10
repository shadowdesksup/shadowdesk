import React, { useState } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { Save, Download, Plus, Trash2, LayoutTemplate, GripVertical } from 'lucide-react';
import { DescricaoEquipamento } from '../types';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
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

// Subcomponente para Imagem Arrastável
const DraggableImage = ({ img, onRemove }: { img: ImagemComId, onRemove: (id: string) => void }) => {
  // Imagem é arrastável diretamente (padrão dragListener=true do Reorder.Item)
  return (
    <Reorder.Item
      value={img}
      id={img.id}
      className="relative group rounded-xl overflow-hidden border border-slate-700/50 bg-black w-[200px] aspect-video cursor-grab active:cursor-grabbing flex-shrink-0 shadow-sm hover:shadow-md transition-all"
    >
      <img src={img.file} alt="Equipamento" className="w-full h-full object-cover pointer-events-none select-none opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Visual Grab Indicator */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm text-white/80">
          <GripVertical size={24} className="rotate-90" />
        </div>
      </div>

      {/* Botão Remover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onRemove(img.id)}
          className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
          title="Remover"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </Reorder.Item>
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
      className="h-full flex gap-4 overflow-hidden p-2"
    >

      {/* LEFT COLUMN: FORM */}
      <div className={`flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar ${showPreview ? 'max-w-[50%]' : 'max-w-full'}`}>

        {/* Header Compacto */}
        <div
          className={cardClass}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-bold tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
              Dados do Laudo
            </h2>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'}`}
              title="Toggle Preview"
            >
              <LayoutTemplate size={20} />
            </button>
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
              <Reorder.Group axis="x" values={imagensEquipamento} onReorder={setImagensEquipamento} className="flex gap-4 min-w-max">
                {imagensEquipamento.map((img) => (
                  <DraggableImage key={img.id} img={img} onRemove={removeImage} />
                ))}
              </Reorder.Group>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex gap-4 pb-8 pt-2"
        >
          <button
            onClick={() => onSalvar(dadosAtuais)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white h-12 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-900/20 transition-all"
          >
            <Save size={20} /> Salvar Rascunho
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

      {/* RIGHT COLUMN: PREVIEW */}
      {showPreview && (
        <div className="flex-1 h-full rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-zinc-900">
          <PDFViewer style={{ width: '100%', height: '100%' }} showToolbar={true}>
            <DescritivoDocument descritivo={dadosAtuais} />
          </PDFViewer>
        </div>
      )}

    </motion.div>
  );
};

export default GerarDescritivos;
