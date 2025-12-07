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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { RegistroAtendimento } from '../types';

/**
 * Criar novo registro de atendimento
 */
export const criarRegistro = async (
  userId: string,
  dados: Omit<RegistroAtendimento, 'id' | 'criadoEm' | 'atualizadoEm' | 'numeroChamado'>
): Promise<string> => {
  try {
    // Gerar número de chamado aleatório de 5 dígitos (#10000 a #99999)
    const numeroChamado = Math.floor(10000 + Math.random() * 90000).toString();

    const docRef = await addDoc(collection(db, 'registros'), {
      ...dados,
      userId,
      numeroChamado,
      dataHora: dados.dataHora,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar registro:', error);
    throw new Error('Erro ao criar registro. Tente novamente.');
  }
};

/**
 * Atualizar registro existente
 */
export const atualizarRegistro = async (
  registroId: string,
  dados: Partial<RegistroAtendimento>
): Promise<void> => {
  try {
    const docRef = doc(db, 'registros', registroId);
    await updateDoc(docRef, {
      ...dados,
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    throw new Error('Erro ao atualizar registro. Tente novamente.');
  }
};

/**
 * Deletar registro
 */
export const deletarRegistro = async (registroId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'registros', registroId));
  } catch (error) {
    console.error('Erro ao deletar registro:', error);
    throw new Error('Erro ao deletar registro. Tente novamente.');
  }
};

/**
 * Buscar registro por ID
 */
export const buscarRegistroPorId = async (
  registroId: string
): Promise<RegistroAtendimento | null> => {
  try {
    const docRef = doc(db, 'registros', registroId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as RegistroAtendimento;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar registro:', error);
    return null;
  }
};

/**
 * Listar todos os registros do usuário
 */
export const listarRegistros = async (userId: string): Promise<RegistroAtendimento[]> => {
  try {
    const q = query(
      collection(db, 'registros'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const registros: RegistroAtendimento[] = [];

    querySnapshot.forEach((doc) => {
      registros.push({
        id: doc.id,
        ...doc.data()
      } as RegistroAtendimento);
    });

    // Ordenação no cliente (mais recente primeiro)
    return registros.sort((a, b) =>
      new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );
  } catch (error) {
    console.error('Erro ao listar registros:', error);
    throw new Error('Erro ao carregar registros. Tente novamente.');
  }
};

/**
 * Filtrar registros por status
 */
export const filtrarPorStatus = async (
  userId: string,
  status: 'Pendente' | 'Atendido'
): Promise<RegistroAtendimento[]> => {
  try {
    const q = query(
      collection(db, 'registros'),
      where('userId', '==', userId),
      where('status', '==', status)
    );

    const querySnapshot = await getDocs(q);
    const registros: RegistroAtendimento[] = [];

    querySnapshot.forEach((doc) => {
      registros.push({
        id: doc.id,
        ...doc.data()
      } as RegistroAtendimento);
    });

    // Ordenação no cliente
    return registros.sort((a, b) =>
      new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );
  } catch (error) {
    console.error('Erro ao filtrar registros:', error);
    throw new Error('Erro ao filtrar registros. Tente novamente.');
  }
};

/**
 * Filtrar registros por período
 */
export const filtrarPorPeriodo = async (
  userId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<RegistroAtendimento[]> => {
  try {
    const q = query(
      collection(db, 'registros'),
      where('userId', '==', userId),
      where('dataHora', '>=', dataInicio.toISOString()),
      where('dataHora', '<=', dataFim.toISOString())
    );

    const querySnapshot = await getDocs(q);
    const registros: RegistroAtendimento[] = [];

    querySnapshot.forEach((doc) => {
      registros.push({
        id: doc.id,
        ...doc.data()
      } as RegistroAtendimento);
    });

    // Ordenação no cliente
    return registros.sort((a, b) =>
      new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );
  } catch (error) {
    console.error('Erro ao filtrar por período:', error);
    throw new Error('Erro ao filtrar por período. Tente novamente.');
  }
};
