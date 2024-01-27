const puppeteer = require('puppeteer');
const random = require('random-names-places');
const randomEmail = require('random-email');
const readlineSync = require('readline-sync');

(async () => {
  try {
    const BASE_URL = readlineSync.question('Enter your target link: ');

    if (!BASE_URL || !BASE_URL.startsWith('http')) {
      console.log('Please fill in a valid URL.');
      return;
    }

    const browser = await puppeteer.launch({ headless: false });
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
    console.error('Error occurred:', error);
  }
})();
