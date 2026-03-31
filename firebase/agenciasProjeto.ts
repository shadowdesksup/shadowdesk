import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config';
import { AgenciaProjeto } from '../types';

const COLLECTION_NAME = 'agencias_projeto';

export const listarAgenciasProjeto = async (): Promise<AgenciaProjeto[]> => {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  
  const agencias: AgenciaProjeto[] = [];
  querySnapshot.forEach((docSnap) => {
    agencias.push({ id: docSnap.id, ...docSnap.data() } as AgenciaProjeto);
  });
  
  return agencias.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const criarAgenciaProjeto = async (nome: string): Promise<AgenciaProjeto> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', nome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Já existe uma agência com este nome.');
  }

  const novaAgencia = { nome: nome.trim() };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), novaAgencia);
  
  return { id: docRef.id, ...novaAgencia };
};

export const atualizarAgenciaProjeto = async (id: string, novoNome: string): Promise<void> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', novoNome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty && snapshot.docs[0].id !== id) {
    throw new Error('Já existe uma agência com este nome.');
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { nome: novoNome.trim() });
};

export const deletarAgenciaProjeto = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
