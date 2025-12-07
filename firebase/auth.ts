import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from './config';

// Interface para dados do usuário
export interface UserData {
  uid: string;
  email: string;
  nomeCompleto: string;
  criadoEm: any;
  ultimoLogin: any;
}

/**
 * Registrar novo usuário
 */
export const registrarUsuario = async (
  email: string,
  senha: string,
  nomeCompleto: string
): Promise<UserCredential> => {
  try {
    // Validar domínio do email
    if (!email.endsWith('@unesp.br')) {
      throw new Error('Apenas emails @unesp.br são permitidos.');
    }

    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    // Atualizar perfil com nome
    await updateProfile(user, {
      displayName: nomeCompleto
    });

    // Salvar dados adicionais no Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      nomeCompleto,
      criadoEm: serverTimestamp(),
      ultimoLogin: serverTimestamp()
    });

    return userCredential;
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    throw tratarErroAuth(error);
  }
};

/**
 * Fazer login
 */
export const fazerLogin = async (
  email: string,
  senha: string
): Promise<UserCredential> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);

    // Atualizar último login
    await setDoc(
      doc(db, 'users', userCredential.user.uid),
      { ultimoLogin: serverTimestamp() },
      { merge: true }
    );

    return userCredential;
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    throw tratarErroAuth(error);
  }
};

/**
 * Fazer logout
 */
export const fazerLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    throw new Error('Erro ao sair. Tente novamente.');
  }
};

/**
 * Recuperar senha
 */
export const recuperarSenha = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Erro ao recuperar senha:', error);
    throw tratarErroAuth(error);
  }
};

/**
 * Atualizar senha do usuário
 */
export const atualizarSenhaUsuario = async (user: User, novaSenha: string): Promise<void> => {
  try {
    await updatePassword(user, novaSenha);
  } catch (error: any) {
    console.error('Erro ao atualizar senha:', error);
    throw tratarErroAuth(error);
  }
};

/**
 * Obter dados do usuário do Firestore
 */
export const obterDadosUsuario = async (uid: string): Promise<UserData | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
};

/**
 * Escutar atualizações dos dados do usuário em tempo real
 */
export const escutarDadosUsuario = (uid: string, callback: (dados: UserData | null) => void): Unsubscribe => {
  return onSnapshot(doc(db, 'users', uid), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Erro ao escutar dados do usuário:', error);
    callback(null);
  });
};

/**
 * Tratar erros do Firebase Auth
 */
const tratarErroAuth = (error: any): Error => {
  const errorCode = error.code;
  let mensagem = 'Erro desconhecido. Tente novamente.';

  switch (errorCode) {
    case 'auth/email-already-in-use':
      mensagem = 'Este email já está cadastrado.';
      break;
    case 'auth/invalid-email':
      mensagem = 'Email inválido.';
      break;
    case 'auth/operation-not-allowed':
      mensagem = 'Operação não permitida.';
      break;
    case 'auth/weak-password':
      mensagem = 'Senha muito fraca. Use no mínimo 6 caracteres.';
      break;
    case 'auth/user-disabled':
      mensagem = 'Usuário desabilitado.';
      break;
    case 'auth/user-not-found':
      mensagem = 'Usuário não encontrado.';
      break;
    case 'auth/wrong-password':
      mensagem = 'Senha incorreta.';
      break;
    case 'auth/invalid-credential':
      mensagem = 'Email ou senha incorretos.';
      break;
    case 'auth/too-many-requests':
      mensagem = 'Muitas tentativas. Aguarde alguns minutos.';
      break;
    case 'auth/network-request-failed':
      mensagem = 'Erro de conexão. Verifique sua internet.';
      break;
    default:
      mensagem = error.message || 'Erro ao processar solicitação.';
  }

  return new Error(mensagem);
};

export { auth };
