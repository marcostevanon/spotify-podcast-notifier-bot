import { config } from 'dotenv';
import { Scheduler } from './helpers/scheduler';
import { BotApp } from './telegram/bot';

// import envs
config();

// bot init
const botApp = new BotApp();
botApp.initBotCommands();
console.log('Bot started!');

const scheduler = new Scheduler();
scheduler.startPolling();
console.log('Scheduler started!');
