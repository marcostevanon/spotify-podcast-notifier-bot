import { config } from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import ngrok from 'ngrok';
import { ApiRouter } from './api';
import { Bot } from './bot';

// import envs
config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!')
}

if (!process.env.SPOTIFY_CLIENT_ID) {
  throw new Error('SPOTIFY_CLIENT_ID must be provided!')
}

if (!process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error('SPOTIFY_CLIENT_SECRET must be provided!')
}

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI must be provided!')
}

if (process.env.ENVIRONMENT === 'production' && !process.env.WEBHOOK_URL) {
  throw new Error('WEBHOOK_URL must be provided!')
}

// bot init
const botApp = new Bot();
const bot = botApp.initBotCommands();

// webserver init
const api = new ApiRouter();
const PORT = process.env.PORT || 3000;

if (process.env.ENVIRONMENT === 'production') {

  // Set telegram webhook
  bot.telegram.setWebhook(process.env.WEBHOOK_URL);

  // express init
  const app = express()
  app.use(morgan('combined'));
  app.use(api.router);

  // Set the bot API endpoint
  app.use(bot.webhookCallback());

  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}

if (process.env.ENVIRONMENT !== 'production') {
  ngrok.connect({ region: 'eu', addr: PORT })
    .then(url => {
      console.log('~ Dev webhook url:', url);

      // Set telegram webhook
      bot.telegram.setWebhook(url);

      // express init
      const app = express()
      app.use(morgan('combined'));
      app.use(api.router);

      // Set the bot API endpoint
      app.use(bot.webhookCallback());

      app.listen(PORT, () => console.log(`Listening on ${PORT}`));
      // No need to call bot.launch()
    });
}
