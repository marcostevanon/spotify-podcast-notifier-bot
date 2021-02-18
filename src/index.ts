// ! FOR DEVELOPMENT PURPOSE ONLY
import { config } from 'dotenv';
import { Bot } from './bot';
import { Observer } from './observer';

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

// bot init
const bot = new Bot();
bot.launch();
console.log('Bot ~ \tBot started')

Observer.checkNewEpisodes()
// Observer.checkActiveChats();
