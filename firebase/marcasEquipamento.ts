import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config';
import { MarcaEquipamento } from '../types';

const COLLECTION_NAME = 'marcas_equipamento';

export const listarMarcasEquipamento = async (): Promise<MarcaEquipamento[]> => {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  
  const marcas: MarcaEquipamento[] = [];
  querySnapshot.forEach((docSnap) => {
    marcas.push({ id: docSnap.id, ...docSnap.data() } as MarcaEquipamento);
  });
  
  return marcas.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const criarMarcaEquipamento = async (nome: string): Promise<MarcaEquipamento> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', nome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Já existe uma marca com este nome.');
  }

  const novaMarca = { nome: nome.trim() };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), novaMarca);
  
  return { id: docRef.id, ...novaMarca };
};

export const atualizarMarcaEquipamento = async (id: string, novoNome: string): Promise<void> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', novoNome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty && snapshot.docs[0].id !== id) {
    throw new Error('Já existe uma marca com este nome.');
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { nome: novoNome.trim() });
};

export const deletarMarcaEquipamento = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
