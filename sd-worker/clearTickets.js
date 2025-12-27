const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAllTickets() {
  console.log('Deleting all ServiceDesk tickets from Firestore...');

  const snapshot = await db.collection('serviceDesk_tickets').get();
  console.log(`Found ${snapshot.size} tickets to delete`);

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log('✅ All tickets deleted!');
  process.exit(0);
}

deleteAllTickets().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
