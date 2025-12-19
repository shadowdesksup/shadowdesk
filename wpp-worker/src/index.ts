import * as dotenv from 'dotenv';
import { initFirebase } from './firebase';
import { initWhatsapp } from './whatsapp';
import { startScheduler } from './scheduler';

// Load environment variables
dotenv.config();

const bootstrap = async () => {
  console.log('Starting WhatsApp Worker...');

  try {
    // 1. Initialize Firebase
    initFirebase();

    // 2. Initialize WhatsApp Client
    // This will block until QR code is scanned (on first run) or session is restored
    await initWhatsapp();

    // 3. Start the Scheduler
    startScheduler();

    console.log('Worker is up and running.');

    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('Stopping worker...');
      process.exit(0);
    });

  } catch (error) {
    console.error('Fatal error during bootstrap:', error);
    process.exit(1);
  }
};

bootstrap();
