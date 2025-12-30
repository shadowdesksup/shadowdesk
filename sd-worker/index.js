require('dotenv').config();
const puppeteer = require('puppeteer-core');
const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  process.exit(1);
}

const db = admin.firestore();
const COLLECTION_NAME = 'serviceDesk_tickets';

// Configuration
const LOGIN_URL = 'https://servicedesk.unesp.br/atendimento';
const CHECK_INTERVAL = 30 * 1000; // 30 seconds between checks
const REFRESH_INTERVAL = 1; // Refresh page every cycle (ensure new tickets are seen)

let browser = null;
let page = null;
let isLoggedIn = false;
let lastKnownTickets = new Set();
let ignoredTickets = new Set();
let missedCounts = new Map();

// Helper: wait for specified milliseconds
const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function initBrowser() {
  if (browser) return;

  console.log('Initializing browser...');
  browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote'
    ]
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
}

async function closeBrowser() {
  if (browser) {
    try { await browser.close(); } catch (e) { }
    browser = null;
    page = null;
  }
}

async function login() {
  try {
    console.log('Navigating to ServiceDesk...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(2000);

    // Check if we need to login
    if (page.url().includes('auth.unesp.br')) {
      console.log('On login page, entering credentials...');

      // Wait for the specific input fields used by auth.unesp.br
      await page.waitForSelector('#input_0', { timeout: 10000 });

      // Clear and type email
      const emailInput = await page.$('#input_0');
      if (emailInput) {
        await emailInput.click();
        await emailInput.type(process.env.USER_EMAIL, { delay: 30 });
      }

      // Clear and type password
      const passwordInput = await page.$('#input_1');
      if (passwordInput) {
        await passwordInput.click();
        await passwordInput.type(process.env.USER_PASSWORD, { delay: 30 });
      }

      await wait(500);

      // Find and click submit button
      const button = await page.$('button[type="submit"]') || await page.$('button');
      if (button) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
          button.click()
        ]);
      }

      await wait(3000);
      console.log('Login submitted, current URL:', page.url());
    }

    // Check if we're on ServiceDesk now
    if (page.url().includes('servicedesk.unesp.br')) {
      isLoggedIn = true;
      console.log('Successfully logged in!');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Login error:', error.message);
    return false;
  }
}

async function setupFilters() {
  try {
    console.log('Setting up filters...');

    // Wait for table to be present
    await page.waitForSelector('#GridDatatable', { timeout: 15000 });
    await wait(2000); // Give DataTables time to initialize

    // 1. Set pagination to "Não" (show all)
    const paginationSet = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      for (const select of selects) {
        const options = Array.from(select.options);
        const naoOption = options.find(o => o.text === 'Não' || o.value === '-1');
        if (naoOption) {
          select.value = naoOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });
    console.log('Pagination "Não":', paginationSet ? 'SET' : 'not found');
    await wait(1500);

    // 2. Type "Nova" in filter
    const filterInput = await page.$('.dataTables_filter input') ||
      await page.$('input[type="search"]');
    if (filterInput) {
      await filterInput.click();
      await filterInput.evaluate(el => el.value = '');
      await filterInput.type('Nova', { delay: 50 });
      console.log('Filter "Nova": SET');
      await wait(2000); // Wait for filter to apply
    }

    // 3. Sort by "Abertura" descending
    const sorted = await page.evaluate(() => {
      const headers = document.querySelectorAll('th');
      for (const th of headers) {
        if (th.innerText.includes('Abertura')) {
          if (!th.classList.contains('sorting_desc')) {
            th.click();
            return 'clicked';
          }
          return 'already_desc';
        }
      }
      return 'not_found';
    });
    console.log('Sort by Abertura:', sorted);
    await wait(1000);

    return true;
  } catch (error) {
    console.error('Filter setup error:', error.message);
    return false;
  }
}

