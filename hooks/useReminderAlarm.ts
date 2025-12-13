import { useEffect, useRef, useCallback } from 'react';
import { Lembrete } from '../types';
import { marcarComoDisparado } from '../firebase/lembretes';
import { notificarLembreteDisparado } from '../firebase/notificacoes';

interface UseReminderAlarmOptions {
  userId: string;
  checkIntervalMs?: number; // Intervalo de verificação em ms (padrão: 10000)
  onDisparo?: (lembrete: Lembrete) => void;
}

/**
 * Hook que verifica lembretes pendentes e dispara alertas quando chegam no horário
 */
export const useReminderAlarm = (
  lembretes: Lembrete[],
  options: UseReminderAlarmOptions
) => {
  const { userId, checkIntervalMs = 10000, onDisparo } = options;
  const disparadosRef = useRef<Set<string>>(new Set());

  const verificarLembretes = useCallback(async () => {
    const agora = new Date();

    for (const lembrete of lembretes) {
      // Pular se já foi disparado nesta sessão
      if (disparadosRef.current.has(lembrete.id)) continue;

      // Pular se não está pendente
      if (lembrete.status !== 'pendente') continue;

      // Pular se é um lembrete recebido que não foi aceito ainda
      if (lembrete.compartilhadoCom && lembrete.aceito !== true) continue;

      const dataHoraLembrete = new Date(lembrete.dataHora);

      // Verificar se chegou a hora (com tolerância de 1 minuto pra trás)
      const diferencaMs = agora.getTime() - dataHoraLembrete.getTime();
      const dentroDoIntervalo = diferencaMs >= 0 && diferencaMs < 60000; // 1 minuto de tolerância

      if (dentroDoIntervalo) {
        // Marcar como disparado para não repetir
        disparadosRef.current.add(lembrete.id);

        try {
          // Atualizar status no Firebase
          await marcarComoDisparado(lembrete.id);

          // Criar notificação
          await notificarLembreteDisparado(userId, lembrete.id, lembrete.titulo);

          // Chamar callback de disparo
          if (onDisparo) {
            onDisparo(lembrete);
          }
        } catch (error) {
          console.error('Erro ao processar disparo de lembrete:', error);
          // Remover da lista de disparados para tentar novamente
          disparadosRef.current.delete(lembrete.id);
        }
      }
    }
  }, [lembretes, userId, onDisparo]);

  // Executar verificação periodicamente
  useEffect(() => {
    // Verificar imediatamente ao montar
    verificarLembretes();

    // Configurar intervalo
    const interval = setInterval(verificarLembretes, checkIntervalMs);

    return () => clearInterval(interval);
  }, [verificarLembretes, checkIntervalMs]);

  // Limpar memória de disparados quando lembretes mudam (para permitir re-disparo se necessário)
  useEffect(() => {
    const idsAtuais = new Set(lembretes.map(l => l.id));

    // Remover IDs que não existem mais
    disparadosRef.current.forEach(id => {
      if (!idsAtuais.has(id)) {
        disparadosRef.current.delete(id);
      }
    });
  }, [lembretes]);
};
