require('dotenv').config();
const puppeteer = require('puppeteer-core');

const USER = 'hugo.domingos@unesp.br';
const PASS = 'Dmgs!@#41217327';
const TICKET_ID = '239057';
const LOGIN_URL = 'https://servicedesk.unesp.br/atendimento';

(async () => {
  console.log('Starting inspector...');
  // Launch args similar to index.js
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('Navigating to login...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    if (page.url().includes('auth.unesp.br')) {
      console.log('Logging in...');
      await page.waitForSelector('#input_0');
      await page.type('#input_0', USER);

      await page.waitForSelector('#input_1');
      await page.type('#input_1', PASS);

      const submitBtn = await page.$('button[type="submit"]') || await page.$('button');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        submitBtn.click()
      ]);
    }

    console.log('Logged in. Searching for ticket ' + TICKET_ID + '...');
    await page.waitForSelector('#GridDatatable_filter input', { timeout: 15000 });

    // Type in search
    await page.type('#GridDatatable_filter input', TICKET_ID);
    await new Promise(r => setTimeout(r, 3000)); // Wait for filter

    // Evaluate page content to find buttons
    const info = await page.evaluate((tid) => {
      const rows = Array.from(document.querySelectorAll('#GridDatatable tbody tr'));
      const targetRow = rows.find(r => r.innerText.includes(tid));

      if (!targetRow) return { found: false, html: document.body.innerHTML.substring(0, 500) };

      const actionsCell = targetRow.lastElementChild;
      const buttons = Array.from(actionsCell.querySelectorAll('a, button'));

      return {
        found: true,
        buttons: buttons.map(b => ({
          text: b.innerText.trim(),
          title: b.title,
          href: b.href,
          onclick: b.getAttribute('onclick'),
          className: b.className,
          outerHTML: b.outerHTML
        }))
      };
    }, TICKET_ID);

    console.log('Inspection Result:', JSON.stringify(info, null, 2));

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
})();
