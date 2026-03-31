import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config';
import { ModeloEquipamento } from '../types';

const COLLECTION_NAME = 'modelos_equipamento';

export const listarModelosEquipamento = async (): Promise<ModeloEquipamento[]> => {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  
  const modelos: ModeloEquipamento[] = [];
  querySnapshot.forEach((docSnap) => {
    modelos.push({ id: docSnap.id, ...docSnap.data() } as ModeloEquipamento);
  });
  
  return modelos.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const criarModeloEquipamento = async (nome: string): Promise<ModeloEquipamento> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', nome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Já existe um modelo com este nome.');
  }

  const novoModelo = { nome: nome.trim() };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), novoModelo);
  
  return { id: docRef.id, ...novoModelo };
};

export const atualizarModeloEquipamento = async (id: string, novoNome: string): Promise<void> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', novoNome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty && snapshot.docs[0].id !== id) {
    throw new Error('Já existe um modelo com este nome.');
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { nome: novoNome.trim() });
};

export const deletarModeloEquipamento = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