async function scrapeTickets() {
  try {
    // Ensure we are on the list page
    if (!page.url().includes(LOGIN_URL)) {
      console.log('Navigating to list page before scraping...');
      await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(2000);
    }

    // Wait for table rows to be present
    await page.waitForSelector('#GridDatatable tbody tr', { timeout: 10000 });
    await wait(1000);

    const result = await page.evaluate(() => {
      const rows = document.querySelectorAll('#GridDatatable tbody tr');
      const tickets = [];
      let debugInfo = { firstRowCells: 0, firstRowHtml: '' };

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');

        // Debug first row
        if (i === 0) {
          debugInfo.firstRowCells = cells.length;
          debugInfo.firstRowHtml = row.innerHTML.substring(0, 300);
        }

        if (cells.length < 3) continue; // Need at least 3 cells

        // Extract ticket number from first cell (it's plain text, not a link)
        const numero = cells[0].innerText.trim().replace(/\D/g, '');

        if (!numero) continue;

        // Get all cell texts for flexible extraction
        const cellTexts = Array.from(cells).map(c => c.innerText.trim());

        tickets.push({
          numero: numero,
          prioridade: cellTexts[1] || '',
          status: cellTexts[2] || 'Nova',
          solicitante: cellTexts[4] || '',
          local: cellTexts[5] || '',
          servico: cellTexts[7] || cellTexts[6] || '',
          abertura: cellTexts[cellTexts.length - 1] || ''
        });
      }

      return {
        rowCount: rows.length,
        tickets: tickets,
        debug: debugInfo
      };
    });

    console.log(`Table has ${result.rowCount} rows, extracted ${result.tickets.length} tickets`);
    if (result.debug.firstRowCells > 0) {
      console.log(`Debug: First row has ${result.debug.firstRowCells} cells`);
    }
    return result.tickets;
  } catch (error) {
    console.error('Scrape error:', error.message);
    return [];
  }
}

