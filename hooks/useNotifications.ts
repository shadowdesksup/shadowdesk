import { useState, useEffect, useCallback, useRef } from 'react';
import { Notificacao, SomNotificacao } from '../types';
import {
  escutarNotificacoes,
  marcarComoLida as marcarComoLidaService,
  marcarTodasComoLidas as marcarTodasComoLidasService,
  excluirNotificacao as excluirNotificacaoService,
  excluirTodasNotificacoes as excluirTodasNotificacoesService
} from '../firebase/notificacoes';

interface UseNotificationsReturn {
  notificacoes: Notificacao[];
  naoLidas: number;
  loading: boolean;
  marcarLida: (notificacaoId: string) => Promise<void>;
  marcarTodasLidas: () => Promise<void>;
  excluir: (notificacaoId: string) => Promise<void>;
  limparTodas: () => Promise<void>;
  tocarSom: (som: SomNotificacao) => void;
  pararSom: () => void;
  somTocando: boolean;
}

// Mapeamento de sons para frequências (Web Audio API fallback)
const FREQUENCIAS_SOM: Record<SomNotificacao, { freq: number; duration: number; pattern: number[] }> = {
  sino: { freq: 800, duration: 200, pattern: [1, 0.5, 1, 0.5, 1] },
  campainha: { freq: 1000, duration: 150, pattern: [1, 0.3, 1, 0.3, 1, 0.3, 1] },
  alerta: { freq: 600, duration: 300, pattern: [1, 0.2, 1] },
  gentil: { freq: 440, duration: 400, pattern: [1] },
  urgente: { freq: 1200, duration: 100, pattern: [1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1, 0.5, 1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1] }
};

export const useNotifications = (userId: string): UseNotificationsReturn => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [somTocando, setSomTocando] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ref para controlar a reprodução de som apenas para NOVAS notificações
  const lastNotificationIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Tocar som usando Web Audio API
  const tocarSom = useCallback((som: SomNotificacao) => {
    // Parar som anterior se estiver tocando
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) { /* ignore */ }
      oscillatorRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSomTocando(false);

    try {
      // Criar AudioContext se não existir
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const config = FREQUENCIAS_SOM[som];

      setSomTocando(true);

      let currentTime = audioContext.currentTime;

      // Criar padrão de beeps
      config.pattern.forEach((duration, index) => {
        if (index % 2 === 0) {
          // Beep
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = config.freq;
          oscillator.type = 'sine';

          const beepDuration = (config.duration * duration) / 1000;

          gainNode.gain.setValueAtTime(0.3, currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + beepDuration);

          oscillator.start(currentTime);
          oscillator.stop(currentTime + beepDuration);

          if (index === 0) { // Keep ref to first oscillator mainly if needed, logic simplified here
            oscillatorRef.current = oscillator;
          }

          currentTime += beepDuration;
        } else {
          // Silêncio
          currentTime += (config.duration * duration) / 1000;
        }
      });

      // Parar após o padrão terminar
      const totalDuration = config.pattern.reduce((acc, d) => acc + (config.duration * d), 0);
      timeoutRef.current = setTimeout(() => {
        setSomTocando(false);
      }, totalDuration);

    } catch (error) {
      console.error('Erro ao tocar som:', error);
      setSomTocando(false);
    }
  }, []);

  const pararSom = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) { /* ignore */ }
      oscillatorRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSomTocando(false);
  }, []);

  // Escutar notificações em tempo real
  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    const unsubscribe = escutarNotificacoes(userId, (novasNotificacoes) => {
      // Verificar se há novas notificações relevantes para tocar som
      if (!isFirstLoadRef.current) {
        const novosIds = novasNotificacoes.map(n => n.id);
        const notificacaoNova = novasNotificacoes.find(n =>
          !lastNotificationIdsRef.current.has(n.id) &&
          !n.lida &&
          (n.tipo === 'solicitacao_amizade' || n.tipo === 'lembrete_recebido' || n.tipo === 'lembrete_aceito' || n.tipo === 'lembrete_recusado')
        );

        if (notificacaoNova) {
          tocarSom('sino');
        }
      }

      setNotificacoes(novasNotificacoes);

      // Atualizar Map de IDs
      const idsSet = new Set(novasNotificacoes.map(n => n.id));
      lastNotificationIdsRef.current = idsSet;

      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, tocarSom]);

  // Calcular não lidas
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // Marcar notificação como lida
  const marcarLida = useCallback(async (notificacaoId: string) => {
    try {
      await marcarComoLidaService(notificacaoId);
      // O listener do Firestore vai atualizar o estado
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas como lidas
  const marcarTodasLidas = useCallback(async () => {
    try {
      await marcarTodasComoLidasService(userId);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [userId]);

  // Excluir notificação
  const excluir = useCallback(async (notificacaoId: string) => {
    try {
      await excluirNotificacaoService(notificacaoId);
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  }, []);

  // Limpar todas
  const limparTodas = useCallback(async () => {
    try {
      await excluirTodasNotificacoesService(userId);
    } catch (error) {
      console.error('Erro ao limpar todas as notificações:', error);
    }
  }, [userId]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      pararSom();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [pararSom]);

  return {
    notificacoes,
    naoLidas,
    loading,
    marcarLida,
    marcarTodasLidas,
    excluir,
    limparTodas,
    tocarSom,
    pararSom,
    somTocando
  };
};
