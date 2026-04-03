import { useState, useEffect, useCallback } from 'react';
import { EquipamentoEstoque, EstoqueHistorico } from '../types';
import {
  escutarEstoque,
  criarEquipamento as apiCriarEquipamento,
  atualizarEquipamento as apiAtualizarEquipamento,
  adicionarHistoricoEstoque,
  deletarEquipamento as apiDeletarEquipamento
} from '../firebase/estoque';

export const useEstoque = () => {
  const [estoque, setEstoque] = useState<EquipamentoEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setCarregando(true);
    const unsubscribe = escutarEstoque((dados) => {
      setEstoque(dados);
      setCarregando(false);
      setErro(null);
    }, (err) => {
      console.error(err);
      setErro(err.message || 'Erro ao escutar estoque da Firebase');
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  const criarEquipamento = async (dados: Omit<EquipamentoEstoque, 'id'>) => {
    try {
      setCarregando(true);
      const novoId = await apiCriarEquipamento(dados);
      // Removed carregarEstoque() because onSnapshot does it automatically
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
    recarregar: () => {}, // mock para compatibilidade com botões que ainda chamam
    criarEquipamento,
    atualizarEquipamento,
    deletarEquipamento,
    registrarHistorico
  };
};
