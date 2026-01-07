import { useState, useEffect, useCallback, useRef } from 'react';
import { Notificacao, SomNotificacao } from '../types';
import {
  escutarNotificacoes,
  marcarComoLida as marcarComoLidaService,
  marcarTodasComoLidas as marcarTodasComoLidasService,
  excluirNotificacao as excluirNotificacaoService,
  excluirTodasNotificacoes as excluirTodasNotificacoesService
} from '../firebase/notificacoes';
import { db } from '../firebase/config';
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface UseNotificationsReturn {
  notificacoes: Notificacao[];
  naoLidas: number;
  loading: boolean;
  marcarLida: (notificacaoId: string) => Promise<void>;
  marcarTodasLidas: () => Promise<void>;
  excluir: (notificacaoId: string) => Promise<void>;
  limparTodas: () => Promise<void>;
  tocarSom: (som: SomNotificacao | 'ding') => void;
  pararSom: () => void;
  somTocando: boolean;
}

// Mapeamento de sons para frequências (Web Audio API fallback)
const FREQUENCIAS_SOM: Record<SomNotificacao | string, { freq: number; duration: number; pattern: number[] }> = {
  sino: { freq: 800, duration: 200, pattern: [1, 0.5, 1, 0.5, 1] },
  campainha: { freq: 1000, duration: 150, pattern: [1, 0.3, 1, 0.3, 1, 0.3, 1] },
  alerta: { freq: 600, duration: 300, pattern: [1, 0.2, 1] },
  gentil: { freq: 440, duration: 400, pattern: [1] },
  urgente: { freq: 1200, duration: 100, pattern: [1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1, 0.5, 1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1] }
};

