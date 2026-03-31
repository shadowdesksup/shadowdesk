import { db } from './config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { LocalTransferencia } from '../types';

const COLLECTION_LOCAIS_TRANSF = 'locaisTransferencia';

export const listarLocaisTransferencia = async (): Promise<LocalTransferencia[]> => {
  try {
    const q = query(collection(db, COLLECTION_LOCAIS_TRANSF), orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LocalTransferencia));
  } catch (error) {
    console.error('Erro ao listar locais de transferência:', error);
    throw new Error('Não foi possível carregar os locais de transferência');
  }
};

export const criarLocalTransferencia = async (nome: string, criadoPor: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_LOCAIS_TRANSF), {
      nome: nome.trim(),
      criadoPor,
      criadoEm: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar local de transferência:', error);
    throw new Error('Não foi possível adicionar o local de transferência');
  }
};

export const atualizarLocalTransferencia = async (id: string, nome: string): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_LOCAIS_TRANSF, id);
    await updateDoc(ref, { nome: nome.trim() });
  } catch (error) {
    console.error('Erro ao atualizar local de transferência:', error);
    throw new Error('Não foi possível atualizar o local de transferência');
  }
};

export const deletarLocalTransferencia = async (id: string): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_LOCAIS_TRANSF, id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Erro ao deletar local de transferência:', error);
    throw new Error('Não foi possível deletar o local de transferência');
  }
};
