import { db } from './config';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  arrayUnion,
  where,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { EquipamentoEstoque, EstoqueHistorico } from '../types';

const COLLECTION_ESTOQUE = 'estoque';

export const listarEstoque = async (): Promise<EquipamentoEstoque[]> => {
  try {
    const q = query(collection(db, COLLECTION_ESTOQUE), orderBy('dataEntrada', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipamentoEstoque));
  } catch (error) {
    console.error('Erro ao listar estoque:', error);
    throw new Error('Não foi possível carregar o estoque');
  }
};

export const escutarEstoque = (onUpdate: (dados: EquipamentoEstoque[]) => void, onError?: (err: Error) => void) => {
  const q = query(collection(db, COLLECTION_ESTOQUE), orderBy('dataEntrada', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const itens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipamentoEstoque));
    onUpdate(itens);
  }, (error) => {
    console.error('Erro ao escutar estoque:', error);
    if (onError) onError(new Error('Não foi possível carregar o estoque em tempo real'));
  });
};

export const criarEquipamento = async (dados: Omit<EquipamentoEstoque, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_ESTOQUE), dados);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    throw new Error('Não foi possível registrar o equipamento');
  }
};

export const atualizarEquipamento = async (id: string, dados: Partial<EquipamentoEstoque>): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_ESTOQUE, id);
    await updateDoc(ref, dados);
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    throw new Error('Não foi possível atualizar o equipamento');
  }
};

export const adicionarHistoricoEstoque = async (id: string, historicoItem: EstoqueHistorico): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_ESTOQUE, id);
    await updateDoc(ref, {
      historico: arrayUnion(historicoItem)
    });
  } catch (error) {
    console.error('Erro ao adicionar histórico:', error);
    throw new Error('Não foi possível registrar o histórico');
  }
};

export const deletarEquipamento = async (id: string): Promise<void> => {
  try {
    const ref = doc(db, COLLECTION_ESTOQUE, id);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    throw new Error('Não foi possível deletar o equipamento');
  }
};

export const verificarUsoEmEstoque = async (campo: string, valor: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, COLLECTION_ESTOQUE),
      where(campo, '==', valor),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar uso em estoque:', error);
    throw new Error('Não foi possível verificar se o item está em uso');
  }
};

export const buscarCapaGrupo = async (tipo: string, marca: string, modelo: string): Promise<string | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_ESTOQUE),
      where('tipo', '==', tipo),
      where('marca', '==', marca),
      where('modelo', '==', modelo),
      where('isImagemPrincipal', '==', true),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data() as EquipamentoEstoque;
      return data.imagemUrl || null;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar capa do grupo:', error);
    return null;
  }
};
