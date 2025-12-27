import { useState, useEffect } from 'react';

const SESSION_DURATION = 3.5 * 60 * 60 * 1000; // 3 horas e 30 minutos

interface UseSessionTimerReturn {
  timeLeft: string;
  isExpired: boolean;
  resetSession: () => void;
  clearSession: () => void;
}

export const useSessionTimer = (isAuthenticated: boolean, userId?: string, updateCountdown: boolean = true): UseSessionTimerReturn => {
  const [timeLeft, setTimeLeft] = useState<string>('03:30:00');
  const [isExpired, setIsExpired] = useState(false);

  const storageKey = userId ? `sessionStart_${userId}` : null;

  // Inicializar ou recuperar o início da sessão
  useEffect(() => {
    if (isAuthenticated && storageKey) {
      // RESET on Refresh: Always start a new session when the component mounts/auths
      localStorage.setItem(storageKey, Date.now().toString());
      setIsExpired(false);
    } else {
      if (!isAuthenticated && userId) {
        // Se desconectou, a sessão daquele user deve ser limpa
        // Mas para garantir, usamos o clearSession no logout explícito
      }
      setTimeLeft('00:05:00');
      setIsExpired(false);
    }
  }, [isAuthenticated, storageKey, userId]);

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

  const clearSession = () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    setIsExpired(false);
    setTimeLeft('00:05:00');
  };

  const resetSession = () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
      localStorage.setItem(storageKey, Date.now().toString());
    }
    setIsExpired(false);
    setTimeLeft('00:05:00');
  };

  return { timeLeft, isExpired, resetSession, clearSession };
};
