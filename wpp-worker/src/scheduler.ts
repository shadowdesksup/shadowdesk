import * as cron from 'node-cron';
import { getUnsentReminders, markReminderAsSent, getPendingNotifications, markNotificationAsSent, markNotificationAsError } from './firebase';
import { sendMessage } from './whatsapp';
import { checkAndSendWeatherAlerts } from './weatherAlerts';

export const startScheduler = () => {
  console.log('Starting scheduler...');

  // ServiceDesk Notifications Queue - Run every 10 seconds
  cron.schedule('*/10 * * * * *', async () => {
    // console.log('Checking notifications queue...');
    const queue = await getPendingNotifications();

    if (queue.length > 0) {
      console.log(`Found ${queue.length} pending notifications.`);
      for (const item of queue) {
        console.log(`Processing notification for ${item.to}`);
        try {
          const sent = await sendMessage(item.to, item.message);
          if (sent) {
            await markNotificationAsSent(item.id);
          } else {
            console.error(`Failed to send notification ${item.id}`);
            // Don't mark as error immediately, maybe retry? 
            // For now, let it stay pending or mark error to avoid loop?
            // Mark error to avoid spamming logs if whatsapp is down
            await markNotificationAsError(item.id, 'Send failed (client disconnected?)');
          }
        } catch (error: any) {
          console.error(`Error processing notification ${item.id}:`, error);
          await markNotificationAsError(item.id, error.message || 'Unknown error');
        }
      }
    }
  });

  // Run every 30 seconds for reminders
  cron.schedule('*/30 * * * * *', async () => {
    console.log('Running cron job: checking for reminders...');

    const reminders = await getUnsentReminders();

    if (reminders.length === 0) {
      console.log('No pending reminders found.');
      return;
    }

    console.log(`Found ${reminders.length} pending reminders.`);

    for (const reminder of reminders) {
      // Ignorar lembretes sem telefone (apenas web)
      if (!reminder.telefone) {
        console.log(`Skipping reminder ${reminder.id}: No phone number.`);
        continue;
      }

      // Format date only (no time per user request)
      const dataHora = new Date(reminder.dataHora);
      const dataFormatada = dataHora.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      let msg = '';

      if (reminder.tipo === 'servicedesk' && reminder.metadata) {
        // Formatação Específica ServiceDesk
        const meta = reminder.metadata;
        const cleanDesc = (reminder.descricao || '').replace(/_/g, ' '); // Remove underscores to avoid italic issues

        msg = `Lembrete ShadowDesk 📌\n\n` +
          `*Solicitante:* _${meta.solicitante || 'N/A'}_\n` +
          `\n*Descrição:* ${cleanDesc}\n` +
          `${(meta.local || meta.sala) ? `\n*Local:* _${meta.local || '-'}_` + (meta.sala ? `   *Sala:* _${meta.sala}_` : '') : ''}` +
          `${meta.dataAgendamento ? `\n\n*Agendado para:* _${meta.dataAgendamento}_` : ''}` +
          `\n\n📅 ${dataFormatada}`;
      } else {
        // Formatação Padrão (Manter exatamente como era para lembretes normais)
        msg = `Lembrete ShadowDesk 📌\n\n` +
          `*${reminder.titulo}*\n` +
          `${reminder.descricao ? `_${reminder.descricao}_\n` : ''}` +
          `\n📅 ${dataFormatada}`;
      }

      console.log(`Processing reminder for ${reminder.telefone}: ${reminder.titulo}`);

      const sent = await sendMessage(reminder.telefone, msg);

      if (sent) {
        await markReminderAsSent(reminder.id);
      } else {
        console.error(`Failed to send reminder ${reminder.id} to ${reminder.telefone}`);
      }
    }
  });

  // Run every 10 minutes for weather alerts
  cron.schedule('*/10 * * * *', async () => {
    console.log('Running cron job: checking weather alerts...');
    await checkAndSendWeatherAlerts();
  });

  // Also run weather check once at startup
  setTimeout(async () => {
    console.log('Initial weather alert check...');
    await checkAndSendWeatherAlerts();
  }, 5000);
};
