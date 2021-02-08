// ! FOR DEVELOPMENT ONLY PURPOSE

import { config } from 'dotenv';
import { Bot } from '../bot-replies';

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
bot.launch();

console.log('DEV MODE ~ bot started')
