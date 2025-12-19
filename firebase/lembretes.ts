import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  or
} from 'firebase/firestore';
import { db } from './config';
import { Lembrete, StatusLembrete } from '../types';

const COLLECTION_NAME = 'lembretes';

/**
 * Criar novo lembrete
 */
export const criarLembrete = async (
  userId: string,
  userNome: string,
  dados: Omit<Lembrete, 'id' | 'criadoEm' | 'atualizadoEm' | 'criadoPor' | 'criadoPorNome' | 'status'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...dados,
      criadoPor: userId,
      criadoPorNome: userNome,
      status: 'pendente' as StatusLembrete,
      enviado: false, // Necessário para o Worker encontrar
      dataHoraEnvio: new Date(dados.dataHora), // Para o Worker
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar lembrete:', error);
    throw error;
  }
};

/**
 * Atualizar lembrete existente
 */
export const atualizarLembrete = async (
  lembreteId: string,
  dados: Partial<Lembrete>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, lembreteId);

    // Se atualizou a dataHora, atualizar também o dataHoraEnvio
    const updateData: any = {
      ...dados,
      atualizadoEm: serverTimestamp()
    };

    if (dados.dataHora) {
      updateData.dataHoraEnvio = new Date(dados.dataHora);
      // Se atualizar data futura, resetar status se estava disparado/erro? 
      // O usuário pode querer resetar. Por padrão, vamos garantir que o worker pegue.
      if (!dados.status) {
        updateData.status = 'pendente';
      }
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Erro ao atualizar lembrete:', error);
    throw error;
  }
};

/**
 * Deletar lembrete
 */
export const deletarLembrete = async (lembreteId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, lembreteId));
  } catch (error) {
    console.error('Erro ao deletar lembrete:', error);
    throw error;
  }
};

/**
 * Buscar lembrete por ID
 */
export const buscarLembretePorId = async (
  lembreteId: string
): Promise<Lembrete | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, lembreteId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : data.criadoEm,
        atualizadoEm: data.atualizadoEm?.toDate ? data.atualizadoEm.toDate().toISOString() : data.atualizadoEm,
      } as Lembrete;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar lembrete:', error);
    return null;
  }
};

/**
 * Listar todos os lembretes do usuário (criados por ele)
 */
export const listarLembretes = async (userId: string): Promise<Lembrete[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('criadoPor', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const lembretes: Lembrete[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      lembretes.push({
        id: docSnap.id,
        ...data,
        criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : data.criadoEm,
        atualizadoEm: data.atualizadoEm?.toDate ? data.atualizadoEm.toDate().toISOString() : data.atualizadoEm,
      } as Lembrete);
    });

    // Ordenar por data/hora do lembrete (mais próximo primeiro)
    return lembretes.sort((a, b) => {
      return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
    });
  } catch (error) {
    console.error('Erro ao listar lembretes:', error);
    throw error;
  }
};

/**
 * Listar lembretes recebidos (compartilhados com o usuário)
 */
export const listarLembretesRecebidos = async (userId: string): Promise<Lembrete[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('compartilhadoCom', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const lembretes: Lembrete[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      lembretes.push({
        id: docSnap.id,
        ...data,
        criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : data.criadoEm,
        atualizadoEm: data.atualizadoEm?.toDate ? data.atualizadoEm.toDate().toISOString() : data.atualizadoEm,
      } as Lembrete);
    });

    return lembretes.sort((a, b) => {
      return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
    });
  } catch (error) {
    console.error('Erro ao listar lembretes recebidos:', error);
    throw error;
  }
};

/**
 * Escutar lembretes em tempo real (para detectar alarmes)
 * Unifica lembretes criados pelo usuário E recebidos usando query OR (requer Firestore SDK moderno)
 */
export const escutarLembretes = (
  userId: string,
  callback: (lembretes: Lembrete[]) => void
): Unsubscribe => {
  // Query unificada com OR para evitar múltiplos listeners
  const q = query(
    collection(db, COLLECTION_NAME),
    or(
      where('criadoPor', '==', userId),
      where('compartilhadoCom', '==', userId)
    )
  );

  return onSnapshot(q, (snapshot) => {
    const lembretes: Lembrete[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const lembrete = {
        id: docSnap.id,
        ...data,
        criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : data.criadoEm,
        atualizadoEm: data.atualizadoEm?.toDate ? data.atualizadoEm.toDate().toISOString() : data.atualizadoEm,
      } as Lembrete;

      // Filtragem de segurança e lógica de aceitação
      // Meus lembretes entram APENAS se não foram enviados para outra pessoa
      if (lembrete.criadoPor === userId && !lembrete.compartilhadoCom) {
        lembretes.push(lembrete);
      }
      // Lembretes recebidos entram APENAS se foram aceitos
      else if (lembrete.compartilhadoCom === userId) {
        if (lembrete.aceito === true) {
          lembretes.push(lembrete);
        }
      }
    });

    // Ordenar por data/hora
    const ordenados = lembretes.sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
    );


    callback(ordenados);
  }, (error) => {
    console.error("Erro no listener de lembretes:", error);
  });
};

