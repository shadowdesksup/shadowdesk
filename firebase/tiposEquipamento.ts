import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from './config';
import { TipoEquipamento } from '../types';

const COLLECTION_NAME = 'tipos_equipamento';

export const listarTiposEquipamento = async (): Promise<TipoEquipamento[]> => {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  
  const tipos: TipoEquipamento[] = [];
  querySnapshot.forEach((docSnap) => {
    tipos.push({ id: docSnap.id, ...docSnap.data() } as TipoEquipamento);
  });
  
  return tipos.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const criarTipoEquipamento = async (nome: string): Promise<TipoEquipamento> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', nome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Já existe um tipo de equipamento com este nome.');
  }

  const novoTipo = { nome: nome.trim() };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), novoTipo);
  
  return { id: docRef.id, ...novoTipo };
};

export const atualizarTipoEquipamento = async (id: string, novoNome: string): Promise<void> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', novoNome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty && snapshot.docs[0].id !== id) {
    throw new Error('Já existe um tipo de equipamento com este nome.');
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { nome: novoNome.trim() });
};

export const deletarTipoEquipamento = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
