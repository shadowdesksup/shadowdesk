import * as admin from 'firebase-admin';
import * as path from 'path';

// Interface for the reminder document
export interface Lembrete {
  id: string; // Document ID
  telefone: string;
  titulo: string;
  descricao?: string;
  dataHora: string; // The UI string
  dataHoraEnvio: admin.firestore.Timestamp; // The worker Timestamp
  enviado: boolean;
  enviadoEm?: admin.firestore.FieldValue;
  tipo?: 'geral' | 'servicedesk';
  metadata?: {
    solicitante?: string;
    local?: string;
    sala?: string;
    dataAgendamento?: string;
    ticketId?: string;
  };
}

export interface NotificationQueueItem {
  id: string;
  to: string; // phone number
  message: string;
  status: 'pending' | 'sent' | 'error';
  type?: string;
  ticketId?: string;
}

let db: admin.firestore.Firestore;

export const initFirebase = (): void => {
  try {
    const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

    // Check if the app is already initialized to avoid errors in hot-reload scenarios (if any)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
      });
      console.log('Firebase initialized successfully.');
    }

    db = admin.firestore();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    process.exit(1);
  }
};

export const getDb = (): admin.firestore.Firestore => db;

export const getUnsentReminders = async (): Promise<Lembrete[]> => {
  try {
    const now = admin.firestore.Timestamp.now();

    const snapshot = await db.collection('lembretes')
      .where('enviado', '==', false)
      .where('dataHoraEnvio', '<=', now)
      .get();

    if (snapshot.empty) {
      return [];
    }

    const reminders: Lembrete[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as Omit<Lembrete, 'id'>;
      reminders.push({ id: doc.id, ...data });
    });

    return reminders;
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }
};

export const markReminderAsSent = async (id: string): Promise<void> => {
  try {
    await db.collection('lembretes').doc(id).update({
      enviado: true,
      enviadoEm: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Reminder ${id} marked as sent.`);
  } catch (error) {
    console.error(`Error marking reminder ${id} as sent:`, error);
  }
};

export const getPendingNotifications = async (): Promise<NotificationQueueItem[]> => {
  try {
    const snapshot = await db.collection('notification_queue')
      .where('status', '==', 'pending')
      .limit(20) // Process in chunks
      .get();

    if (snapshot.empty) return [];

    const items: NotificationQueueItem[] = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() } as NotificationQueueItem);
    });
    return items;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsSent = async (id: string): Promise<void> => {
  try {
    await db.collection('notification_queue').doc(id).update({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Notification ${id} sent.`);
  } catch (error) {
    console.error(`Error marking notification ${id} as sent:`, error);
  }
};

export const markNotificationAsError = async (id: string, errorMsg: string): Promise<void> => {
  try {
    await db.collection('notification_queue').doc(id).update({
      status: 'error',
      error: errorMsg,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error(`Error marking notification ${id} as error:`, error);
  }
};
