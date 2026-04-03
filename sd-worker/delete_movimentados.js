const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deleteMovimentados() {
  console.log('Buscando registros de movimentação (TRANSFERIDO)...');
  const snapshot = await db.collection('estoque').where('status', '==', 'TRANSFERIDO').get();
  
  if (snapshot.empty) {
    console.log('Nenhum registro de movimentação encontrado.');
    process.exit(0);
  }

  console.log(`Encontrados ${snapshot.size} registros. Deletando...`);

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();

  console.log('✅ Todos os registros de movimentação foram apagados com sucesso!');
  process.exit(0);
}

deleteMovimentados().catch(console.error);
