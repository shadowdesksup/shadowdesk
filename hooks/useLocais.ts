import { useState, useEffect, useCallback } from 'react';
import { Local, listarLocais, criarLocal, atualizarLocal, deletarLocal, inicializarLocaisPadrao } from '../firebase/locais';

interface UseLocaisReturn {
  locais: Local[];
  carregando: boolean;
  erro: string | null;
  criar: (nome: string, userId: string) => Promise<void>;
  atualizar: (id: string, nome: string) => Promise<void>;
  deletar: (id: string) => Promise<void>;
  recarregar: () => Promise<void>;
  inicializarPadrao: (userId: string) => Promise<void>;
}

export const useLocais = (userId?: string): UseLocaisReturn => {
  const [locais, setLocais] = useState<Local[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [jaInicializado, setJaInicializado] = useState(false);

  const carregarLocais = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      const dados = await listarLocais();
      setLocais(dados);

      // Auto-inicializar (verifica itens faltantes) se tivermos um userId
      // Executa apenas uma vez por sessão do hook para não ficar spamando
      if (!jaInicializado && userId) {
        setJaInicializado(true);
        try {
          // Inicializar sem bloquear a renderização inicial
          inicializarLocaisPadrao(userId).then(async () => {
            const novosDados = await listarLocais();
            setLocais(novosDados);
          });
        } catch (err) {
          console.error('Erro na auto-inicialização:', err);
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar locais:', error);
      setErro(error.message || 'Erro ao carregar locais');
    } finally {
      setCarregando(false);
    }
  }, [jaInicializado, userId]);

  useEffect(() => {
    carregarLocais();
  }, [carregarLocais]);

  const criar = async (nome: string, userId: string): Promise<void> => {
    try {
      await criarLocal(nome, userId);
      await carregarLocais();
    } catch (error: any) {
      throw error;
    }
  };

  const atualizar = async (id: string, nome: string): Promise<void> => {
    try {
      await atualizarLocal(id, nome);
      await carregarLocais();
    } catch (error: any) {
      throw error;
    }
  };

  const deletar = async (id: string): Promise<void> => {
    try {
      await deletarLocal(id);
      await carregarLocais();
    } catch (error: any) {
      throw error;
    }
  };

  const recarregar = async (): Promise<void> => {
    await carregarLocais();
  };

  const inicializarPadrao = async (userId: string): Promise<void> => {
    try {
      await inicializarLocaisPadrao(userId);
      await carregarLocais();
    } catch (error: any) {
      throw error;
    }
  };

  return {
    locais,
    carregando,
    erro,
    criar,
    atualizar,
    deletar,
    recarregar,
    inicializarPadrao
  };
};
