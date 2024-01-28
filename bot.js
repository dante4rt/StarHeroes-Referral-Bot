require('dotenv').config();
const { Telegraf, Scenes, Markup } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const axios = require('axios'); 
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const fs = require('fs');
const puppeteer = require('puppeteer');
const random = require('random-names-places');
const randomEmail = require('random-email');

async function getUserAgents() {
  try {
    const response = await axios.get(
      'https://raw.githubusercontent.com/Karmabunny/user-agents.json/master/data/user-agents.json'
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user agents:', error.message);
    return [];
  }
}

if (fs.existsSync('session_db')) {
  fs.rmdirSync('session_db', { recursive: true });
}

const session = new LocalSession({
  database: 'session_db',
  storage: LocalSession.storageMemory,
});
bot.use(session.middleware());

const MAX_REFERRALS = 5;
const MAX_RETRY = 3;
const RETRY_DELAY = 10000;
const RATE_LIMIT_DELAY = 60000;
const PROCESSING_DELAY = 60000;

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

const stageNameScene = new Scenes.BaseScene('stageName');
stageNameScene.enter((ctx) => {
  ctx.replyWithMarkdown(
    'Please click the button below to join our Telegram group and channel first:',
    Markup.inlineKeyboard([
      [
        Markup.button.url(
          'HappyCuanAirdrop Group',
          'https://t.me/HappyCuanDiscuss'
        ),
        Markup.button.url(
          'HappyCuanAirdrop Channel',
          'https://t.me/HappyCuanAirdrop'
        ),
      ],
      [Markup.button.callback('Done', 'done')],
    ])
  );
});

stageNameScene.action('done', (ctx) => {
  ctx.reply('Please enter the Starheroes link:');
  ctx.scene.leave();
  ctx.scene.enter('captureLink');
});

const captureLinkScene = new Scenes.BaseScene('captureLink');
captureLinkScene.on('text', (ctx) => {
  const link = ctx.message.text;
  if (link.startsWith('http')) {
    ctx.session.starheroesLink = link;
    ctx.reply('How many referrals do you want? (Max 5)');
    ctx.scene.enter('referralCount');
  } else {
    ctx.reply('Invalid URL. Please enter a valid Starheroes link:');
  }
});

const referralCountScene = new Scenes.BaseScene('referralCount');
referralCountScene.on('text', async (ctx) => {
  const referralCount = parseInt(ctx.message.text, 10);
  if (
    isNaN(referralCount) ||
    referralCount <= 0 ||
    referralCount > MAX_REFERRALS
  ) {
    ctx.reply(
      `Please enter a valid number for referral count (1-${MAX_REFERRALS}).`
    );
  } else {
    ctx.session.referralCount = referralCount;
    console.log(`Received referral count: ${ctx.session.referralCount}`);
    try {
      ctx.reply('Please wait... Processing referrals.');
      await runPuppeteerScript(
        ctx,
        ctx.session.starheroesLink,
        ctx.session.referralCount
      );
      ctx.reply(
        'All processes have been attempted. Send /start to start over.'
      );
    } catch (error) {
      console.error('Error during Puppeteer script execution:', error.message);
      ctx.reply(
        `An error occurred: ${error.message}. Send /start to try again.`
      );
    }
  }
});

const stage = new Scenes.Stage([
  stageNameScene,
  captureLinkScene,
  referralCountScene,
]);
bot.use(stage.middleware());

bot.command('start', (ctx) => ctx.scene.enter('stageName'));

async function runPuppeteerScript(ctx, baseUrl, referralCount) {
  if (!baseUrl || !baseUrl.startsWith('http')) {
    throw new Error('Invalid Starheroes link. Please enter a valid URL.');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  let isIPBlacklistedLogged = false;

  for (let i = 0; i < referralCount; i++) {
    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }

        await page.goto(baseUrl, {
          waitUntil: 'networkidle2',
          timeout: 600000,
        });

        await page.waitForSelector('input[name="username"]', {
          visible: true,
          timeout: 5000,
        });
        await page.type('input[name="username"]', random.name().trim());

        await page.waitForSelector('input[name="email"]', {
          visible: true,
          timeout: 5000,
        });
        await page.type(
          'input[name="email"]',
          randomEmail({ domain: 'gmail.com' })
        );

        await page.waitForSelector('input[type="submit"]', {
          visible: true,
          timeout: 5000,
        });
        await page.click('input[type="submit"]');

        await page.waitForTimeout(PROCESSING_DELAY);

        if (page.url().includes('getresponse.com/add_subscriber.html')) {
          if (!isIPBlacklistedLogged) {
            ctx.reply(
              'It seems your IP might be blacklisted. Please try again in 1 hour.'
            );
            isIPBlacklistedLogged = true;
          }
          break;
        }

        const successContent = await page.$x(
          "//p[contains(text(),'GET MORE REWARDS BY USING OUR REFERRAL PROGRAM')]"
        );
        if (successContent.length > 0) {
          console.log(`Success on referral ${i + 1}`);
          ctx.reply(`Success on referral ${i + 1}`);
          break;
        } else {
          console.log(`Failed on referral ${i + 1}`);
          ctx.reply(`Failed on referral ${i + 1}`);
        }

        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(
          `Error on referral ${i + 1}, attempt ${attempt + 1}:`,
          error.message
        );
        if (attempt === MAX_RETRY - 1) {
          ctx.reply(
            `Error on referral ${i + 1}: ${error.message}. All attempts failed.`
          );
        } else {
          ctx.reply(
            `Error on referral ${i + 1}, attempt ${attempt + 1}: ${
              error.message
            }. Retrying...`
          );
        }
      }
    }
  }

  await browser.close();
}

getUserAgents()
  .then((userAgents) => {
    if (userAgents.length > 0) {
      console.log('Fetched user agents successfully.');
      console.log('Total user agents:', userAgents.length);

      bot.launch();
    } else {
      console.error('No user agents fetched. Please check the URL.');
    }
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
