const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteAll() {
  const snapshot = await db.collection('serviceDesk_tickets').get();
  console.log(`Deleting ${snapshot.size} tickets...`);

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log('✅ Done!');
  process.exit(0);
}

deleteAll();