/**
 * Escutar apenas convites de lembretes (pendentes)
 */
export const escutarLembretesPendentes = (
  userId: string,
  callback: (lembretes: Lembrete[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('compartilhadoCom', '==', userId),
    where('aceito', '==', null)
  );

  return onSnapshot(q, (snapshot) => {
    const lembretes: Lembrete[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      lembretes.push({
        id: docSnap.id,
        ...data,
      } as Lembrete);
    });

    // Mais recentes primeiro
    callback(lembretes.sort((a, b) => new Date(b.criadoEm || 0).getTime() - new Date(a.criadoEm || 0).getTime()));
  });
};

/**
 * Enviar lembrete para outro usuário
 */
export const enviarLembrete = async (
  lembreteId: string,
  destinatarioId: string,
  destinatarioNome: string,
  remetenteId: string,
  remetenteNome: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, lembreteId);
    await updateDoc(docRef, {
      compartilhadoCom: destinatarioId,
      compartilhadoComNome: destinatarioNome,
      remetenteId: remetenteId,
      remetenteNome: remetenteNome,
      aceito: null, // Pendente de aceitação
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao enviar lembrete:', error);
    throw error;
  }
};

/**
 * Aceitar lembrete recebido
 */
export const aceitarLembrete = async (lembreteId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, lembreteId);
    await updateDoc(docRef, {
      aceito: true,
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao aceitar lembrete:', error);
    throw error;
  }
};

/**
 * Recusar lembrete recebido
 */
export const recusarLembrete = async (lembreteId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, lembreteId);
    await updateDoc(docRef, {
      aceito: false,
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao recusar lembrete:', error);
    throw error;
  }
};

/**
 * Marcar lembrete como disparado
 */
export const marcarComoDisparado = async (lembreteId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, lembreteId);
    await updateDoc(docRef, {
      status: 'disparado' as StatusLembrete,
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao marcar lembrete como disparado:', error);
  }
};

/**
 * Marcar lembrete como finalizado
 */
export const marcarComoFinalizado = async (lembreteId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, lembreteId);
    await updateDoc(docRef, {
      status: 'finalizado' as StatusLembrete,
      finalizadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao marcar lembrete como finalizado:', error);
  }
};

/**
 * Buscar usuários para compartilhar lembrete
 */
export const buscarUsuarios = async (termoBusca: string): Promise<Array<{ uid: string; email: string; nomeCompleto: string }>> => {
  try {
    // Buscar na coleção de usuários
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);

    const usuarios: Array<{ uid: string; email: string; nomeCompleto: string }> = [];
    const termoLower = termoBusca.toLowerCase();

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const nome = (data.nomeCompleto || '').toLowerCase();
      const email = (data.email || '').toLowerCase();

      if (nome.includes(termoLower) || email.includes(termoLower)) {
        usuarios.push({
          uid: data.uid || docSnap.id,
          email: data.email || '',
          nomeCompleto: data.nomeCompleto || ''
        });
      }
    });

    return usuarios;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

/**
 * Limpar lembretes finalizados há mais de 5 dias
 */
export const limparLembretesAntigos = async (userId: string): Promise<void> => {
  try {
    const cincoDiasAtras = new Date();
    cincoDiasAtras.setDate(cincoDiasAtras.getDate() - 5);

    // Buscar lembretes finalizados deste usuário
    const q = query(
      collection(db, COLLECTION_NAME),
      where('criadoPor', '==', userId),
      where('status', '==', 'finalizado')
    );

    const querySnapshot = await getDocs(q);
    const batch = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Determinar data de finalização
      let dataFinalizacao: Date | null = null;

      if (data.finalizadoEm instanceof Object && 'toDate' in data.finalizadoEm) {
        dataFinalizacao = data.finalizadoEm.toDate();
      } else if (typeof data.finalizadoEm === 'string') {
        dataFinalizacao = new Date(data.finalizadoEm);
      } else if (data.atualizadoEm instanceof Object && 'toDate' in data.atualizadoEm) {
        // Fallback para atualizadoEm se não tiver finalizadoEm
        dataFinalizacao = data.atualizadoEm.toDate();
      } else if (data.dataHora) {
        // Fallback final: data do lembrete
        dataFinalizacao = new Date(data.dataHora);
      }

      if (dataFinalizacao && dataFinalizacao < cincoDiasAtras) {
        deleteDoc(docSnap.ref); // Deletar individualmente ou batch se muitos
        // Para simplificar aqui, vou deletar direto.
        // Se fossem muitos, batch seria ideal.
      }
    });

  } catch (error) {
    console.error('Erro ao limpar lembretes antigos:', error);
  }
};
