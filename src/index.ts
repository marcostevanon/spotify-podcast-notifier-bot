import { config } from 'dotenv';
import express from 'express';
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

// Need express to start listening, without heroku make app crash
// https://stackoverflow.com/a/15693371/8622120
const PORT = process.env.PORT;
express()
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
