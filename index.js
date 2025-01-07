const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const config = require('./settings.json');
const express = require('express');

const app = express();

// Keep-alive server
app.get('/', (req, res) => {
  res.send('Bot is running!');
});
app.listen(process.env.PORT || 3000, () => {
  console.log('Keep-alive server is running.');
});

function createBot() {
  const bot = mineflayer.createBot({
    username: config['bot-account']['username'],
    password: config['bot-account']['password'],
    auth: config['bot-account']['type'],
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  });

  bot.loadPlugin(pathfinder);
  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);

  bot.once('spawn', () => {
    console.log('[INFO] Bot has spawned in the server.');

    if (config.utils['anti-afk'].enabled) {
      bot.setControlState('jump', true);
      if (config.utils['anti-afk'].sneak) {
        bot.setControlState('sneak', true);
      }
    }

    const messages = config.utils['chat-messages']['messages'];
    if (config.utils['chat-messages'].enabled) {
      let i = 0;
      setInterval(() => {
        bot.chat(messages[i]);
        i = (i + 1) % messages.length;
      }, config.utils['chat-messages']['repeat-delay'] * 1000);
    }
  });

  bot.on('kicked', (reason) =>
    console.log(`[INFO] Bot was kicked from the server. Reason: ${reason}`)
  );

  bot.on('error', (err) => console.log(`[ERROR] ${err.message}`));

  bot.on('end', () => {
    console.log('[INFO] Bot disconnected. Reconnecting...');
    setTimeout(createBot, config.utils['auto-reconnect-delay']);
  });
}

createBot();
