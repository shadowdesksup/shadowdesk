import { useState, useEffect, useCallback } from 'react';
import { Lembrete, CorLembrete, SomNotificacao } from '../types';
import {
  criarLembrete,
  atualizarLembrete,
  deletarLembrete,
  escutarLembretes,
  escutarLembretesPendentes,
  listarLembretesRecebidos,
  enviarLembrete,
  aceitarLembrete as aceitarLembreteService,
  recusarLembrete as recusarLembreteService,
  marcarComoFinalizado,
  limparLembretesAntigos,
  buscarUsuarios
} from '../firebase/lembretes';
import {
  notificarLembreteRecebido,
  notificarLembreteAceito,
  notificarLembreteRecusado
} from '../firebase/notificacoes';

export interface UseRemindersReturn {
  lembretes: Lembrete[];
  lembretesRecebidos: Lembrete[];
  loading: boolean;
  error: string | null;

  // CRUD
  criar: (dados: {
    titulo: string;
    descricao: string;
    dataHora: string;
    cor: CorLembrete;
    somNotificacao: SomNotificacao;
    telefone?: string;
  }) => Promise<{ id: string } | null>;
  atualizar: (id: string, dados: Partial<Lembrete>) => Promise<void>;
  deletar: (id: string) => Promise<void>;
  finalizar: (id: string) => Promise<void>;

  // Compartilhamento
  enviar: (lembreteId: string, destinatarioId: string, destinatarioNome: string, titulo?: string) => Promise<void>;
  aceitar: (lembrete: Lembrete) => Promise<void>;
  recusar: (lembrete: Lembrete) => Promise<void>;

  // Busca de usuários
  buscarUsuariosParaCompartilhar: (termo: string) => Promise<Array<{ uid: string; email: string; nomeCompleto: string }>>;

  // Filtros úteis
  pendentes: Lembrete[];
  expirados: Lembrete[];
  finalizados: Lembrete[];
  hoje: Lembrete[];
  proximoLembrete: Lembrete | null;


}

export const useReminders = (userId: string, userNome: string): UseRemindersReturn => {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [lembretesRecebidos, setLembretesRecebidos] = useState<Lembrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escutar lembretes em tempo real
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const unsubscribeLembretes = escutarLembretes(userId, (novosLembretes) => {
      setLembretes(novosLembretes);
      setLoading(false);
    });

    // Escutar convites pendentes
    const unsubscribePendentes = escutarLembretesPendentes(userId, (novosPendentes) => {
      setLembretesRecebidos(novosPendentes);
    });

    // Limpar lembretes antigos ao iniciar
    limparLembretesAntigos(userId);

    return () => {
      unsubscribeLembretes();
      unsubscribePendentes();
    };
  }, [userId]);

  // Criar lembrete
  const criar = useCallback(async (dados: {
    titulo: string;
    descricao: string;
    dataHora: string;
    cor: CorLembrete;
    somNotificacao: SomNotificacao;
    telefone?: string;
  }) => {
    try {
      const id = await criarLembrete(userId, userNome, dados);
      return { id };
    } catch (err: any) {
      console.error("Erro detalhado ao criar lembrete:", err);
      if (err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions')) {
        setError('Erro de Permissão: Regras do Firestore não permitem criar lembretes. Atualize o firestore.rules no console.');
      } else {
        setError(err.message);
      }
      throw err;
    }
  }, [userId, userNome]);

  // Atualizar lembrete
  const atualizar = useCallback(async (id: string, dados: Partial<Lembrete>) => {
    try {
      await atualizarLembrete(id, dados);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Deletar lembrete
  const deletar = useCallback(async (id: string) => {
    try {
      await deletarLembrete(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Finalizar lembrete
  const finalizar = useCallback(async (id: string) => {
    try {
      await marcarComoFinalizado(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Enviar lembrete para outro usuário
  const enviar = useCallback(async (lembreteId: string, destinatarioId: string, destinatarioNome: string, titulo?: string) => {
    try {
      // Se não passou título, tenta achar na lista (backward compatibility) ou busca no banco
      let reminderTitle = titulo;
      if (!reminderTitle) {
        const lembrete = lembretes.find(l => l.id === lembreteId);
        reminderTitle = lembrete?.titulo || 'Lembrete';
      }

      await enviarLembrete(lembreteId, destinatarioId, destinatarioNome, userId, userNome);

      // Notificar o destinatário
      await notificarLembreteRecebido(
        destinatarioId,
        lembreteId,
        reminderTitle,
        userId,
        userNome
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [lembretes, userId, userNome]);

  // Aceitar lembrete recebido
  const aceitar = useCallback(async (lembrete: Lembrete) => {
    try {
      await aceitarLembreteService(lembrete.id);

      // Notificar o remetente
      if (lembrete.remetenteId) {
        await notificarLembreteAceito(
          lembrete.remetenteId,
          lembrete.id,
          lembrete.titulo,
          userNome
        );
      }

      // Remover da lista de recebidos pendentes
      setLembretesRecebidos(prev => prev.filter(l => l.id !== lembrete.id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [userNome]);

  // Recusar lembrete recebido
  const recusar = useCallback(async (lembrete: Lembrete) => {
    try {
      await recusarLembreteService(lembrete.id);

      // Notificar o remetente
      if (lembrete.remetenteId) {
        await notificarLembreteRecusado(
          lembrete.remetenteId,
          lembrete.id,
          lembrete.titulo,
          userNome
        );
      }

      // Remover da lista de recebidos pendentes
      setLembretesRecebidos(prev => prev.filter(l => l.id !== lembrete.id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [userNome]);

  // Buscar usuários para compartilhar
  const buscarUsuariosParaCompartilhar = useCallback(async (termo: string) => {
    const usuarios = await buscarUsuarios(termo);
    // Excluir o próprio usuário da lista
    return usuarios.filter(u => u.uid !== userId);
  }, [userId]);



  // Filtros computados
  const agora = new Date();
  const hojeStart = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const hojeEnd = new Date(hojeStart.getTime() + 24 * 60 * 60 * 1000);

  const pendentes = lembretes.filter(l => l.status === 'pendente');

  const expirados = lembretes.filter(l => {
    const dataLembrete = new Date(l.dataHora);
    return l.status === 'pendente' && dataLembrete < agora;
  });

  const hoje = lembretes.filter(l => {
    const dataLembrete = new Date(l.dataHora);
    return dataLembrete >= hojeStart && dataLembrete < hojeEnd;
  });

  const finalizados = lembretes.filter(l => l.status === 'finalizado');

  // Próximo lembrete (pendente e futuro) - Filtro especial para Encerramento
  const proximoLembrete = pendentes
    .filter(l => {
      const dataLembrete = new Date(l.dataHora);
      if (dataLembrete <= agora) return false;

      // Filtro especial: Encerramento só aparece se <= 7 dias
      if (l.titulo === 'Encerramento de Chamados') {
        const diffMs = dataLembrete.getTime() - agora.getTime();
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDias <= 7;
      }

      return true;
    })
    .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())[0] || null;

  return {
    lembretes,
    lembretesRecebidos,
    loading,
    error,
    criar,
    atualizar,
    deletar,
    finalizar,
    enviar,
    aceitar,
    recusar,
    buscarUsuariosParaCompartilhar,
    pendentes,
    expirados,
    finalizados,
    hoje,
    proximoLembrete,

  };
};
