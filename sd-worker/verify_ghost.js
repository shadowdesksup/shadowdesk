const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkTicket() {
  const ticketId = 'ticket_228758';
  console.log(`Checking status for ${ticketId}...`);

  try {
    const doc = await db.collection('serviceDesk_tickets').doc(ticketId).get();
    if (doc.exists) {
      console.log("❌ DOCUMENT EXISTS in Firestore!");
      console.log("Data:", doc.data());
    } else {
      console.log("✅ DOCUMENT IS GONE from Firestore (Worker did its job).");
    }
  } catch (error) {
    console.error("Error checking document:", error);
  }
}

checkTicket();
