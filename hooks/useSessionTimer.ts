import { useState, useEffect } from 'react';

const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 horas em milissegundos

interface UseSessionTimerReturn {
  timeLeft: string;
  isExpired: boolean;
  resetSession: () => void;
}

export const useSessionTimer = (isAuthenticated: boolean): UseSessionTimerReturn => {
  const [timeLeft, setTimeLeft] = useState<string>('04:00:00');
  const [isExpired, setIsExpired] = useState(false);

  // Inicializar ou recuperar o início da sessão
  useEffect(() => {
    if (isAuthenticated) {
      const storedStart = localStorage.getItem('sessionStart');
      if (!storedStart) {
        localStorage.setItem('sessionStart', Date.now().toString());
        setIsExpired(false);
      } else {
        // Verificar se já expirou ao carregar
        const elapsed = Date.now() - parseInt(storedStart, 10);
        if (elapsed >= SESSION_DURATION) {
          setIsExpired(true);
        }
      }
    } else {
      // Limpar sessão ao deslogar
      localStorage.removeItem('sessionStart');
      setTimeLeft('04:00:00');
      setIsExpired(false);
    }
  }, [isAuthenticated]);

  // Timer regressivo
  useEffect(() => {
    if (!isAuthenticated || isExpired) return;

    const interval = setInterval(() => {
      const storedStart = localStorage.getItem('sessionStart');
      if (!storedStart) return;

      const startTime = parseInt(storedStart, 10);
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = SESSION_DURATION - elapsed;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeLeft('00:00:00');
        clearInterval(interval);
      } else {
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
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isExpired]);

  const resetSession = () => {
    localStorage.removeItem('sessionStart');
    setIsExpired(false);
    setTimeLeft('04:00:00');
  };

  return { timeLeft, isExpired, resetSession };
};
