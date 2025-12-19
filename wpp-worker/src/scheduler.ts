import * as cron from 'node-cron';
import { getUnsentReminders, markReminderAsSent } from './firebase';
import { sendMessage } from './whatsapp';

export const startScheduler = () => {
  console.log('Starting scheduler...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Running cron job: checking for reminders...');

    const reminders = await getUnsentReminders();

    if (reminders.length === 0) {
      console.log('No pending reminders found.');
      return;
    }

    console.log(`Found ${reminders.length} pending reminders.`);

    for (const reminder of reminders) {
      // Format date only (no time per user request)
      const dataHora = new Date(reminder.dataHora);
      const dataFormatada = dataHora.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const msg = `Lembrete ShadowDesk 📌\n\n` +
        `*${reminder.titulo}*\n` +
        `${reminder.descricao ? `_${reminder.descricao}_\n` : ''}` +
        `\n📅 ${dataFormatada}`;

      console.log(`Processing reminder for ${reminder.telefone}: ${reminder.titulo}`);

      const sent = await sendMessage(reminder.telefone, msg);

      if (sent) {
        await markReminderAsSent(reminder.id);
      } else {
        console.error(`Failed to send reminder ${reminder.id} to ${reminder.telefone}`);
      }
    }
  });
};
