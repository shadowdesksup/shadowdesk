import React, { useState, useEffect } from 'react';
import { Package, MapPin, Search, Truck, Printer } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEstoque } from '../hooks/useEstoque';
import EstoqueStats from './EstoqueStats';
import EstoqueGrid, { GrupoEstoque } from './EstoqueGrid';
import EstoqueDetailPanel from './EstoqueDetailPanel';
import EstoqueFormModal from './EstoqueFormModal';
import GerenciarLocaisModal from './GerenciarLocaisModal';
import GerenciarTiposModal from './GerenciarTiposModal';
import GerenciarMarcasModal from './GerenciarMarcasModal';
import GerenciarModelosModal from './GerenciarModelosModal';
import GerenciarAgenciasModal from './GerenciarAgenciasModal';
import GerenciarVinculosModal from './GerenciarVinculosModal';
import GerenciarOrigensModal from './GerenciarOrigensModal';
import EstoqueFluxoModal, { ModoFluxo } from './EstoqueFluxoModal';
import EstoqueMovimentacaoModal from './EstoqueMovimentacaoModal';
import EstoqueMovimentadosModal from './EstoqueMovimentadosModal';
import EstoqueItemViewModal from './EstoqueItemViewModal';
import EstoquePrintingModal from './EstoquePrintingModal';
import { EquipamentoEstoque } from '../types';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

interface EstoquePageProps {
  theme?: 'dark' | 'light';
}

