const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function killGhost() {
  const ticketId = 'ticket_228758';
  console.log(`Killing ghost ticket ${ticketId}...`);
  try {
    await db.collection('serviceDesk_tickets').doc(ticketId).delete();
    console.log("✅ Ghost ticket destroyed properly.");
  } catch (error) {
    console.error("Error:", error);
  }
}

killGhost();
