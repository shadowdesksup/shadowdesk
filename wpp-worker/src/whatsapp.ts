import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

let client: Client;
let isReady = false;

export const initWhatsapp = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    client = new Client({
      authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
      puppeteer: {
        headless: true, // Headless mode as required
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Important for Docker/VM environments
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // <- this one doesn't works in Windows
          '--disable-gpu'
        ]
      }
    });

    client.on('qr', (qr) => {
      console.log('QR RECEIVED. Scan this with WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      console.log('WhatsApp Client is ready!');
      isReady = true;
      resolve();
    });

    client.on('authenticated', () => {
      console.log('WhatsApp Authenticated');
    });

    client.on('auth_failure', (msg) => {
      console.error('WhatsApp Authentication failure:', msg);
      reject(new Error(msg));
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp Client was disconnected:', reason);
      isReady = false;
      // Optional: Reconnect logic could go here, but kept simple for now
    });

    console.log('Initializing WhatsApp client...');
    client.initialize().catch(err => {
      console.error("Failed to initialize client", err);
      reject(err);
    });
  });
};

export const sendMessage = async (to: string, message: string): Promise<boolean> => {
  if (!isReady) {
    console.warn('WhatsApp client is not ready. Cannot send message.');
    return false;
  }

  try {
    // Clean number first (remove non-digits)
    let cleanNumber = to.replace(/\D/g, '');

    // Brazilian numbers: if it doesn't start with 55, add it
    // Typical BR format: 11 digits (DDD + 9 + 8 digits) or 10 digits (DDD + 8 digits for landlines)
    if (!cleanNumber.startsWith('55') && (cleanNumber.length === 10 || cleanNumber.length === 11)) {
      cleanNumber = '55' + cleanNumber;
      console.log(`Formatted phone: ${to} -> ${cleanNumber}`);
    }

    const chatId = `${cleanNumber}@c.us`;

    await client.sendMessage(chatId, message);
    console.log(`Message sent to ${chatId}`);
    return true;
  } catch (error) {
    console.error(`Error sending message to ${to}:`, error);
    return false;
  }
};
