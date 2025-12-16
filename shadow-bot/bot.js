const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// Tenta encontrar o arquivo de chave no diretório atual (Docker) ou no pai (Local)
const SERVICE_ACCOUNT_PATH_LOCAL = path.join(__dirname, 'serviceAccountKey.json');
const SERVICE_ACCOUNT_PATH_PARENT = path.join(__dirname, '..', 'serviceAccountKey.json');

const SERVICE_ACCOUNT_PATH = fs.existsSync(SERVICE_ACCOUNT_PATH_LOCAL)
  ? SERVICE_ACCOUNT_PATH_LOCAL
  : SERVICE_ACCOUNT_PATH_PARENT;

function initializeFirebase() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('\n❌ ERRO CRÍTICO: Arquivo "serviceAccountKey.json" não encontrado!');
    console.error(`   Esperado em: ${SERVICE_ACCOUNT_PATH_LOCAL} OU ${SERVICE_ACCOUNT_PATH_PARENT}`);
    console.error('   O bot não pode acessar o banco de dados sem ele.\n');
    return false;
  }

  try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase conectado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar no Firebase:', error.message);
    return false;
  }
}

// --- WHATSAPP CLIENT SETUP ---
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Crítico para Docker (evita crash de memória)
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('\n--- SCAN THIS QR CODE ---\n');
  qrcode.generate(qr, { small: true });
  console.log('\n--------------------------\n');
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado! O bot está rodando.');
  startMonitoring();
});

client.on('auth_failure', () => {
  console.error('❌ Falha na autenticação do WhatsApp. Tente apagar a pasta .wwebjs_auth e reiniciar.');
});

// --- MONITORING LOGIC ---
const activeTimeouts = new Map(); // Para agendamento preciso

function startMonitoring() {
  console.log('👀 Monitorando lembretes (Pendentes e Disparados)...');
  const db = admin.firestore();

  // Listener para Pendentes E Disparados (para garantir envio se o site disparar antes)
  // Usamos 'in' query para pegar ambos
  db.collection('lembretes').where('status', 'in', ['pendente', 'disparado'])
    .onSnapshot((snapshot) => {
      const now = new Date();

      snapshot.docChanges().forEach((change) => {
        const lembrete = change.doc.data();
        const docId = change.doc.id;

        // Verifica se já enviamos o zap para este ID (evita loop)
        if (lembrete.whatsappEnviado) {
          // Se já enviou, limpa qualquer timeout pendente para economizar memória
          if (activeTimeouts.has(docId)) {
            clearTimeout(activeTimeouts.get(docId));
            activeTimeouts.delete(docId);
          }
          return;
        }

        if (change.type === 'added' || change.type === 'modified') {
          // SE JÁ ESTÁ DISPARADO (pelo site) e não enviado: ENVIA AGORA
          if (lembrete.status === 'disparado' && !lembrete.whatsappEnviado) {
            console.log(`🔔 Detectado disparo pelo site: ${lembrete.titulo}`);
            sendReminderMessage(docId, lembrete);
            return;
          }

          // SE ESTÁ PENDENTE: Agendamento preciso
          if (lembrete.status === 'pendente') {
            const dataLembrete = new Date(lembrete.dataHora);
            if (isNaN(dataLembrete.getTime())) return;

            const diffMs = dataLembrete.getTime() - now.getTime();

            // Se já passou (mas recente, < 10 min) ou é AGORA
            if (diffMs <= 0 && diffMs > -600000) {
              sendReminderMessage(docId, lembrete);
            }
            // Se é no futuro próximo (< 1 hora), agendar o setTimeout
            else if (diffMs > 0 && diffMs < 3600000) {
              // Limpa anterior se houver (caso de update de data)
              if (activeTimeouts.has(docId)) clearTimeout(activeTimeouts.get(docId));

              console.log(`⏱️ Agendando "${lembrete.titulo}" para daqui a ${(diffMs / 1000).toFixed(1)}s`);

              const timeoutId = setTimeout(() => {
                sendReminderMessage(docId, lembrete);
                activeTimeouts.delete(docId);
              }, diffMs);

              activeTimeouts.set(docId, timeoutId);
            }
          }
        }

        // Cleanup de removidos
        if (change.type === 'removed') {
          if (activeTimeouts.has(docId)) {
            clearTimeout(activeTimeouts.get(docId));
            activeTimeouts.delete(docId);
          }
        }
      });
    }, (error) => {
      console.error('❌ Erro no listener do Firestore:', error);
    });

  // Verificação periódica apenas para garantir (fallback de falhas de memória/reinício)
  setInterval(async () => {
    // ... Mantido simples para limpeza ou casos extremos
  }, 300000); // 5 minutos
}

async function sendReminderMessage(docId, lembrete) {
  // Verificação de segurança duplicada
  // (Embora o listener filtre, aqui garante contra race conditions locais)
  if (lembrete.whatsappEnviado) return;

  console.log(`📤 Iniciando envio: ${lembrete.titulo}`);

  // Marca flag de envio IMEDIATAMENTE no objeto local para evitar duplo disparo no timeout
  lembrete.whatsappEnviado = true; // hack local

  const mensagem = `*Lembrete ShadowDesk* 📌\n\n` +
    `*${lembrete.titulo}*\n` +
    `_${lembrete.descricao || 'Sem descrição'}_\n\n` +
    `📅 ${new Date(lembrete.dataHora).toLocaleString('pt-BR')}`;

  try {
    let targetNumber = 'DESTINATARIO_PADRAO'; // Ajuste conforme lógica

    // Lógica de Telefone (Mantida a mesma do seu código original)
    if (lembrete.telefone) {
      let cleanNumber = lembrete.telefone.replace(/\D/g, '');
      if (cleanNumber.length >= 10 && cleanNumber.length <= 11) {
        cleanNumber = '55' + cleanNumber;
      }
      targetNumber = cleanNumber.includes('@c.us') ? cleanNumber : `${cleanNumber}@c.us`;

      try {
        // Tenta validar ID se client estiver pronto...
        const numberId = await client.getNumberId(targetNumber);
        if (numberId) targetNumber = numberId._serialized;
      } catch (e) { /* ignore */ }
    }

    console.log(`📞 Enviando mensagem...`);
    await client.sendMessage(targetNumber, mensagem);
    console.log(`✅ Enviado! Atualizando DB...`);

    // Atualiza status e flag
    // Se estava pendente, vira disparado. Se já era disparado, mantém.
    await admin.firestore().collection('lembretes').doc(docId).update({
      status: 'disparado',
      whatsappEnviado: true,
      disparadoEm: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Falha envio:`, error);
  }
}

// --- STARTUP ---
if (initializeFirebase()) {
  console.log('🚀 Inicializando cliente WhatsApp...');
  client.initialize();
}
