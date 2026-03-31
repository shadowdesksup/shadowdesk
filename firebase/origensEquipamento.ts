import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config';

export interface OrigemEquipamento {
  id: string;
  nome: string;
}

const COLLECTION_NAME = 'origens_equipamento';

export const listarOrigensEquipamento = async (): Promise<OrigemEquipamento[]> => {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  
  const origens: OrigemEquipamento[] = [];
  querySnapshot.forEach((docSnap) => {
    origens.push({ id: docSnap.id, ...docSnap.data() } as OrigemEquipamento);
  });
  
  return origens.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const criarOrigemEquipamento = async (nome: string): Promise<OrigemEquipamento> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', nome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Já existe uma origem com este nome.');
  }

  const novo = { nome: nome.trim() };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), novo);
  
  return { id: docRef.id, ...novo };
};

export const atualizarOrigemEquipamento = async (id: string, novoNome: string): Promise<void> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', novoNome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty && snapshot.docs[0].id !== id) {
    throw new Error('Já existe uma origem com este nome.');
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { nome: novoNome.trim() });
};

export const deletarOrigemEquipamento = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
