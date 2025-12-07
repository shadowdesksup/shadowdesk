import { useState, useEffect, useCallback } from 'react';
import { RegistroAtendimento, StatusAtendimento, Estatisticas } from '../types';
import {
  criarRegistro,
  atualizarRegistro,
  deletarRegistro,
  listarRegistros,
  filtrarPorStatus
} from '../firebase/firestore';
import { estaEntreDatas, eHoje, eDestaSemana, eDesteMes } from '../utils/helpers';

interface UseRegistrosReturn {
  registros: RegistroAtendimento[];
  carregando: boolean;
  erro: string | null;
  criar: (dados: Omit<RegistroAtendimento, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<void>;
  atualizar: (id: string, dados: Partial<RegistroAtendimento>) => Promise<void>;
  deletar: (id: string) => Promise<void>;
  buscarPorId: (id: string) => RegistroAtendimento | undefined;
  filtrar: (filtros: any) => RegistroAtendimento[];
  obterEstatisticas: () => Estatisticas;
  recarregar: () => Promise<void>;
}

export const useRegistros = (userId?: string): UseRegistrosReturn => {
  const [registros, setRegistros] = useState<RegistroAtendimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar registros do Firestore
  const carregarRegistros = useCallback(async () => {
    if (!userId) {
      setRegistros([]);
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      const dados = await listarRegistros(userId);
      setRegistros(dados);
    } catch (error: any) {
      console.error('Erro ao carregar registros:', error);
      setErro(error.message || 'Erro ao carregar registros');
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    carregarRegistros();
  }, [carregarRegistros]);

  const criar = async (dados: Omit<RegistroAtendimento, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<void> => {
    if (!userId) throw new Error('Usuário não autenticado');

    try {
      await criarRegistro(userId, dados);
      await carregarRegistros();
    } catch (error: any) {
      throw error;
    }
  };

  const atualizar = async (id: string, dados: Partial<RegistroAtendimento>): Promise<void> => {
    try {
      await atualizarRegistro(id, dados);
      await carregarRegistros();
    } catch (error: any) {
      throw error;
    }
  };

  const deletar = async (id: string): Promise<void> => {
    try {
      await deletarRegistro(id);
      await carregarRegistros();
    } catch (error: any) {
      throw error;
    }
  };

  const buscarPorId = (id: string): RegistroAtendimento | undefined => {
    return registros.find(r => r.id === id);
  };

  const filtrar = (filtros: any): RegistroAtendimento[] => {
    let resultado = [...registros];

    if (filtros.status) {
      resultado = resultado.filter(r => r.status === filtros.status);
    }

    if (filtros.tipoSolicitante) {
      resultado = resultado.filter(r => r.tipoSolicitante === filtros.tipoSolicitante);
    }

    if (filtros.dataInicio && filtros.dataFim) {
      resultado = resultado.filter(r =>
        estaEntreDatas(r.dataHora, filtros.dataInicio, filtros.dataFim)
      );
    }

    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(r =>
        r.nomeSolicitante.toLowerCase().includes(termo) ||
        r.descricaoRequisicao.toLowerCase().includes(termo) ||
        r.local.toLowerCase().includes(termo) ||
        r.numeroChamado?.toString().includes(termo)
      );
    }

    return resultado;
  };

  const obterEstatisticas = (): Estatisticas => {
    const total = registros.length;
    const pendentes = registros.filter(r => r.status === 'Pendente').length;
    const atendidos = registros.filter(r => r.status === 'Atendido').length;

    const hoje = registros.filter(r => eHoje(r.dataHora));
    const semana = registros.filter(r => eDestaSemana(r.dataHora));
    const mes = registros.filter(r => eDesteMes(r.dataHora));

    return {
      total,
      pendentes,
      atendidos,
      hoje: {
        total: hoje.length,
        pendentes: hoje.filter(r => r.status === 'Pendente').length,
        atendidos: hoje.filter(r => r.status === 'Atendido').length
      },
      semana: {
        total: semana.length,
        pendentes: semana.filter(r => r.status === 'Pendente').length,
        atendidos: semana.filter(r => r.status === 'Atendido').length
      },
      mes: {
        total: mes.length,
        pendentes: mes.filter(r => r.status === 'Pendente').length,
        atendidos: mes.filter(r => r.status === 'Atendido').length
      }
    };
  };

  const recarregar = async (): Promise<void> => {
    await carregarRegistros();
  };

  return {
    registros,
    carregando,
    erro,
    criar,
    atualizar,
    deletar,
    buscarPorId,
    filtrar,
    obterEstatisticas,
    recarregar
  };
};
