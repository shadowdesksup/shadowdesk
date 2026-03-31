import { useState, useEffect, useCallback } from 'react';
import { EquipamentoEstoque, EstoqueHistorico } from '../types';
import {
  listarEstoque,
  criarEquipamento as apiCriarEquipamento,
  atualizarEquipamento as apiAtualizarEquipamento,
  adicionarHistoricoEstoque,
  deletarEquipamento as apiDeletarEquipamento
} from '../firebase/estoque';

export const useEstoque = () => {
  const [estoque, setEstoque] = useState<EquipamentoEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarEstoque = useCallback(async () => {
    try {
      setCarregando(true);
      const dados = await listarEstoque();
      setEstoque(dados);
      setErro(null);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Erro ao carregar estoque');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarEstoque();
  }, [carregarEstoque]);

  const criarEquipamento = async (dados: Omit<EquipamentoEstoque, 'id'>) => {
    try {
      setCarregando(true);
      const novoId = await apiCriarEquipamento(dados);
      await carregarEstoque(); // Atualiza a lista após criar
      return novoId;
    } catch (err: any) {
      setErro(err.message);
      throw err;
    } finally {
      setCarregando(false);
    }
  };

  const atualizarEquipamento = async (id: string, dados: Partial<EquipamentoEstoque>) => {
    try {
      setCarregando(true);
      await apiAtualizarEquipamento(id, dados);
      await carregarEstoque(); // Re-fetch para refletir atualização na fila local
    } catch (err: any) {
      setErro(err.message);
      throw err;
    } finally {
      setCarregando(false);
    }
  };

  const deletarEquipamento = async (id: string) => {
    try {
      setCarregando(true);
      await apiDeletarEquipamento(id);
      await carregarEstoque();
    } catch (err: any) {
      setErro(err.message);
      throw err;
    } finally {
      setCarregando(false);
    }
  };

  const registrarHistorico = async (id: string, historico: EstoqueHistorico) => {
    try {
      await adicionarHistoricoEstoque(id, historico);
      // Optional: await carregarEstoque() if we want history updates to reflect immediately in the UI array
    } catch (err: any) {
      console.error("Failed to add history:", err);
    }
  };

  return {
    estoque,
    carregando,
    erro,
    recarregar: carregarEstoque,
    criarEquipamento,
    atualizarEquipamento,
    deletarEquipamento,
    registrarHistorico
  };
};
