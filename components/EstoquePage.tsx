import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, MapPin, Search, Truck, Printer, ScanLine } from 'lucide-react';
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
import CameraBarcodeScannerModal from './CameraBarcodeScannerModal';
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

  // Filtros em Cascata
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroMarca, setFiltroMarca] = useState<string>('');
  const [filtroModelo, setFiltroModelo] = useState<string>('');

  const opcoesTipo = React.useMemo(() => {
    const counts = new Map<string, number>();
    estoqueAtivo.forEach(e => counts.set(e.tipo, (counts.get(e.tipo) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [estoqueAtivo]);

  const opcoesMarca = React.useMemo(() => {
    let base = estoqueAtivo;
    if (filtroTipo) base = base.filter(e => e.tipo === filtroTipo);
    const counts = new Map<string, number>();
    base.forEach(e => counts.set(e.marca, (counts.get(e.marca) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [estoqueAtivo, filtroTipo]);

  const opcoesModelo = React.useMemo(() => {
    let base = estoqueAtivo;
    if (filtroTipo) base = base.filter(e => e.tipo === filtroTipo);
    if (filtroMarca) base = base.filter(e => e.marca === filtroMarca);
    const counts = new Map<string, number>();
    base.forEach(e => counts.set(e.modelo, (counts.get(e.modelo) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [estoqueAtivo, filtroTipo, filtroMarca]);

  const estoqueFiltradoCascata = React.useMemo(() => {
    let result = estoqueAtivo;
    if (filtroTipo) result = result.filter(e => e.tipo === filtroTipo);
    if (filtroMarca) result = result.filter(e => e.marca === filtroMarca);
    if (filtroModelo) result = result.filter(e => e.modelo === filtroModelo);
    return result;
  }, [estoqueAtivo, filtroTipo, filtroMarca, filtroModelo]);

  // Gestão de Paineis
  const [grupoSelecionadoId, setGrupoSelecionadoId] = useState<string | null>(null);

  // Painel de Formulário
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [equipamentoEditando, setEquipamentoEditando] = useState<EquipamentoEstoque | null>(null);
  const realocandoItemRef = React.useRef<EquipamentoEstoque | null>(null);
  const [grupoPreenchido, setGrupoPreenchido] = useState<{ tipo: string; marca: string; modelo: string } | null>(null);

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
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Painel de Fluxos
  const [fluxoConfig, setFluxoConfig] = useState<{ isOpen: boolean, modo: ModoFluxo, item: EquipamentoEstoque | null }>({
    isOpen: false, modo: null, item: null
  });

  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);

  // Global Scanned Item Modal (Leitura por Pistola Bipe)
  const [scannedItem, setScannedItem] = useState<EquipamentoEstoque | null>(null);

  // Escutador Global do Barcode Scanner
  const handleScan = React.useCallback(async (codigo: string) => {
    // 1. Procurar no estoque inteiro (ativo, manutenção, transferido, etc)
    const match = estoque.find(
      (e) =>
        `SD-${e.id.substring(0, 8).toUpperCase()}` === codigo.toUpperCase() ||
        e.patrimonio?.toLowerCase() === codigo.toLowerCase() ||
        e.numeroSerie?.toLowerCase() === codigo.toLowerCase()
    );

    if (match) {
      // Registrar consulta no histórico (apenas via scanner/leitor)
      const nomeUser = dadosUsuario?.nomeCompleto || usuario?.email || 'Sistema';
      try {
        await atualizarEquipamento(match.id, {
          historico: [
            ...(match.historico || []),
            {
              acao: 'Consultado via Scanner / Leitor',
              data: new Date().toISOString(),
              usuarioId: usuario?.uid || '',
              usuarioNome: nomeUser
            }
          ]
        });
      } catch (err) {
        console.error("Erro ao registrar consulta no histórico:", err);
      }

      setScannedItem(match); // Abre a ficha do item na tela!
    } else {
      console.warn(`Código bípado ou escaneado [${codigo}] não encontrado no sistema.`);
    }
  }, [estoque, atualizarEquipamento, usuario, dadosUsuario]);

  useBarcodeScanner({ onScan: handleScan });

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
    if (!item) {
      realocandoItemRef.current = null;
    }
    setIsFormModalOpen(true);
  };

  const handleSalvarEquipamento = async (dados: Partial<EquipamentoEstoque>) => {
    const nomeUser = dadosUsuario?.nomeCompleto || usuario?.email || 'Sistema';

    if (equipamentoEditando && equipamentoEditando.id) {
      const isRealocando = realocandoItemRef.current?.id === equipamentoEditando.id;
      let acaoHistorico = 'Dados atualizados';
      
      if (isRealocando) {
        const vindoDe = realocandoItemRef.current?.detalhes?.localDestinoNome || 'Último destino';
        acaoHistorico = `Item realocado no estoque\n(Vindo de: ${vindoDe})`;
      }

      await atualizarEquipamento(equipamentoEditando.id, {
        ...dados,
        ...(isRealocando ? { detalhes: null } : {}),
        historico: [
          ...(equipamentoEditando.historico || []),
          {
            acao: acaoHistorico,
            data: new Date().toISOString(),
            usuarioId: usuario?.uid || '',
            usuarioNome: nomeUser
          }
        ]
      });
      if (isRealocando) {
        setIsMovimentadosModalOpen(false); // Fecha histórico de saídas
        setGrupoSelecionadoId(`${dados.tipo}|${dados.marca}|${dados.modelo}`); // Abre o item na lista de ativos
        setHighlightItemId(equipamentoEditando.id);
      }
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
      const novoId = await criarEquipamento(novoItem);
      if (novoId) {
        setHighlightItemId(novoId);
        setGrupoSelecionadoId(`${novoItem.tipo}|${novoItem.marca}|${novoItem.modelo}`);
      }
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
          acao: `Transferido para ${localNome} (Resp: ${recebedor})\nMotivo: Transferência de Fluxo`,
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
          acao: `Descartado.\nMotivo técnico (Laudo): ${motivo}`,
          data: new Date().toISOString(),
          usuarioId: usuario?.uid || '',
          usuarioNome: nomeUser
        }
      ]
    });
  };

  const handleRealocar = (item: EquipamentoEstoque) => {
    // Ao invés de atualizar no banco de imediato, passamos o item para o formulário
    realocandoItemRef.current = item;
    
    // Limpamos integralmente todos os resquícios da movimentação ou alocação anterior,
    // transformando-o num ativo novo e forçando o status para BENS_ATIVOS
    const itemPreRealocacao: EquipamentoEstoque = { 
       ...item,
       status: 'BENS_ATIVOS',
       bensAtivos: {
           dataEntradaItem: new Date().toISOString(),
           solicitante: '',
           origem: item.detalhes?.localDestinoNome || item.bensAtivos?.origem || '',
           alocadoEm: '',
           vinculo: '',
           condicao: 'Boa'
       },
       // Wipe qualquer rastro de transferência antiga
       detalhes: undefined
    };

    handleOpenFormModal(itemPreRealocacao);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente este equipamento? ISSO DELETA DO BANCO E NÃO GERA HISTÓRICO.')) {
      deletarEquipamento(id);
    }
  };

  return (
    <div className="h-full overflow-y-auto pr-0 md:pr-4 relative flex flex-col">
      {/* Smart Header Section */}
      <div className={`p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 rounded-3xl border backdrop-blur-md shadow-xl flex flex-col gap-4 sm:gap-6 bg-cover bg-center ${isDark ? 'bg-slate-900/80 border-cyan-500/20' : 'bg-white border-cyan-500/10'}`} style={{ backgroundImage: isDark ? 'linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80")' : 'linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8)), url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80")' }}>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
          <div>
            <h2 className={`text-2xl sm:text-4xl font-extrabold flex items-center gap-3 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-lg shadow-cyan-500/30">
                <Package className="text-white" size={24} />
              </div>
              Controle de Bens e Ativos
            </h2>
            <p className={`mt-1 sm:mt-2 text-base sm:text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Gerenciamento dinâmico avançado do ciclo de vida dos ativos.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-2 gap-y-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="sm:hidden order-3 sm:order-none group px-2 sm:px-5 py-3 sm:py-2.5 bg-slate-800 border border-slate-700 sm:hover:bg-slate-700 text-white flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-bold transition-all shadow-sm sm:hover:shadow-md sm:hover:-translate-y-0.5 active:scale-95"
              title="Escanear Código por Câmera"
            >
              <ScanLine className="w-4 h-4 sm:w-4 sm:h-4 sm:group-hover:text-cyan-400 transition-colors shrink-0" />
              <span className="tracking-wide text-[13px] sm:text-sm drop-shadow-sm truncate">Escanear</span>
            </button>
            <button
              onClick={() => setIsPrintingModalOpen(true)}
              className="order-4 sm:order-none group px-2 sm:px-5 py-3 sm:py-2.5 bg-slate-800 border border-slate-700 sm:hover:bg-slate-700 text-white flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-bold transition-all shadow-sm sm:hover:shadow-md sm:hover:-translate-y-0.5 active:scale-95"
              title="Gerar/Imprimir Etiquetas em Lote"
            >
              <Printer className="w-4 h-4 sm:w-4 sm:h-4 sm:group-hover:text-cyan-400 transition-colors shrink-0" />
              <span className="tracking-wide text-[13px] sm:text-sm drop-shadow-sm truncate">Etiquetas</span>
            </button>
            <button
              onClick={() => setIsMovimentacaoModalOpen(true)}
              className="order-1 sm:order-none group px-2 sm:px-5 py-3 sm:py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 sm:hover:from-purple-400 sm:hover:to-indigo-500 text-white flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-bold transition-all shadow-sm sm:hover:shadow-md sm:hover:-translate-y-0.5 active:scale-95"
            >
              <Truck className="w-4 h-4 sm:w-4 sm:h-4 drop-shadow-sm sm:group-hover:translate-x-0.5 sm:group-hover:-translate-y-0.5 transition-transform shrink-0" />
              <span className="tracking-wide text-[13px] sm:text-sm drop-shadow-sm truncate">Movimentação</span>
            </button>
            <button
              onClick={() => handleOpenFormModal()}
              className="order-2 sm:order-none group px-2 sm:px-5 py-3 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 sm:hover:from-cyan-400 sm:hover:to-blue-500 text-white flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-bold transition-all shadow-sm sm:hover:shadow-md sm:hover:-translate-y-0.5 active:scale-95"
            >
              <Package className="w-4 h-4 sm:w-4 sm:h-4 drop-shadow-sm sm:group-hover:rotate-12 transition-transform shrink-0" />
              <span className="tracking-wide text-[13px] sm:text-sm drop-shadow-sm truncate">Nova Entrada</span>
            </button>
          </div>
        </div>

        {/* Estatísticas High-End */}
        <div className="z-10 mt-2">
          <EstoqueStats estoque={estoque} theme={theme} onMovimentadosClick={() => setIsMovimentadosModalOpen(true)} />
        </div>

        {/* Global Search & Filters integrated in header */}
        <div className="z-10 w-full flex flex-col lg:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all h-[58px] ${isDark
              ? 'bg-slate-900/90 border-cyan-500/30 text-white focus-within:border-cyan-400 focus-within:shadow-cyan-500/20'
              : 'bg-white/90 border-slate-300 text-slate-800 focus-within:border-cyan-500 focus-within:shadow-cyan-500/10'
              }`}>
              <Search size={22} className={isDark ? 'text-cyan-400' : 'text-cyan-600'} />
              <input
                type="text"
                placeholder="Pesquisar no inventário..."
                value={buscaGeral}
                onChange={e => setBuscaGeral(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-lg placeholder-opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <AnimatePresence>
              <motion.select
                key="tipo"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                value={filtroTipo}
                onChange={e => { setFiltroTipo(e.target.value); setFiltroMarca(''); setFiltroModelo(''); }}
                className={`px-4 py-3.5 rounded-2xl border backdrop-blur-xl font-medium transition-all cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/50 h-[58px] ${isDark ? 'bg-slate-900/90 border-cyan-500/30 text-white hover:border-cyan-500/50' : 'bg-white/90 border-slate-300 text-slate-800 hover:border-cyan-500/50'}`}
              >
                <option value="">Todos os Tipos</option>
                {opcoesTipo.map(([t, qtd]) => <option key={t} value={t}>{t} ({qtd})</option>)}
              </motion.select>

              {filtroTipo && (
                <motion.select
                  key="marca"
                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -10 }}
                  value={filtroMarca}
                  onChange={e => { setFiltroMarca(e.target.value); setFiltroModelo(''); }}
                  className={`px-4 py-3.5 rounded-2xl border backdrop-blur-xl font-medium transition-all cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/50 h-[58px] ${isDark ? 'bg-slate-900/90 border-cyan-500/30 text-cyan-200 hover:border-cyan-500/50' : 'bg-cyan-50/90 border-cyan-300 text-cyan-800 hover:border-cyan-500/50'}`}
                >
                  <option value="">Todas as Marcas</option>
                  {opcoesMarca.map(([m, qtd]) => <option key={m} value={m}>{m} ({qtd})</option>)}
                </motion.select>
              )}

              {filtroMarca && (
                <motion.select
                  key="modelo"
                  initial={{ opacity: 0, scale: 0.95, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -10 }}
                  value={filtroModelo}
                  onChange={e => setFiltroModelo(e.target.value)}
                  className={`px-4 py-3.5 rounded-2xl border backdrop-blur-xl font-medium transition-all cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/50 h-[58px] ${isDark ? 'bg-slate-900/90 border-cyan-500/30 text-cyan-200 hover:border-cyan-500/50' : 'bg-cyan-50/90 border-cyan-300 text-cyan-800 hover:border-cyan-500/50'}`}
                >
                  <option value="">Todos os Modelos</option>
                  {opcoesModelo.map(([m, qtd]) => <option key={m} value={m}>{m} ({qtd})</option>)}
                </motion.select>
              )}
            </AnimatePresence>
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
            estoque={estoqueFiltradoCascata}
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
          setEquipamentoEditando(null);
          setGrupoPreenchido({ tipo: grupoSelecionado?.tipo || '', marca: grupoSelecionado?.marca || '', modelo: grupoSelecionado?.modelo || '' });
          setIsFormModalOpen(true);
        }}
        onEditar={handleOpenFormModal}
        onTransferir={(item) => { setMovimentacaoPreItem(item); setIsMovimentacaoModalOpen(true); }}
        onDescartar={(item) => openFluxo(item, 'DESCARTE')}
        onDeletar={handleDelete}
        highlightItemId={highlightItemId}
        onClearHighlight={() => setHighlightItemId(null)}
      />

      <EstoqueFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEquipamentoEditando(null);
          setGrupoPreenchido(null);
        }}
        onSalvar={handleSalvarEquipamento}
        equipamentoEditando={equipamentoEditando}
        grupoPreenchido={grupoPreenchido}
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
        onSuccess={(id) => { setHighlightItemId(id); setIsMovimentadosModalOpen(true); }}
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
        onRealocar={handleRealocar}
        highlightItemId={highlightItemId}
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
        onRealocar={handleRealocar}
      />

      <EstoqueFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEquipamentoEditando(null);
          setGrupoPreenchido(null);
        }}
        onSalvar={handleSalvarEquipamento}
        equipamentoEditando={equipamentoEditando}
        grupoPreenchido={grupoPreenchido}
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

      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleScan}
        theme={theme}
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