const EstoquePage: React.FC<EstoquePageProps> = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const { usuario, dadosUsuario } = useAuth();
  const { estoque, carregando, erro, criarEquipamento, atualizarEquipamento, deletarEquipamento } = useEstoque();

  const estoqueAtivo = React.useMemo(() => estoque.filter(e => e.status !== 'MANUTENCAO' && e.status !== 'TRANSFERIDO' && e.status !== 'DESCARTADO'), [estoque]);

  const [buscaGeral, setBuscaGeral] = useState('');

  // Gestão de Paineis
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<string | null>(null);
  
  // Painel de Formulário
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [equipamentoEditando, setEquipamentoEditando] = useState<EquipamentoEstoque | null>(null);

  // Painel de Locais e Dicionários
  const [isLocaisModalOpen, setIsLocaisModalOpen] = useState(false);
  const [isTiposModalOpen, setIsTiposModalOpen] = useState(false);
  const [isMarcasModalOpen, setIsMarcasModalOpen] = useState(false);
  const [isModelosModalOpen, setIsModelosModalOpen] = useState(false);
  const [isAgenciasModalOpen, setIsAgenciasModalOpen] = useState(false);
  const [isVinculosModalOpen, setIsVinculosModalOpen] = useState(false);
  const [isOrigensModalOpen, setIsOrigensModalOpen] = useState(false);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [movimentacaoPreItem, setMovimentacaoPreItem] = useState<EquipamentoEstoque | null>(null);
  const [isMovimentadosModalOpen, setIsMovimentadosModalOpen] = useState(false);
  const [isPrintingModalOpen, setIsPrintingModalOpen] = useState(false);

  // Painel de Fluxos
  const [fluxoConfig, setFluxoConfig] = useState<{isOpen: boolean, modo: ModoFluxo, item: EquipamentoEstoque | null}>({
    isOpen: false, modo: null, item: null
  });

  // Global Scanned Item Modal (Leitura por Pistola Bipe)
  const [scannedItem, setScannedItem] = useState<EquipamentoEstoque | null>(null);

  // Escutador Global do Barcode Scanner
  useBarcodeScanner({
    onScan: (codigo) => {
      // 1. Procurar no estoque inteiro (ativo, manutenção, transferido, etc)
      // Como patrimônio e serial teoricamente são únicos, pegamos o primeiro match exato.
      const match = estoque.find(
        (e) => 
          `SD-${e.id.substring(0,8).toUpperCase()}` === codigo.toUpperCase() ||
          e.patrimonio?.toLowerCase() === codigo.toLowerCase() || 
          e.numeroSerie?.toLowerCase() === codigo.toLowerCase()
      );
      
      if (match) {
        setScannedItem(match); // Abre a ficha do item na tela!
      } else {
        console.warn(`Código bípado [${codigo}] não encontrado no sistema.`);
        // Opcional: Aqui poderíamos disparar um toast notificando "Patrimônio não encontrado".
      }
    }
  });

  // Derived state para o grupo selecionado (atualiza reativamente)
  const grupoSelecionado = React.useMemo(() => {
    if (!grupoSelecionadoId) return null;
    const filtrados = estoqueAtivo.filter(i => `${i.tipo}|${i.marca}|${i.modelo}` === grupoSelecionadoId);
    if (filtrados.length === 0) return null;
    return {
      id: grupoSelecionadoId,
      tipo: filtrados[0].tipo,
      marca: filtrados[0].marca,
      modelo: filtrados[0].modelo,
      imagemUrl: filtrados.find(f => f.imagemUrl)?.imagemUrl,
      itens: filtrados,
      quantidade: filtrados.length
    } as GrupoEstoque;
  }, [estoqueAtivo, grupoSelecionadoId]);

  const handleOpenFormModal = (item?: EquipamentoEstoque) => {
    setEquipamentoEditando(item || null);
    setIsFormModalOpen(true);
  };

  const handleSalvarEquipamento = async (dados: Partial<EquipamentoEstoque>) => {
    const nomeUser = dadosUsuario?.nomeCompleto || usuario?.email || 'Sistema';
    
    if (equipamentoEditando && equipamentoEditando.id) {
      await atualizarEquipamento(equipamentoEditando.id, {
        ...dados,
        historico: [
          ...(equipamentoEditando.historico || []),
          {
            acao: 'Dados atualizados',
            data: new Date().toISOString(),
            usuarioId: usuario?.uid || '',
            usuarioNome: nomeUser
          }
        ]
      });
    } else {
      const novoItem: Omit<EquipamentoEstoque, 'id'> = {
        ...dados as Omit<EquipamentoEstoque, 'id' | 'historico' | 'dataEntrada' | 'usuarioCadastro' | 'usuarioCadastroId'>,
        historico: [{
           acao: 'Cadastro inicial',
           data: new Date().toISOString(),
           usuarioId: usuario?.uid || '',
           usuarioNome: nomeUser
        }],
        dataEntrada: new Date().toISOString(),
        usuarioCadastro: nomeUser,
        usuarioCadastroId: usuario?.uid,
      };
      await criarEquipamento(novoItem);
    }
  };

  const openFluxo = (item: EquipamentoEstoque, modo: ModoFluxo) => {
    setFluxoConfig({ isOpen: true, modo, item });
  };

  const handleConfirmarTransferencia = async (localId: string, localNome: string, recebedor: string) => {
    const item = fluxoConfig.item;
    if (!item) return;
    const nomeUser = dadosUsuario?.nomeCompleto || usuario?.email || 'Sistema';
    
    await atualizarEquipamento(item.id, {
      status: 'TRANSFERIDO',
      detalhes: {
        ...item.detalhes,
        localDestinoId: localId,
        localDestinoNome: localNome,
        recebedorNome: recebedor
      },
      historico: [
        ...(item.historico || []),
        {
          acao: `Transferido para ${localNome} (Resp: ${recebedor})`,
          data: new Date().toISOString(),
          usuarioId: usuario?.uid || '',
          usuarioNome: nomeUser
        }
      ]
    });
  };

  const handleConfirmarDescarte = async (motivo: string) => {
    const item = fluxoConfig.item;
    if (!item) return;
    const nomeUser = dadosUsuario?.nomeCompleto || usuario?.email || 'Sistema';

    await atualizarEquipamento(item.id, {
      status: 'DESCARTADO',
      detalhes: {
        ...item.detalhes,
        motivoDescarte: motivo
      },
      historico: [
        ...(item.historico || []),
        {
          acao: `Descartado. Motivo técnico (Laudo): ${motivo}`,
          data: new Date().toISOString(),
          usuarioId: usuario?.uid || '',
          usuarioNome: nomeUser
        }
      ]
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente este equipamento? ISSO DELETA DO BANCO E NÃO GERA HISTÓRICO.')) {
      deletarEquipamento(id);
    }
  };

  return (
    <div className="h-full overflow-y-auto pr-2 md:pr-4 relative flex flex-col">
      {/* Smart Header Section */}
      <div className={`p-6 md:p-8 mb-8 rounded-3xl border backdrop-blur-md shadow-xl flex flex-col gap-6 bg-cover bg-center ${isDark ? 'bg-slate-900/80 border-cyan-500/20' : 'bg-white border-cyan-500/10'}`} style={{ backgroundImage: isDark ? 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80")' : 'linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8)), url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80")' }}>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
          <div>
            <h2 className={`text-4xl font-extrabold flex items-center gap-3 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-lg shadow-cyan-500/30">
                <Package className="text-white" size={32} />
              </div>
              Controle de Bens e Ativos
            </h2>
            <p className={`mt-2 text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerenciamento dinâmico avançado do ciclo de vida dos ativos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPrintingModalOpen(true)}
              className="group px-5 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white flex items-center gap-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              title="Gerar/Imprimir Etiquetas em Lote"
            >
              <Printer size={20} className="group-hover:text-cyan-400 transition-colors" />
              <span className="hidden sm:inline tracking-wide text-[15px] drop-shadow-sm">Etiquetas</span>
            </button>
            <button 
              onClick={() => setIsMovimentacaoModalOpen(true)}
              className="group px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white flex items-center gap-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Truck size={20} className="drop-shadow-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              <span className="tracking-wide text-[15px] drop-shadow-sm">Movimentação</span>
            </button>
            <button 
              onClick={() => handleOpenFormModal()}
              className="group px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center gap-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Package size={20} className="drop-shadow-sm group-hover:rotate-12 transition-transform" />
              <span className="tracking-wide text-[15px] drop-shadow-sm">Nova Entrada</span>
            </button>
          </div>
        </div>

        {/* Estatísticas High-End */}
        <div className="z-10 mt-2">
           <EstoqueStats estoque={estoque} theme={theme} onMovimentadosClick={() => setIsMovimentadosModalOpen(true)} />
        </div>

        {/* Global Search integrated in header */}
        <div className="z-10 w-full max-w-2xl relative">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
            isDark 
              ? 'bg-slate-900/90 border-cyan-500/30 text-white focus-within:border-cyan-400 focus-within:shadow-cyan-500/20' 
              : 'bg-white/90 border-slate-300 text-slate-800 focus-within:border-cyan-500 focus-within:shadow-cyan-500/10'
          }`}>
            <Search size={22} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
            <input 
              type="text"
              placeholder="Pesquisar em todo o inventário..."
              value={buscaGeral}
              onChange={e => setBuscaGeral(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-lg placeholder-opacity-50"
            />
          </div>
        </div>

      </div>

      {erro && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 mb-6 font-medium">
          {erro}
        </div>
      )}

      {carregando && estoqueAtivo.length === 0 ? (
        <div className={`p-16 text-center rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-900/60 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-cyan-500/50" />
          <p className="text-xl font-semibold tracking-wide animate-pulse">Sincronizando banco de dados...</p>
        </div>
      ) : (
        <div className="flex-1 pb-10">
          <EstoqueGrid 
            estoque={estoqueAtivo}
            busca={buscaGeral}
            theme={theme}
            onSelectGroup={(grupo) => setGrupoSelecionadoId(grupo.id)}
          />
        </div>
      )}

      {/* Paneis / Drawers (Antigos Modais reformulados) */}
      
      <EstoqueDetailPanel
        grupo={grupoSelecionado}
        isOpen={grupoSelecionadoId !== null}
        onClose={() => setGrupoSelecionadoId(null)}
        theme={theme}
        onAdicionarUnidade={() => {
           // Pré-preenche os dados comuns para adicionar unidade rapidamente neste grupo
           setEquipamentoEditando({
             id: '', tipo: grupoSelecionado?.tipo || '', marca: grupoSelecionado?.marca || '', modelo: grupoSelecionado?.modelo || '', status: '', dataEntrada: '', usuarioCadastro: '', historico: []
           });
           setIsFormModalOpen(true);
        }}
        onEditar={handleOpenFormModal}
        onTransferir={(item) => { setMovimentacaoPreItem(item); setIsMovimentacaoModalOpen(true); }}
        onDescartar={(item) => openFluxo(item, 'DESCARTE')}
        onDeletar={handleDelete}
      />

      <EstoqueFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEquipamentoEditando(null); // Clear form on close
        }}
        onSalvar={handleSalvarEquipamento}
        equipamentoEditando={equipamentoEditando}
        theme={theme}
        carregando={carregando}
        onAbreGerenciarTipos={() => setIsTiposModalOpen(true)}
        onAbreGerenciarMarcas={() => setIsMarcasModalOpen(true)}
        onAbreGerenciarModelos={() => setIsModelosModalOpen(true)}
        onAbreGerenciarAgencias={() => setIsAgenciasModalOpen(true)}
        onAbreGerenciarVinculos={() => setIsVinculosModalOpen(true)}
        onAbreGerenciarOrigens={() => setIsOrigensModalOpen(true)}
        onAbreGerenciarLocais={() => setIsLocaisModalOpen(true)}
      />

      <GerenciarLocaisModal 
        isOpen={isLocaisModalOpen}
        onClose={() => setIsLocaisModalOpen(false)}
        theme={theme}
      />

      <GerenciarTiposModal
        isOpen={isTiposModalOpen}
        onClose={() => setIsTiposModalOpen(false)}
        theme={theme}
      />
      
      <GerenciarMarcasModal
        isOpen={isMarcasModalOpen}
        onClose={() => setIsMarcasModalOpen(false)}
        theme={theme}
      />

      <GerenciarModelosModal
        isOpen={isModelosModalOpen}
        onClose={() => setIsModelosModalOpen(false)}
        theme={theme}
      />

      <GerenciarAgenciasModal
        isOpen={isAgenciasModalOpen}
        onClose={() => setIsAgenciasModalOpen(false)}
        theme={theme}
      />

      <GerenciarVinculosModal
        isOpen={isVinculosModalOpen}
        onClose={() => setIsVinculosModalOpen(false)}
        theme={theme}
      />

      <GerenciarOrigensModal
        isOpen={isOrigensModalOpen}
        onClose={() => setIsOrigensModalOpen(false)}
        theme={theme}
      />

      <EstoqueMovimentacaoModal 
        isOpen={isMovimentacaoModalOpen}
        onClose={() => { setIsMovimentacaoModalOpen(false); setMovimentacaoPreItem(null); }}
        estoqueAtivo={estoqueAtivo}
        theme={theme}
        onAbreGerenciarOrigens={() => setIsOrigensModalOpen(true)}
        onAbreGerenciarVinculos={() => setIsVinculosModalOpen(true)}
        preSelectedItem={movimentacaoPreItem}
      />

      <EstoqueFluxoModal 
        isOpen={fluxoConfig.isOpen}
        onClose={() => setFluxoConfig(prev => ({ ...prev, isOpen: false }))}
        item={fluxoConfig.item}
        modo={fluxoConfig.modo}
        onConfirmarDescarte={handleConfirmarDescarte}
        onConfirmarTransferencia={handleConfirmarTransferencia}
        theme={theme}
        carregando={carregando}
      />

      <EstoqueMovimentadosModal
        isOpen={isMovimentadosModalOpen}
        onClose={() => setIsMovimentadosModalOpen(false)}
        estoque={estoque}
        theme={theme}
      />
      {/* Global Barcode Scanner View Modal */}
      <EstoqueItemViewModal 
        isOpen={scannedItem !== null}
        onClose={() => setScannedItem(null)}
        item={scannedItem}
        theme={theme}
        onEditar={(item) => { handleOpenFormModal(item); setScannedItem(null); }}
        onMovimentar={(item) => { setMovimentacaoPreItem(item); setIsMovimentacaoModalOpen(true); setScannedItem(null); }}
        onDescartar={() => { alert('Funcionalidade de Descarte em desenvolvimento.'); }}
        onManutencao={() => { alert('Funcionalidade de Manutenção em desenvolvimento.'); }}
      />

      <EstoquePrintingModal
        isOpen={isPrintingModalOpen}
        onClose={() => setIsPrintingModalOpen(false)}
        estoque={estoqueAtivo}
        theme={theme}
      />
    </div>
  );
};

export default EstoquePage;
