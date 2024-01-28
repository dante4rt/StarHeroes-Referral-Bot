const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const random = require('random-names-places');
const randomEmail = require('random-email');
const readlineSync = require('readline-sync');

(async () => {
  try {
    const BASE_URL = readlineSync.question('Enter your target link: ');
    let browserOptions = {
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    try {
      const proxies = await fs.readFile('proxy.txt', 'utf8');
      const PROXY_LIST = proxies.split('\n').filter(Boolean);

      if (PROXY_LIST.length > 0) {
        const selectedProxy =
          PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)];
        const proxyUrl =
          'http://' + selectedProxy.split(':').slice(0, 2).join(':');
        const proxyUsername = selectedProxy.split(':')[2];
        const proxyPassword = selectedProxy.split(':').at(-1);

        browserOptions.args.push(`--proxy-server=${proxyUrl}`);
        browser = await puppeteer.launch(browserOptions);

        const page = await browser.newPage();
        await page.authenticate({
          username: proxyUsername,
          password: proxyPassword,
        });
      } else {
        console.log('No proxies found in file, proceeding without proxy.');
        browser = await puppeteer.launch(browserOptions);
      }
    } catch (error) {
      console.log('Error reading proxy file, proceeding without proxy:', error);
      browser = await puppeteer.launch(browserOptions);
    }

    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    await page.waitForTimeout(2000 + Math.random() * 5000);

    await page.waitForSelector('input[name="username"]', { visible: true });
    await page.type('input[name="username"]', random.name().trim());

    await page.waitForSelector('input[name="email"]', { visible: true });
    await page.type(
      'input[name="email"]',
      randomEmail({ domain: 'gmail.com' })
    );

    await page.waitForSelector('input[type="submit"]', { visible: true });
    await page.click('input[type="submit"]');

    await page.waitForTimeout(2000 + Math.random() * 5000);

    const [successContent] = await page.$x(
      "//p[contains(text(),'GET MORE REWARDS BY USING OUR REFERRAL PROGRAM')]"
    );

    if (successContent) {
      console.log('Success!');
    } else {
      console.log('Failed or potentially blocked.');
    }

    await browser.close();
  } catch (error) {
    console.error('Error occurred during Puppeteer request:', error.message);
  }
})();
