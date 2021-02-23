import { VercelRequest, VercelResponse } from '@vercel/node';
import { Bot } from '../src/bot';

const botApp = new Bot();
const bot = botApp.init();

export default async (request: VercelRequest, response: VercelResponse) => {
  try {
    await bot.handleUpdate(request.body, response);
    console.log('webhook payload', request.body);
    response.status(200).end();
  } catch (err) {
    console.log(err)
    return {
      statusCode: 400,
      body: 'This endpoint is meant for bot and telegram communication'
    };
  }
}
