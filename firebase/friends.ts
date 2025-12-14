import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';
import { FriendRequest, Usuario, Friend } from '../types';
import { notificarSolicitacaoAmizade, limparNotificacaoSolicitacao } from './notificacoes';

/**
 * Buscar usuário por email
 */
export const buscarUsuarioPorEmail = async (email: string): Promise<Usuario | null> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email.toLowerCase().trim())
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { uid: doc.id, ...doc.data() } as Usuario;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
};

/**
 * Enviar solicitação de amizade
 */
export const enviarSolicitacaoAmizade = async (fromUser: Usuario, toUser: Usuario): Promise<void> => {
  try {
    // 1. Criar o documento da solicitação
    const requestRef = await addDoc(collection(db, 'friend_requests'), {
      fromId: fromUser.uid,
      fromName: fromUser.nomeCompleto,
      fromEmail: fromUser.email,
      toId: toUser.uid,
      toEmail: toUser.email,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    // 2. Atualizar arrays nos usuários
    await updateDoc(doc(db, 'users', fromUser.uid), {
      friendRequestsSent: arrayUnion(toUser.uid)
    });

    await updateDoc(doc(db, 'users', toUser.uid), {
      friendRequestsReceived: arrayUnion(fromUser.uid)
    });

    // 3. Notificar o usuário
    await notificarSolicitacaoAmizade(toUser.uid, fromUser.uid, fromUser.nomeCompleto);

  } catch (error) {
    console.error("Erro ao enviar solicitação:", error);
    throw error;
  }
};

/**
 * Listar solicitações pendentes (recebidas)
 */
export const listarSolicitacoesRecebidas = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const q = query(
      collection(db, 'friend_requests'),
      where('toId', '==', userId),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
  } catch (error) {
    console.error("Erro ao listar solicitações:", error);
    return [];
  }
};

/**
 * Escutar solicitações pendentes (recebidas) em tempo real
 */
export const escutarSolicitacoesPendentes = (
  userId: string,
  callback: (requests: FriendRequest[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'friend_requests'),
    where('toId', '==', userId),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
    callback(requests);
  }, (error) => {
    console.error("Erro ao escutar solicitações:", error);
    callback([]);
  });
};

/**
 * Aceitar solicitação
 */
export const aceitarSolicitacao = async (requestId: string, fromId: string, toId: string): Promise<void> => {
  try {
    // 1. Marcar request como accepted
    await updateDoc(doc(db, 'friend_requests', requestId), {
      status: 'accepted'
    });

    // 2. Adicionar aos amigos de ambos
    await updateDoc(doc(db, 'users', fromId), {
      friends: arrayUnion(toId),
      friendRequestsSent: arrayRemove(toId)
    });

    await updateDoc(doc(db, 'users', toId), {
      friends: arrayUnion(fromId),
      friendRequestsReceived: arrayRemove(fromId)
    });

    // 3. Limpar notificação
    await limparNotificacaoSolicitacao(toId, fromId);

  } catch (error) {
    console.error("Erro ao aceitar solicitação:", error);
    throw error;
  }
};

/**
 * Recusar solicitação
 */
export const recusarSolicitacao = async (requestId: string, fromId: string, toId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'friend_requests', requestId), {
      status: 'rejected'
    });

    await updateDoc(doc(db, 'users', fromId), {
      friendRequestsSent: arrayRemove(toId)
    });

    await updateDoc(doc(db, 'users', toId), {
      friendRequestsReceived: arrayRemove(fromId)
    });

    // 3. Limpar notificação
    await limparNotificacaoSolicitacao(toId, fromId);

  } catch (error) {
    console.error("Erro ao recusar solicitação:", error);
    throw error;
  }
};

/**
 * Listar amigos
 */
export const listarAmigos = async (userId: string): Promise<Friend[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];

    const userData = userDoc.data() as Usuario;
    const friendIds = userData.friends || [];

    if (friendIds.length === 0) return [];

    // Buscar detalhes de cada amigo
    // Nota: 'in' query suporta max 10, então idealmente faríamos batches ou buscar um por um
    // Para simplificar MVP, vamos buscar um por um
    const friends: Friend[] = [];

    for (const fid of friendIds) {
      const fDoc = await getDoc(doc(db, 'users', fid));
      if (fDoc.exists()) {
        const fData = fDoc.data();
        friends.push({
          id: fDoc.id,
          name: fData.nomeCompleto,
          email: fData.email,
          photoURL: fData.photoURL,
          addedAt: new Date().toISOString() // Placeholder, real date would require improved schema
        });
      }
    }

    return friends;
  } catch (error) {
    console.error("Erro ao listar amigos:", error);
    return [];
  }
};
