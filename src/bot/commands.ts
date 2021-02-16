import { BotCommand } from 'telegraf/typings/telegram-types';

export const commands: BotCommand[] = [
  { command: 'track', description: 'track a new podcast' },
  { command: 'list', description: 'check podcasts you are following' },
  { command: 'remove', description: 'remove a podcast' },
  { command: 'cancel', description: 'cancel the current command' },
  { command: 'help', description: 'need help?' }
];
