require('dotenv').config();
const puppeteer = require('puppeteer-core');
const fs = require('fs');

// Configs from index.js
const LOGIN_URL = 'https://servicedesk.unesp.br/';
const P_EXEC_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  let browser = null;
  try {
    console.log('Launching browser for debug...');
    console.log('Executable path:', P_EXEC_PATH);

    browser = await puppeteer.launch({
      executablePath: P_EXEC_PATH,
      headless: 'new', // Using new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to LOGIN_URL:', LOGIN_URL);
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await wait(2000);

    console.log('Current URL:', page.url());

    // Take initial screenshot
    await page.screenshot({ path: 'debug_step1_initial.png' });

    if (page.url().includes('auth.unesp.br')) {
      console.log('On login page...');

      // Try to find inputs
      const emailSelector = '#input_0';
      const passSelector = '#input_1';

      console.log(`Waiting for ${emailSelector}...`);
      try {
        await page.waitForSelector(emailSelector, { timeout: 5000 });
        console.log('Email input found.');
        await page.type(emailSelector, process.env.USER_EMAIL || 'dummy_email');
      } catch (e) {
        console.error('FAILED to find email input!');
        await page.screenshot({ path: 'debug_error_no_email_input.png' });
        const html = await page.content();
        fs.writeFileSync('debug_error_page.html', html);
        throw e;
      }

      console.log(`Waiting for ${passSelector}...`);
      try {
        await page.waitForSelector(passSelector, { timeout: 5000 });
        console.log('Password input found.');
        await page.type(passSelector, 'dummy_password'); // Don't log real password
      } catch (e) {
        console.error('FAILED to find password input!');
        await page.screenshot({ path: 'debug_error_no_pass_input.png' });
        throw e;
      }

      // Take Screenshot before click
      await page.screenshot({ path: 'debug_step2_filled.png' });

      console.log('Clicking submit...');
      // Try to find submit button
      const button = await page.$('button[type="submit"]') || await page.$('button');
      if (button) {
        await button.click();
        console.log('Clicked button.');
        await wait(5000);
        await page.screenshot({ path: 'debug_step3_after_click.png' });
        console.log('After click URL:', page.url());
      } else {
        console.error('Submit button NOT found');
        await page.screenshot({ path: 'debug_error_no_button.png' });
      }

    } else if (page.url().includes('servicedesk.unesp.br')) {
      console.log('Already logged in? (Unexpected for clean session)');
    } else {
      console.log('Unknown page!');
      await page.screenshot({ path: 'debug_unknown_page.png' });
    }

  } catch (error) {
    console.error('Fatal Error:', error);
  } finally {
    if (browser) await browser.close();
  }
})();
