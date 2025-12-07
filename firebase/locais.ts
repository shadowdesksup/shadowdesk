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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export interface Local {
  id: string;
  nome: string;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm?: string;
}

const COLLECTION_LOCAIS = 'locais';

// Listar todos os locais
export const listarLocais = async (): Promise<Local[]> => {
  try {
    const locaisRef = collection(db, COLLECTION_LOCAIS);
    const q = query(locaisRef, orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      nome: doc.data().nome,
      criadoPor: doc.data().criadoPor || '',
      criadoEm: doc.data().criadoEm?.toDate?.()?.toISOString() || new Date().toISOString(),
      atualizadoEm: doc.data().atualizadoEm?.toDate?.()?.toISOString()
    }));
  } catch (error) {
    console.error('Erro ao listar locais:', error);
    throw new Error('Não foi possível carregar os locais');
  }
};

// Criar novo local
export const criarLocal = async (nome: string, userId: string): Promise<string> => {
  try {
    const locaisRef = collection(db, COLLECTION_LOCAIS);
    const docRef = await addDoc(locaisRef, {
      nome: nome.trim(),
      criadoPor: userId,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar local:', error);
    throw new Error('Não foi possível adicionar o local');
  }
};

// Atualizar local existente
export const atualizarLocal = async (id: string, nome: string): Promise<void> => {
  try {
    const localRef = doc(db, COLLECTION_LOCAIS, id);
    await updateDoc(localRef, {
      nome: nome.trim(),
      atualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar local:', error);
    throw new Error('Não foi possível atualizar o local');
  }
};

// Deletar local
export const deletarLocal = async (id: string): Promise<void> => {
  try {
    const localRef = doc(db, COLLECTION_LOCAIS, id);
    await deleteDoc(localRef);
  } catch (error) {
    console.error('Erro ao deletar local:', error);
    throw new Error('Não foi possível deletar o local');
  }
};

// Inicializar locais padrão (chamar apenas uma vez)
export const inicializarLocaisPadrao = async (userId: string): Promise<void> => {
  const locaisPadrao = [
    'Portaria - Campus I',
    'Portaria - Campus II',
    'Guarita - CEES',
    'CER - Sala 01 - Entrada',
    'CER - Sala 02 - Recepção',
    'CER - Sala 03 - Recepção',
    'CER - Sala 04',
    'CER - Sala 05 - Neuro',
    'CER - Sala 06 - Serviço Social',
    'CER - Sala 07 - Sala de Aula',
    'CER - Sala 08 - Rack',
    'CER - Sala 09 - Video Conferência',
    'CER - Sala 10 - Sala de Aula',
    'CER - Sala 13 - Prontuários',
    'CER - Sala 16 - Enfermeiros',
    'CER - Sala 19 - Brinquedoteca',
    'CER - Sala 20 - Prontuario Alunos',
    'CER - Sala 21 - Secretária / Supervisão',
    'CER - Sala 22 - Administração',
    'CER - Sala 23'
  ];

  try {
    const locaisExistentes = await listarLocais();

    // 1. Identificar e limpar duplicatas
    const nomesVistos = new Set<string>();
    const duplicatasParaDeletar: string[] = [];

    for (const local of locaisExistentes) {
      if (nomesVistos.has(local.nome)) {
        duplicatasParaDeletar.push(local.id);
      } else {
        nomesVistos.add(local.nome);
      }
    }

    if (duplicatasParaDeletar.length > 0) {
      console.log(`[inicializarLocaisPadrao] Removendo ${duplicatasParaDeletar.length} duplicatas...`);
      await Promise.all(duplicatasParaDeletar.map(id => deletarLocal(id)));
    }

    // 2. Adicionar faltantes (verificando novamente o Set atualizado)
    const promessasAdicao = locaisPadrao
      .filter(nome => !nomesVistos.has(nome))
      .map(async (nome) => {
        console.log(`[inicializarLocaisPadrao] Adiconando: ${nome}`);
        return criarLocal(nome, userId);
      });

    if (promessasAdicao.length > 0) {
      await Promise.all(promessasAdicao);
    }

  } catch (error) {
    console.error('Erro ao inicializar locais padrão:', error);
  }
};
