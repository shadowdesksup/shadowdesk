const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkPrefs() {
  console.log('--- ServiceDesk Preferences ---');
  const snap = await db.collection('serviceDesk_preferences').get();
  if (snap.empty) {
    console.log('No preferences found.');
  } else {
    snap.forEach(doc => {
      console.log(`Doc ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('---');
    });
  }

  console.log('\n--- Recent Notification Queue (Last 5) ---');
  const queueSnap = await db.collection('notification_queue').orderBy('createdAt', 'desc').limit(5).get();
  queueSnap.forEach(doc => {
    console.log(`Doc ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
    console.log('---');
  });

  process.exit(0);
}

checkPrefs().catch(err => {
  console.error(err);
  process.exit(1);
});
