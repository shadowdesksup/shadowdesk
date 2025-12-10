import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { DescricaoEquipamento } from '../types';

export const useDescritivos = (userId?: string) => {
  const [descritivos, setDescritivos] = useState<DescricaoEquipamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDescritivos([]);
      setCarregando(false);
      return;
    }

    const q = query(
      collection(db, 'descritivos'),
      where('criadoPor', '==', userId),
      orderBy('criadoEm', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const descritivosData: DescricaoEquipamento[] = [];
        snapshot.forEach((doc) => {
          descritivosData.push({
            id: doc.id,
            ...doc.data()
          } as DescricaoEquipamento);
        });
        setDescritivos(descritivosData);
        setCarregando(false);
      },
      (error) => {
        console.error('Erro ao carregar descritivos:', error);
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const criar = async (dados: Omit<DescricaoEquipamento, 'id' | 'criadoEm'>) => {
    try {
      const agora = new Date().toISOString();
      const novoDescritivo = {
        ...dados,
        criadoEm: agora
      };

      await addDoc(collection(db, 'descritivos'), novoDescritivo);
    } catch (error) {
      console.error('Erro ao criar descritivo:', error);
      throw error;
    }
  };

  const atualizar = async (id: string, dados: Partial<DescricaoEquipamento>) => {
    try {
      const descritivoRef = doc(db, 'descritivos', id);
      await updateDoc(descritivoRef, {
        ...dados,
        atualizadoEm: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao atualizar descritivo:', error);
      throw error;
    }
  };

  const deletar = async (id: string) => {
    try {
      const descritivoRef = doc(db, 'descritivos', id);
      await deleteDoc(descritivoRef);
    } catch (error) {
      console.error('Erro ao deletar descritivo:', error);
      throw error;
    }
  };

  return {
    descritivos,
    criar,
    atualizar,
    deletar,
    carregando
  };
};
