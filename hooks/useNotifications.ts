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
      // Prioridade: Som customizado "Ding" para ServiceDesk
      if (som === 'ding') {
        const audio = new Audio('/sounds/ding.mp3');
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

      // Filter those NOT viewed by current user
      // Filter those NOT viewed by current user (Check by Name OR ID to be safe)
      const unviewedTickets = tickets.filter(t => {
        const viewedBy = t.viewedBy || [];
        // If we identify by name, check name. If explicitly by ID, check ID.
        // We are transitioning to Name, so check both to be safe.
        return !viewedBy.includes(userName) && !viewedBy.includes(userId);
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
        criadoEm: t.timestamp || t.abertura || new Date().toISOString(),
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
  }, [userId, tocarSom]);

  // Removed old useEffect that relied on notificacoes.length to flip isFirstLoadRef
  // because it caused the bug where starting with 0 items suppressed the first subsequent item.


  // Calcular não lidas
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // Marcar notificação como lida
  const marcarLida = useCallback(async (notificacaoId: string) => {
    // Check if it is a ServiceDesk ticket
    if (notificacaoId.startsWith('ticket_')) {
      // Update viewedBy in Firestore
      // We just need to add userId to viewedBy array
      try {
        await updateDoc(doc(db, 'serviceDesk_tickets', notificacaoId), {
          viewedBy: arrayUnion(userName || userId)
        });
        // The snapshot listener will automatically remove it from sdNotifications list
      } catch (error) {
        console.error('Erro ao marcar ticket como lido:', error);
      }
    } else {
      // Normal notification
      try {
        await marcarComoLidaService(notificacaoId);
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
      }
    }
  }, [userId]);

  // Marcar todas como lidas
  const marcarTodasLidas = useCallback(async () => {
    try {
      await marcarTodasComoLidasService(userId);
      // For SD tickets, we would need to batch update all. 
      // For now, let's just do system ones or iterate?
      // Iterating SD tickets:
      const ops = sdNotifications.map(n => updateDoc(doc(db, 'serviceDesk_tickets', n.id), {
        viewedBy: arrayUnion(userName || userId)
      }));
      await Promise.all(ops);

    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [userId, sdNotifications]);

  // Excluir notificação
  const excluir = useCallback(async (notificacaoId: string) => {
    if (notificacaoId.startsWith('ticket_')) {
      // Treat "Delete" as "Mark as Read" (remove from list)
      await marcarLida(notificacaoId);
    } else {
      try {
        await excluirNotificacaoService(notificacaoId);
      } catch (error) {
        console.error('Erro ao excluir notificação:', error);
      }
    }
  }, [marcarLida]);

  // Limpar todas
  const limparTodas = useCallback(async () => {
    try {
      await excluirTodasNotificacoesService(userId);
      // Also mark all SD as read
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
