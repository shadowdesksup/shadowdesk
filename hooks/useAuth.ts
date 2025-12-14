import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, fazerLogin, fazerLogout, registrarUsuario, escutarDadosUsuario, UserData } from '../firebase/auth';

interface UseAuthReturn {
  usuario: User | null;
  dadosUsuario: UserData | null;
  estaAutenticado: boolean;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  registrar: (email: string, senha: string, nomeCompleto: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [dadosUsuario, setDadosUsuario] = useState<UserData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuario(user);
        // Escutar dados adicionais em tempo real (garante que nome apareça assim que criado)
        unsubscribeSnapshot = escutarDadosUsuario(user.uid, async (dados) => {
          if (!dados && user) {
            // AUTO-HEAL: Se o usuário existe no Auth mas não no Firestore (ex: criado via Console), cria agora.
            try {
              const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
              const { db } = await import('../firebase/config');

              await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email?.toLowerCase(),
                nomeCompleto: user.displayName || 'Usuário',
                criadoEm: serverTimestamp(),
                ultimoLogin: serverTimestamp()
              }, { merge: true });
            } catch (e) {
              console.error("Erro ao auto-criar usuário no Firestore:", e);
            }
          }
          setDadosUsuario(dados);
          setCarregando(false);
        });
      } else {
        setUsuario(null);
        setDadosUsuario(null);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setCarregando(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async (email: string, senha: string): Promise<void> => {
    try {
      await fazerLogin(email, senha);
    } catch (error: any) {
      throw error;
    }
  };

  const registrar = async (email: string, senha: string, nomeCompleto: string): Promise<void> => {
    try {
      await registrarUsuario(email, senha, nomeCompleto);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fazerLogout();
    } catch (error: any) {
      throw error;
    }
  };

  return {
    usuario,
    dadosUsuario,
    estaAutenticado: !!usuario,
    carregando,
    login,
    registrar,
    logout
  };
};
