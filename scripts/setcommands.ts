import { config } from 'dotenv';
import { Telegraf } from 'telegraf';
import { commands } from '../src/bot/commands';
config();

const telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
telegraf.telegram.setMyCommands(commands)
  .then(ok => ok && console.log('\n> Telegram bot commands set succesfully!'))
  .catch(err => { console.error(err); process.exit(126); });
