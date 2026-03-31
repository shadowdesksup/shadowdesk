import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './config';

export interface VinculoEquipamento {
  id: string;
  nome: string;
}

const COLLECTION_NAME = 'vinculos_equipamento';

export const listarVinculosEquipamento = async (): Promise<VinculoEquipamento[]> => {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  
  const vinculos: VinculoEquipamento[] = [];
  querySnapshot.forEach((docSnap) => {
    vinculos.push({ id: docSnap.id, ...docSnap.data() } as VinculoEquipamento);
  });
  
  return vinculos.sort((a, b) => a.nome.localeCompare(b.nome));
};

export const criarVinculoEquipamento = async (nome: string): Promise<VinculoEquipamento> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', nome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    throw new Error('Já existe um vínculo com este nome.');
  }

  const novo = { nome: nome.trim() };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), novo);
  
  return { id: docRef.id, ...novo };
};

export const atualizarVinculoEquipamento = async (id: string, novoNome: string): Promise<void> => {
  const q = query(collection(db, COLLECTION_NAME), where('nome', '==', novoNome.trim()));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty && snapshot.docs[0].id !== id) {
    throw new Error('Já existe um vínculo com este nome.');
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { nome: novoNome.trim() });
};

export const deletarVinculoEquipamento = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
