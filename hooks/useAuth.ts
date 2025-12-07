import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, fazerLogin, fazerLogout, registrarUsuario, obterDadosUsuario, UserData } from '../firebase/auth';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Buscar dados adicionais do Firestore
        const dados = await obterDadosUsuario(user.uid);
        setDadosUsuario(dados);
        setUsuario(user);
      } else {
        setUsuario(null);
        setDadosUsuario(null);
      }
      setCarregando(false);
    });

    return () => unsubscribe();
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