// Function to get detailed info by navigating DIRECTLY to the ticket URL
async function getTicketDetails(ticketNumber) {
  try {
    const ticketUrl = `https://servicedesk.unesp.br/atendimento/${ticketNumber}`;
    console.log(`Navigating directly to ticket details: ${ticketUrl}`);

    // Navigate directly to the ticket page (Use domcontentloaded for stability)
    await page.setDefaultNavigationTimeout(60000);
    await page.goto(ticketUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await wait(5000); // Increased wait to ensure frame is stable

    // Extract detailed information
    const details = await page.evaluate(() => {
      const result = {};

      // Helper to safely get value or text from an element
      const getContent = (el) => {
        if (!el) return '';
        // If it's a form field, get value
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
          // Ignore hidden inputs (like hid_id which causes the 323 bug)
          if (el.type === 'hidden') return '';
          const val = el.value ? el.value.trim() : '';
          // Explicitly ban the anomaly value "323" which comes from the hidden ID
          return val === '323' ? '' : val;
        }
        // Otherwise get text (for <p>, <div>, <span>)
        const text = el.innerText ? el.innerText.trim() : '';
        return text === '323' ? '' : text;
      };

      // Robust strategy: Find label, then find associated content element
      const getByLabel = (labelText) => {
        // Strategy 0: Check for td with data-label (Common in responsive tables/read-only views)
        const tds = Array.from(document.querySelectorAll('td[data-label]'));
        const exactTd = tds.find(td => td.getAttribute('data-label').toLowerCase().includes(labelText.toLowerCase()));
        if (exactTd) return exactTd.innerText.trim();

        const labels = Array.from(document.querySelectorAll('label'));
        // Find label containing text (ignoring case/whitespace)
        const label = labels.find(l => l.innerText.trim().toLowerCase().includes(labelText.toLowerCase()));

        if (!label) return '';

        // Strategy 1: 'for' attribute (Best match)
        const id = label.getAttribute('for');
        if (id) {
          const el = document.getElementById(id);
          const val = getContent(el);
          if (val) return val;
        }

        // Strategy 2: Look for readonly/display field (e.g. readonly_field_XXXX for Descricao)
        // Check next sibling (direct)
        let next = label.nextElementSibling;
        if (next) {
          const val = getContent(next);
          if (val) return val;
        }

        // Check parent's next sibling (Bootstrap column structure)
        if (label.parentElement && label.parentElement.nextElementSibling) {
          const container = label.parentElement.nextElementSibling;
          const el = container.querySelector('input:not([type="hidden"]), textarea, p[id^="readonly_"], div.form-control, span');
          if (el) return getContent(el);
        }

        // Strategy 3: Search nearby form-controls or readonly fields
        const container = label.closest('.form-group') || label.parentElement?.parentElement;
        if (container) {
          const el = container.querySelector('p[id^="readonly_"], textarea, input:not([type="hidden"])');
          if (el && el !== label) return getContent(el);
        }

        return '';
      };

      // Extract fields using the robust label finder
      result.tipo_servico = getByLabel('Tipo de Serviço');
      result.local_instalacao = getByLabel('Local de Instalação') || getByLabel('Local');
      result.descricao_completa = getByLabel('Descrição do Serviço') || getByLabel('Descrição');
      result.patrimonio = getByLabel('Patrimônio');
      result.sala = getByLabel('Sala');
      result.ramal = getByLabel('Ramal');

      const rawCelular = getByLabel('Celular');
      // Clean phone: Remove all non-digits
      result.celular = rawCelular ? rawCelular.replace(/\D/g, '') : '';

      result.email = getByLabel('E-mail');

      // Captured "Data e Horário" specifically (from screenshot, this is the field)
      result.data_atendimento = getByLabel('Data e Horário');

      // Consolidate "Melhor Data" / "Agendamento" / "Data e Horário" into one reliable field
      // The screenshot shows "Data e Horário" is the label for the scheduling info at the bottom
      result.melhor_data = result.data_atendimento ||
        getByLabel('Melhor data') ||
        getByLabel('horário para atendimento') ||
        getByLabel('Agendamento');

      // Extract "ABERTURA" date from the header (Ticket #XXXXX ... ABERTURA DD/MM/YYYY)
      // It's usually in a list or span at the top
      try {
        const headerText = document.body.innerText;
        const aberturaMatch = headerText.match(/ABERTURA\s+([0-9]{2}\/[0-9]{2}\/[0-9]{4}\s+[0-9]{2}:[0-9]{2})/i);
        if (aberturaMatch) {
          result.abertura_detalhes = aberturaMatch[1];
        }
      } catch (e) { }

      // Clean empty fields
      Object.keys(result).forEach(k => !result[k] && delete result[k]);

      return result;
    });

    console.log(`Extracted ${Object.keys(details).length} fields from Atendimento page`);
    if (details.descricao_completa) {
      console.log(`Desc Sample: ${details.descricao_completa.substring(0, 30)}...`);
    }

    // Navigate back to list using direct URL
    console.log(`Navigating back to ticket list...`);
    await page.goto('https://servicedesk.unesp.br/atendimento', {
      waitUntil: 'networkidle2',
      timeout: 45000
    });

    // Check if we are really back
    try {
      await page.waitForSelector('#GridDatatable', { timeout: 10000 });
    } catch (e) {
      console.log("Table not found immediately after nav back, refreshing...");
      await page.reload({ waitUntil: 'networkidle2' });
    }

    await wait(2000);

    return details;
  } catch (error) {
    console.error(`Error getting details for ticket #${ticketNumber}:`, error.message);

    try {
      await page.goto('https://servicedesk.unesp.br/atendimento', { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) { }

    return {};
  }
}

async function saveToFirestore(tickets) {
  let saved = 0;

  for (const ticket of tickets) {
    try {
      const docId = `ticket_${ticket.numero}`;
      await db.collection(COLLECTION_NAME).doc(docId).set({
        ...ticket,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        scrapedAt: new Date().toISOString()
      }, { merge: true });
      saved++;
    } catch (error) {
      console.error(`Error saving ticket ${ticket.numero}:`, error.message);
    }
  }

  return saved;
}

// Helper: Format Date string "DD/MM/YYYY HH:mm" to "Weekday, D de Mon. de YYYY, às HH:mm"
function formatTicketDate(dateStr) {
  try {
    if (!dateStr) return '';
    // Parse "27/12/2025 17:31"
    const [datePart, timePart] = dateStr.trim().split(' ');
    if (!datePart || !timePart) return dateStr;

    const [day, month, year] = datePart.split('/');

    // Create date object (Month is 0-indexed)
    const date = new Date(year, month - 1, day);

    // Manual formatting for robustness inside Docker (locales might be missing)
    const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

    const weekday = weekdays[date.getDay()];
    const monthName = months[date.getMonth()];

    // "sábado, 27 de dez. de 2025, às 17:31"
    return `${weekday}, ${day} de ${monthName} de ${year}, às ${timePart}`;
  } catch (error) {
    return dateStr; // Fallback to original if parsing fails
  }
}

// Helper to Queue Notification
async function queueNotification(ticket) {
  try {
    // 1. Get recipients
    const snapshot = await db.collection('serviceDesk_preferences').where('enabled', '==', true).get();
    if (snapshot.empty) return;

    // 2. Format Message
    const solicitante = (ticket.solicitante || 'Desconhecido').trim();
    const rawDesc = ticket.descricao_completa || ticket.descricao || 'Sem descrição';
    const descricao = rawDesc.trim();
    const local = (ticket.local_instalacao || ticket.local || '').trim();
    const sala = (ticket.sala || '').trim();
    const melhorData = ticket.melhor_data || ticket.data_atendimento;
    const rawDate = ticket.abertura_detalhes || ticket.abertura;
    const formattedDate = formatTicketDate(rawDate);

    // Build message with REAL newlines (not escaped)
    let message = 'Novo Chamado em *ServiceDesk* 📝\n\n';
    message += '*Solicitante:* _' + solicitante + '_\n\n';
    message += '*Descrição:* ' + descricao + '\n\n';

    // Conditional Local/Sala
    if (local || sala) {
      const localStr = local ? '*Local:* _' + local + '_' : '';
      const salaStr = sala ? '*Sala:* _' + sala + '_' : '';
      const space = (local && sala) ? ' ' : '';
      message += localStr + space + salaStr + '\n\n';
    }

    // Conditional Agendado Para
    if (melhorData && melhorData !== 'Não informado') {
      message += '*Agendado para:* _' + melhorData + '_\n\n';
    }

    // Link (bold label)
    message += '*Ver no ServiceDesk:* https://servicedesk.unesp.br/atendimento/' + ticket.numero + '\n\n';

    // Footer Date (sem negrito extra no emoji)
    if (formattedDate && formattedDate.includes(' de ')) {
      message += '📅 ' + formattedDate;
    } else {
      message += '📅 ' + (formattedDate || rawDate || '');
    }

    // 3. Queue for each user
    const batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.phone) {
        const queueRef = db.collection('notification_queue').doc();
        batch.set(queueRef, {
          to: data.phone,
          message: message,
          status: 'pending',
          type: 'serviceDesk_new_ticket',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          ticketId: ticket.numero
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`    -> Queued notification for ${count} users.`);
    }

  } catch (error) {
    console.error('Error queuing notification:', error);
  }
}

async function refreshPage() {
  try {
    console.log('Refreshing page...');

    // "Soft Refresh" - Just navigate to the list URL again. 
    // This handles session timeouts better than reload() and is faster.
    try {
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      console.log("Navigation timed out, checking if table loaded anyway...");
    }

    // Wait for the table explicitly. 
    // If this fails, THEN we know we are truly broken.
    await page.waitForSelector('#GridDatatable', { timeout: 20000 });

    // Re-apply filters after refresh
    await setupFilters();

    return true;
  } catch (error) {
    console.error('Refresh failed:', error.message);
    return false;
  }
}

async function runWorker() {
  console.log('=== ServiceDesk Worker Starting ===');
  console.log(`Check interval: ${CHECK_INTERVAL / 1000}s, Refresh every ${REFRESH_INTERVAL} cycles`);

  let cycleCount = 0;

  while (true) {
    try {
      cycleCount++;
      const timestamp = new Date().toLocaleString('pt-BR');
      console.log(`\n[${timestamp}] Cycle #${cycleCount}`);

      // Initialize browser if needed
      if (!browser) {
        await initBrowser();

        // OPTIMIZATION: Load existing tickets from DB on startup
        if (cycleCount === 1) {
          console.log('Syncing with database...');

          // Load Active Tickets
          const activeSnapshot = await admin.firestore().collection('serviceDesk_tickets').get();
          activeSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.numero) lastKnownTickets.add(data.numero);
          });
          console.log(`✓ Loaded ${lastKnownTickets.size} active tickets.`);

          // Load Ignored Tickets
          const ignoredSnapshot = await admin.firestore().collection('serviceDesk_ignored_tickets').get();
          ignoredSnapshot.forEach(doc => {
            ignoredTickets.add(doc.id);
          });
          console.log(`✓ Loaded ${ignoredTickets.size} ignored tickets.`);
        }
      }

      // Login if needed
      if (!isLoggedIn) {
        const loginSuccess = await login();
        if (!loginSuccess) {
          console.log('Login failed, waiting 30s...');
          await wait(30000);
          continue;
        }
        // Setup filters after fresh login
        await setupFilters();
      }

      // Refresh page periodically
      if (cycleCount > 1 && cycleCount % REFRESH_INTERVAL === 0) {
        const refreshed = await refreshPage();
        if (!refreshed) {
          // If refresh fails, reset everything
          isLoggedIn = false;
          await closeBrowser();
          continue;
        }
      }

      // Scrape tickets
      const tickets = await scrapeTickets();

      // SAFETY CHECK 1: Filter Validation
      // If we are filtering by "Nova" but find tickets with other statuses, the filter FAILED.
      // In this case, we MUST ABORT processing to prevent "New Ticket" spam or mass deletion.
      const hasInvalidStatus = tickets.some(t => {
        const s = (t.status || '').toLowerCase();
        return s.includes('atendimento') || s.includes('aguardando') || s.includes('fechado');
      });

      if (hasInvalidStatus) {
        console.warn('⚠️ WARNING: Filter mismatch detected! Found tickets with non-Nova status.');
        console.warn('   -> Aborting this cycle to prevent data corruption. Will filter again next cycle.');
        await setupFilters(); // Force re-setup filter immediately
        continue;
      }

      if (tickets.length > 0) {
        const currentIds = new Set(tickets.map(t => t.numero));

        // Update lastKnown based on current scrape to avoid re-adding existing ones as new immediately
        // But for deletion, we need to be careful

        // --- 1. SYNC: Remove tickets that disappeared ---
        const idsToDelete = [...lastKnownTickets].filter(id => !currentIds.has(id));

        // SAFETY CHECK 2: Mass Deletion Protection
        // If > 5 tickets disappeared at once (and it's > 20% of total), it's likely a glitch (e.g. empty page).
        // Only allow large deletions if the new count is 0 (meaning we cleared the queue legitimately)
        // OR if the user deliberately cleared them (hard to distinguish, so err on side of caution).
        const isMassDeletion = idsToDelete.length > 5 && (idsToDelete.length > lastKnownTickets.size * 0.2);

        if (isMassDeletion) {
          console.warn(`⚠️ WARNING: Mass deletion detected (${idsToDelete.length} tickets). Checking for site glitch...`);
          // If the site returned valid "Nova" tickets (tickets.length > 0) but we are missing many others,
          // it could be that pagination logic messed up or we are viewing a different page.
          // For safety, we SKIP deletion this cycle.
          console.warn('   -> Skipping deletion this cycle to be safe.');
        } else if (idsToDelete.length > 0) {
          console.log(`🗑️ Syncing: ${idsToDelete.length} tickets disappeared from ServiceDesk. Deleting from DB...`);

          for (const rawId of idsToDelete) {
            const id = String(rawId).trim(); // Ensure unclean IDs don't break things
            const docId = `ticket_${id}`;

            try {
              await admin.firestore().collection('serviceDesk_tickets').doc(docId).delete();
              lastKnownTickets.delete(rawId);
              console.log(`   - Successfully Deleted #${id}`);
            } catch (err) {
              console.error(`   ❌ Failed to delete #${id} (doc: ${docId}):`, err);
            }
          }
        }


        // --- 2. PROCESS: Handle New Tickets (respecting Ignore List) ---
        const newTickets = tickets.filter(t => !lastKnownTickets.has(t.numero));

        if (newTickets.length > 0) {

          // Separate into ToProcess and ToIgnore
          const toProcess = [];

          for (const t of newTickets) {
            if (ignoredTickets.has(t.numero)) {
              console.log(`🚫 Skipping #${t.numero} (User ignored/deleted it previously)`);
            } else {
              toProcess.push(t);
            }
          }

          if (toProcess.length > 0) {
            console.log(`🆕 Found ${toProcess.length} REALLY new ticket(s)!`);

            for (const t of toProcess) {
              console.log(`  - #${t.numero}: ${t.solicitante} | ${t.servico}`);
              const details = await getTicketDetails(t.numero);
              Object.assign(t, details);

              await saveToFirestore([t]);
              console.log(`    -> Saved #${t.numero} to Firestore`);

              // Trigger Notification
              await queueNotification(t);

              // Add to memory
              lastKnownTickets.add(t.numero);
            }
          } else {
            console.log("✓ New tickets found but all were ignored.");
          }

        } else {
          console.log(`✓ Monitoring ${tickets.length} tickets (Synced)`);
        }

        // Memory is explicitly managed above (add/delete), no need to bulk overwrite
      } else {
        console.log('⚠ No tickets found (table might be empty or filter returned nothing)');
      }

      // Wait for next cycle
      await wait(CHECK_INTERVAL);

    } catch (error) {
      console.error('Cycle error:', error.message);

      // Reset on error
      isLoggedIn = false;
      await closeBrowser();

      console.log('Waiting 30s before retry...');
      await wait(30000);
    }
  }
}

// Start the worker
runWorker();
