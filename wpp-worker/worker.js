const admin = require("firebase-admin");
const axios = require("axios");

// 1. Configuração do Firebase Admin
// A chave deve ser montada no container em /app/chave-firebase.json
const serviceAccount = require("./chave-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. Configuração do WPPConnect
// Endereço do container WPPConnect na mesma rede Docker
const WPP_URL = process.env.WPP_URL || "http://wpp-server:21465";
const SESSION = process.env.WPP_SESSION || "shadowdesk_bot";
const SECRET_TOKEN = process.env.WPP_SECRET_KEY || "minha_senha_secreta";

console.log("🔥 Worker Iniciado!");
console.log(`📡 Conectando ao WPP em: ${WPP_URL}`);
console.log(`🔑 Sessão: ${SESSION}`);

async function verificarLembretes() {
  try {
    const agora = new Date();

    // Busca lembretes pendentes com data de envio vencida
    // dataHoraEnvio deve ser um Timestamp ou Date no Firestore
    const snapshot = await db.collection('lembretes')
      .where('status', '==', 'pendente')
      .where('dataHoraEnvio', '<=', agora)
      .get();

    if (snapshot.empty) return;

    console.log(`🔎 Encontrados ${snapshot.size} lembretes para enviar.`);

    const promises = snapshot.docs.map(async (doc) => {
      const dados = doc.data();
      const telefone = dados.telefone;

      if (!telefone) {
        console.warn(`⚠️ Lembrete ${doc.id} sem telefone.`);
        await db.collection('lembretes').doc(doc.id).update({
          status: 'erro',
          erroLog: 'Telefone não informado'
        });
        return;
      }

      console.log(`📤 Disparando para: ${telefone}`);

      try {
        // Formatar telefone (adicionar @c.us se não tiver)
        let phoneFormatted = telefone.replace(/\D/g, ''); // Remove não números
        if (!phoneFormatted.endsWith('@c.us')) {
          phoneFormatted = `${phoneFormatted}@c.us`;
        }

        // Chama a API do WPPConnect
        await axios.post(`${WPP_URL}/api/${SESSION}/send-message`, {
          phone: phoneFormatted,
          message: `🔔 *Lembrete ShadowDesk*\n\n${dados.titulo}\n${dados.descricao || ''}`,
          isGroup: false
        }, {
          headers: {
            'Authorization': `Bearer ${SECRET_TOKEN}`
          }
        });

        // Atualiza status no Firebase
        await db.collection('lembretes').doc(doc.id).update({
          status: 'enviado',
          enviadoEm: new Date() // Timestamp atual
        });

        console.log(`✅ Enviado: ${doc.id}`);

      } catch (error) {
        console.error(`❌ Erro ao enviar ${doc.id}:`, error.message);
        // Opcional: Marcar como erro no banco ou tentar novamente depois
        // Se for erro de conexão, talvez não marcar como erro definitivo?
        // Por enquanto, marcamos erro para não floodar
        await db.collection('lembretes').doc(doc.id).update({
          status: 'erro',
          erroLog: error.message
        });
      }
    });

    await Promise.all(promises);

  } catch (error) {
    console.error("❌ Erro fatal no loop do worker:", error);
  }
}

// Roda a verificação a cada 30 segundos
const INTERVALO = 30 * 1000;
setInterval(verificarLembretes, INTERVALO);
console.log(`🤖 Monitorando a cada ${INTERVALO / 1000} segundos...`);
