const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  console.log('Checking serviceDesk_tickets collection...');
  try {
    const snapshot = await db.collection('serviceDesk_tickets').get();
    console.log(`Found ${snapshot.size} documents.`);

    if (snapshot.size > 0) {
      const doc = snapshot.docs[0];
      console.log('Sample Document ID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    }
  } catch (error) {
    console.error('Error checking Firestore:', error);
  } finally {
    process.exit(0);
  }
}

check();
