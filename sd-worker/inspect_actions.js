require('dotenv').config();
const puppeteer = require('puppeteer-core');
const fs = require('fs');

// Credentials from user prompt (or .env if set, but forcing here to be sure)
const USER = 'hugo.domingos@unesp.br';
const PASS = 'Dmgs!@#41217327';

const LOGIN_URL = 'https://servicedesk.unesp.br/atendimento';

(async () => {
  console.log('Starting inspector...');
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Adjust if needed
    headless: false, // Visible for debugging if possible, or 'new'
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    console.log('Navigating to login...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    if (page.url().includes('auth.unesp.br')) {
      console.log('Logging in...');
      await page.waitForSelector('#input_0');
      await page.type('#input_0', USER);
      await page.click('#input_1'); // Focus password
      await page.type('#input_1', PASS);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    console.log('Logged in. Searching for ticket 239057...');
    // Wait for table
    await page.waitForSelector('#GridDatatable_filter input');

    // Type in search
    await page.type('#GridDatatable_filter input', '239057');
    await new Promise(r => setTimeout(r, 3000)); // Wait for filter

    console.log('Taking screenshot of list...');
    await page.screenshot({ path: 'list_view.png' });

    // Look for buttons in the row
    // Usually buttons are in the last column "Ações"
    // Let's dump the HTML of the first row
    const rowHtml = await page.evaluate(() => {
      const row = document.querySelector('#GridDatatable tbody tr');
      return row ? row.innerHTML : 'No row found';
    });
    console.log('Row HTML:', rowHtml);

    console.log('Simulating click on "Iniciar" if present...');
    // I need to look for specific action buttons.
    // Inspecting row HTML will tell us what's there.

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
})();
