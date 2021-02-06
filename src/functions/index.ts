import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
// import { config } from 'dotenv';
import { Telegraf } from 'telegraf';

// import envs
// config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.start(ctx => ctx.reply(`Welcome!`));

export async function handler(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: '' };
  } catch (e) {
    console.log(e)
    return { statusCode: 400, body: 'This endpoint is meant for bot and telegram communication' };
  }
}
