const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createGhostTicket() {
  const ghostId = '999999';
  console.log(`👻 Creating Ghost Ticket #${ghostId} in Firestore...`);

  await db.collection('serviceDesk_tickets').doc(ghostId).set({
    id: ghostId,
    numero: ghostId,
    solicitante: 'GHOST TESTER',
    local: 'Matrix',
    servico: 'Disappearing Act',
    status: 'Nova',
    prioridade: 'Baixa',
    abertura: '26/12/2025 00:00',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✅ Ghost Ticket created. Now restart the worker to see it get deleted!');
  process.exit(0);
}

createGhostTicket();
