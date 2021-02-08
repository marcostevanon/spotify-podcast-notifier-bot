import { NowRequest, NowResponse } from '@vercel/node';
import { Bot } from '../src/bot-replies';

const botApp = new Bot();
const bot = botApp.initBotCommands();

export default async (request: NowRequest, response: NowResponse) => {
  try {
    console.log(request.body)
    await bot.handleUpdate(request.body, response);
    response.status(200).end();
  } catch (e) {
    console.log(e)
    return { statusCode: 400, body: 'This endpoint is meant for bot and telegram communication' };
  }
}
