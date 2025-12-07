import { useState, useEffect } from 'react';

const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 horas em milissegundos

interface UseSessionTimerReturn {
import { useState, useEffect } from 'react';

const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 horas em milissegundos

interface UseSessionTimerReturn {
  timeLeft: string;
  isExpired: boolean;
  resetSession: () => void;
}


export const useSessionTimer = (isAuthenticated: boolean, userId?: string, updateCountdown: boolean = true): UseSessionTimerReturn => {
  const [timeLeft, setTimeLeft] = useState<string>('04:00:00');
  const [isExpired, setIsExpired] = useState(false);

  const storageKey = userId ? `sessionStart_${userId}` : null;

  // Inicializar ou recuperar o início da sessão
  useEffect(() => {
    if (isAuthenticated && storageKey) {
      const storedStart = localStorage.getItem(storageKey);
      if (!storedStart) {
        localStorage.setItem(storageKey, Date.now().toString());
        setIsExpired(false);
      } else {
        // Verificar se já expirou ao carregar
        const elapsed = Date.now() - parseInt(storedStart, 10);
        if (elapsed >= SESSION_DURATION) {
          setIsExpired(true);
        }
      }
    } else {
      // Limpar sessão ao deslogar ou se perder userId
      // Mas cuidado: se userId mudar, o efeito roda com novo Id.
      // A limpeza deve ocorrer apenas se !isAuthenticated explicitamente.
      // Se apenas mudou de user A para B, o componente remonta?
      // Se isAuthenticated for false, limpamos TUDO related active session?
      // Não, limpamos apenas o estado local. O storage do user deve ser apagado no logout?
      // Sim, logout deve matar a sessão DO USUARIO.
      if (!isAuthenticated && userId) {
        // Se desconectou, a sessão daquele user acabou.
        localStorage.removeItem(`sessionStart_${userId}`);
      }
      setTimeLeft('04:00:00');
      setIsExpired(false);
    }
  }, [isAuthenticated, storageKey]);

  // Timer regressivo
  useEffect(() => {
    if (!isAuthenticated || isExpired || !storageKey) return;

    const interval = setInterval(() => {
      const storedStart = localStorage.getItem(storageKey);
      if (!storedStart) return;

      const startTime = parseInt(storedStart, 10);
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = SESSION_DURATION - elapsed;

      if (remaining <= 0) {
        setIsExpired(true);
        if (updateCountdown) setTimeLeft('00:00:00');
        // Remover chave ao expirar?
        // localStorage.removeItem(storageKey); // Melhor não, deixa o estado "expired" persistir até logout
        clearInterval(interval);
      } else {
        if (updateCountdown) {
          // Formatar tempo restante
          const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((remaining / (1000 * 60)) % 60);
          const seconds = Math.floor((remaining / 1000) % 60);

          const formattedTime = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
          ].join(':');

          setTimeLeft(formattedTime);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isExpired, updateCountdown, storageKey]);

  const resetSession = () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
      // Iniciar nova imediatamente? 
      // Se resetar, o próximo ciclo do useEffect init vai criar?
      // Não, useEffect init roda na mudança de dep.
      // Forçamos recriação:
      localStorage.setItem(storageKey, Date.now().toString());
    }
    setIsExpired(false);
    setTimeLeft('04:00:00');
  };

  return { timeLeft, isExpired, resetSession };
};