// Hook personalizado para gerenciar notificações
export const useNotifications = (userId: string, userName?: string) => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]); // Lista combinada
  const [systemNotifications, setSystemNotifications] = useState<Notificacao[]>([]);
  const [sdNotifications, setSdNotifications] = useState<Notificacao[]>([]);

  const [loading, setLoading] = useState(true);
  const [somTocando, setSomTocando] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for locally ignored SD notifications (to allow clearing bell without marking as viewed)
  const [ignoredSdIds, setIgnoredSdIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('ignored_sd_notifications');
    return new Set(saved ? JSON.parse(saved) : []);
  });

  // Save ignored list to local storage
  useEffect(() => {
    localStorage.setItem('ignored_sd_notifications', JSON.stringify(Array.from(ignoredSdIds)));
  }, [ignoredSdIds]);

  // Ref para controlar a reprodução de som apenas para NOVAS notificações
  const lastNotificationIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Combine notifications whenever sources change
  useEffect(() => {
    // Sort combined list by date (newest first)
    const combined = [...systemNotifications, ...sdNotifications].sort((a, b) => {
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });
    setNotificacoes(combined);
  }, [systemNotifications, sdNotifications]);

  // Tocar som (MP3 preferido, fallback para oscilador)
  const tocarSom = useCallback((som: SomNotificacao | 'ding') => {
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
      // Prioridade: Som customizado para ServiceDesk
      if (som === 'ding' || som === 'notif-sd') {
        const audio = new Audio('/sounds/new-notification-021-370045.mp3');
        audio.volume = 0.5;

        audio.onplay = () => setSomTocando(true);
        audio.onended = () => setSomTocando(false);
        audio.onerror = (e) => {
          console.error('❌ Error playing ding.mp3:', e);
          // Fallback to 'sino' if file missing
          tocarSom('sino' as any);
        };
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.error("❌ Autoplay blocked/failed:", e));
        }
        return;
      }

      // Criar AudioContext se não existir
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const config = FREQUENCIAS_SOM[som as SomNotificacao] || FREQUENCIAS_SOM['sino'];

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

          if (index === 0) {
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

  // Escutar notificações em tempo real (Combinada)
  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    // Flags locais para controlar o "primeiro load" de cada listener independentemente
    let isFirstSystemLoad = true;
    let isFirstSdLoad = true;

    // 1. Notifications do Sistema
    const unsubscribeSystem = escutarNotificacoes(userId, (novasNotificacoes) => {
      if (isFirstSystemLoad) {
        // Primeiro load: Apenas registrar IDs para não tocar som
        novasNotificacoes.forEach(n => lastNotificationIdsRef.current.add(n.id));
        isFirstSystemLoad = false;
      } else {
        // Updates subsequentes: Tocar som se houver novos
        checkAndPlaySound(novasNotificacoes, 'system');
      }
      setSystemNotifications(novasNotificacoes);
      updateLoadedState();
    });

    // 2. ServiceDesk Tickets
    const sdQuery = query(
      collection(db, 'serviceDesk_tickets'),
      orderBy('abertura', 'desc')
      // Removed limit to ensure we catch everything, assuming reasonable dataset
    );

    const unsubscribeSD = onSnapshot(sdQuery, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

      // Cleanup: Remove from ignoredSdIds any IDs that no longer exist in Firestore
      // This ensures that if a ticket is deleted and comes back, it will notify again
      const currentTicketIds = new Set(tickets.map(t => t.id));
      const staleIgnoredIds = [...ignoredSdIds].filter(id => !currentTicketIds.has(id));
      if (staleIgnoredIds.length > 0) {
        setIgnoredSdIds(prev => {
          const next = new Set(prev);
          staleIgnoredIds.forEach(id => next.delete(id));
          return next;
        });
      }

      // Also cleanup lastNotificationIdsRef to allow sound to play when ticket is re-added
      const staleSeenIds = [...lastNotificationIdsRef.current].filter(id => !currentTicketIds.has(id));
      if (staleSeenIds.length > 0) {
        staleSeenIds.forEach(id => lastNotificationIdsRef.current.delete(id));
      }

      // Filter those NOT viewed by current user
      // AND explicitly filter out those locally ignored (cleared from bell)
      const unviewedTickets = tickets.filter(t => {
        const viewedBy = t.viewedBy || [];
        const isIgnoredLocally = ignoredSdIds.has(t.id);

        return !viewedBy.includes(userName) &&
          !viewedBy.includes(userId) &&
          !isIgnoredLocally;
      });

      // Convert to Notificacao format
      const sdNotifs: Notificacao[] = unviewedTickets.map(t => ({
        id: t.id, // Use ticket ID as notification ID
        userId: userId,
        // Correct fields based on sd-worker logic
        tipo: 'service_desk_new',
        titulo: `Novo Chamado #${t.numero}`,
        mensagem: `${t.solicitante} - ${t.local} (${t.servico})`,
        lida: false,
        criadoEm: (() => {
          // Handle Firestore Timestamp object
          if (t.timestamp && typeof t.timestamp.toDate === 'function') {
            return t.timestamp.toDate().toISOString();
          }
          // Handle serialized Firestore Timestamp {seconds, nanoseconds}
          if (t.timestamp && t.timestamp.seconds) {
            return new Date(t.timestamp.seconds * 1000).toISOString();
          }
          // Handle Brazilian date format DD/MM/YYYY HH:mm
          if (t.abertura) {
            const parts = t.abertura.split(/[\/\s:]/);
            if (parts.length >= 5) {
              const date = new Date(
                parseInt(parts[2]), // year
                parseInt(parts[1]) - 1, // month (0-indexed)
                parseInt(parts[0]), // day
                parseInt(parts[3]), // hours
                parseInt(parts[4]) // minutes
              );
              if (!isNaN(date.getTime())) return date.toISOString();
            }
          }
          // Fallback to now
          return new Date().toISOString();
        })(),
        lembreteId: t.id // Store ticket ID here
      }));

      setSdNotifications(sdNotifs);

      // Sempre verificar som para ServiceDesk, inclusive no first load
      // Isso garante que se o usuário der F5 e tiver ticket pendente, toca o som.
      checkAndPlaySound(sdNotifs, 'sd');

      // Update local flag if needed (used for other things?) but we want sound.
      // After playing (or checking), we mark IDs as seen inside checkAndPlaySound
      isFirstSdLoad = false;
      updateLoadedState();
    });

    const checkAndPlaySound = (items: Notificacao[], source: 'system' | 'sd') => {
      // Filtrar apenas os que NÃO estavam no Set (novos de verdade)
      const newItems = items.filter(n => !lastNotificationIdsRef.current.has(n.id) && !n.lida);

      if (newItems.length > 0) {
        if (source === 'sd') {
          tocarSom('ding');
        } else {
          // Check types for system sounds
          const relevant = newItems.some(n => ['solicitacao_amizade', 'lembrete_recebido', 'lembrete_aceito', 'lembrete_recusado'].includes(n.tipo));
          if (relevant) tocarSom('sino');
        }
      }

      // Update Ref with seen IDs
      newItems.forEach(n => lastNotificationIdsRef.current.add(n.id));
    };

    const updateLoadedState = () => {
      setLoading(false);
    };

    return () => {
      unsubscribeSystem();
      unsubscribeSD();
    };
  }, [userId, tocarSom, ignoredSdIds]); // Depend on ignoredSdIds to re-filter if it updates

  // Removed old useEffect that relied on notificacoes.length to flip isFirstLoadRef
  // because it caused the bug where starting with 0 items suppressed the first subsequent item.


  // Calcular não lidas
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // Marcar notificação como lida
  const marcarLida = useCallback(async (notificacaoId: string) => {
    // Check if it is a ServiceDesk ticket
    if (notificacaoId.startsWith('ticket_')) {
      // User explicitly clicked "Mark as Read" (X button) or "View" on the bell item.
      // In this case, we DO want to ignore it LOCALLY, but user might INTEND for it to be removed from list.
      // Wait, original logic was: mark as Viewed in DB.
      // User Request: "Limpar tudo" should NOT mark as viewed.
      // What about individual "X"? Usually "X" removes from notification list.
      // I will change individual "X" to ALSO just ignore locally.

      setIgnoredSdIds(prev => {
        const next = new Set(prev);
        next.add(notificacaoId);
        return next;
      });

    } else {
      // Normal notification
      try {
        await marcarComoLidaService(notificacaoId);
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    }
  }, []);

  // Marcar todas como lidas
  const marcarTodasLidas = useCallback(async () => {
    try {
      await marcarTodasComoLidasService(userId);

      // For SD tickets: do NOT update DB. Just ignore locally.
      const sdIds = sdNotifications.map(n => n.id);
      setIgnoredSdIds(prev => {
        const next = new Set(prev);
        sdIds.forEach(id => next.add(id));
        return next;
      });

    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [userId, sdNotifications]);

  // Excluir notificação
  const excluir = useCallback(async (notificacaoId: string) => {
    if (notificacaoId.startsWith('ticket_')) {
      // Treat "Delete" as "Ignore Locally"
      setIgnoredSdIds(prev => {
        const next = new Set(prev);
        next.add(notificacaoId);
        return next;
      });
    } else {
      try {
        await excluirNotificacaoService(notificacaoId);
      } catch (error) {
        console.error('Erro ao excluir notificação:', error);
      }
    }
  }, []);

  // Limpar todas
  const limparTodas = useCallback(async () => {
    try {
      await excluirTodasNotificacoesService(userId);
      // Also mark all SD as read (Locally only)
      await marcarTodasLidas();
    } catch (error) {
      console.error('Erro ao limpar todas as notificações:', error);
    }
  }, [userId, marcarTodasLidas]);

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
