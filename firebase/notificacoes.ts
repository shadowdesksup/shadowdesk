import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import { Notificacao, TipoNotificacao } from '../types';

const COLLECTION_NAME = 'notificacoes';

/**
 * Criar nova notificação
 */
export const criarNotificacao = async (
  dados: Omit<Notificacao, 'id' | 'criadoEm' | 'lida'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...dados,
      lida: false,
      criadoEm: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

/**
 * Listar notificações do usuário
 */
export const listarNotificacoes = async (userId: string): Promise<Notificacao[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const notificacoes: Notificacao[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notificacoes.push({
        id: docSnap.id,
        ...data,
        criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : data.criadoEm,
      } as Notificacao);
    });

    // Ordenar por data de criação (mais recente primeiro)
    return notificacoes.sort((a, b) => {
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    throw error;
  }
};

/**
 * Escutar notificações em tempo real
 */
export const escutarNotificacoes = (
  userId: string,
  callback: (notificacoes: Notificacao[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const notificacoes: Notificacao[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notificacoes.push({
        id: docSnap.id,
        ...data,
        criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : data.criadoEm,
      } as Notificacao);
    });

    // Ordenar por data de criação (mais recente primeiro)
    const sorted = notificacoes.sort((a, b) => {
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });

    callback(sorted);
  }, (error) => {
    console.error('Erro ao escutar notificações:', error);
    callback([]);
  });
};

/**
 * Marcar notificação como lida
 */
export const marcarComoLida = async (notificacaoId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, notificacaoId);
    await updateDoc(docRef, {
      lida: true
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
};

/**
 * Marcar todas as notificações como lidas
 */
export const marcarTodasComoLidas = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('lida', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { lida: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    throw error;
  }
};

/**
 * Criar notificação de lembrete disparado
 */
export const notificarLembreteDisparado = async (
  userId: string,
  lembreteId: string,
  tituloLembrete: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'lembrete_disparado',
    titulo: 'Lembrete',
    mensagem: tituloLembrete,
    lembreteId,
    userId
  });
};

/**
 * Criar notificação de lembrete recebido
 */
export const notificarLembreteRecebido = async (
  userId: string,
  lembreteId: string,
  tituloLembrete: string,
  remetenteId: string,
  remetenteNome: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'lembrete_recebido',
    titulo: 'Lembrete recebido',
    mensagem: `${remetenteNome} enviou um lembrete: "${tituloLembrete}"`,
    lembreteId,
    remetenteId,
    remetenteNome,
    userId
  });
};

/**
 * Criar notificação de lembrete aceito
 */
export const notificarLembreteAceito = async (
  userId: string,
  lembreteId: string,
  tituloLembrete: string,
  aceitoPorNome: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'lembrete_aceito',
    titulo: 'Lembrete aceito',
    mensagem: `${aceitoPorNome} aceitou o lembrete: "${tituloLembrete}"`,
    lembreteId,
    userId
  });
};

/**
 * Criar notificação de lembrete recusado
 */
export const notificarLembreteRecusado = async (
  userId: string,
  lembreteId: string,
  tituloLembrete: string,
  recusadoPorNome: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'lembrete_recusado',
    titulo: 'Lembrete recusado',
    mensagem: `${recusadoPorNome} recusou o lembrete: "${tituloLembrete}"`,
    lembreteId,
    userId
  });
};

/**
 * Criar notificação de solicitação de amizade
 */
export const notificarSolicitacaoAmizade = async (
  userId: string,
  remetenteId: string,
  remetenteNome: string
): Promise<void> => {
  await criarNotificacao({
    tipo: 'solicitacao_amizade',
    titulo: 'Solicitação de Amizade',
    mensagem: `${remetenteNome} enviou uma solicitação de amizade`,
    remetenteId,
    remetenteNome,
    userId
  });
};

/**
 * Remover notificação de solicitação de amizade (usado quando aceita/recusa)
 */
export const limparNotificacaoSolicitacao = async (
  userId: string,
  remetenteId: string
): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('remetenteId', '==', remetenteId),
      where('tipo', '==', 'solicitacao_amizade')
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Erro ao limpar notificação de solicitação:', error);
  }
};

/**
 * Excluir uma notificação específica
 */
export const excluirNotificacao = async (notificacaoId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, notificacaoId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    throw error;
  }
};

/**
 * Excluir todas as notificações de um usuário
 */
export const excluirTodasNotificacoes = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Erro ao excluir todas as notificações:', error);
    throw error;
  }
};
