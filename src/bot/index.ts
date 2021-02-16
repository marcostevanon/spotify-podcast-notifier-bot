import { Context, Telegraf } from 'telegraf';
import { InlineQueryResultArticle } from 'telegraf/typings/telegram-types';
import { DbServiceFactory } from '../helpers/mongo-helper';
import { SpotifyApiHelper } from '../helpers/spotify-helper';
import { Collections } from '../models/mongo-collections';
import { Podcast } from '../models/podcasts';
import * as BotUtil from './bot-util';
import * as messages from './reply-messages';

export class Bot {
  public telegraf: Telegraf<Context>;

  constructor() {
    // initialize telegraf
    this.telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.telegraf.use(BotUtil.dbLogger);
    this.init();
  }

  launch() {
    this.telegraf.launch()
  }

  /**
   * Declare bot commands functions
   */
  init() {

    if (process.env.NODE_ENV !== 'production') {
      this.telegraf.on('message', (ctx, next) => {
        if (!process.env.TELEGRAM_ADMIN_ID) { return next() }
        if ('text' in ctx.message) {
          const text = ctx.message.text;
          console.log('Bot say\t', text);
        }
        next();
      });
    }

    this.telegraf.command('start', async ctx => {
      await ctx.replyWithHTML(messages.welcome_1({ username: ctx.chat.type === 'private' && ctx.from.first_name }));
      await ctx.replyWithHTML(messages.welcome_2);
    });

    this.telegraf.command('help', async ctx => {
      ctx.replyWithHTML(messages.help, { disable_web_page_preview: true })
    });

    this.telegraf.command('list', async ctx => {
      const tempMessage = await ctx.reply('Searching...');
      await this.telegraf.telegram.sendChatAction(ctx.chat.id, 'typing')

      try {
        const podcastCollection = await new DbServiceFactory<Podcast>()
          .fromCollection(Collections.PODCASTS)

        const podcastUserList = await podcastCollection.find({ 'subscribers.id': ctx.chat.id });
        if (!podcastUserList || !podcastUserList.length) {
          await ctx.deleteMessage(tempMessage.message_id);
          await ctx.reply(messages.list_no_podcast);
          return;
        }

        const podcastListMessages = podcastUserList.map(podcast => {
          if (!podcast.lastCheck) {
            return messages.list_podcast_unverified({
              title: podcast.show.name
            });
          }

          return messages.list_podcast_verified({
            title: podcast.show.name,
            publisher: podcast.show.publisher,
            lastRelease: podcast.lastEpisode.release_date,
            lastCheck: BotUtil.lastCheckToString(podcast.lastCheck),
            lastEpisodeUrl: podcast.lastEpisode.external_urls.spotify
          });
        })

        const listReply = messages.list_podcasts({ messages: podcastListMessages });

        await ctx.deleteMessage(tempMessage.message_id);
        await ctx.replyWithHTML(listReply, { disable_web_page_preview: true });
        return;

      } catch (err) {
        BotUtil.sendToAdmin(this.telegraf.telegram, err.stack)
        await ctx.deleteMessage(tempMessage.message_id);
        await ctx.replyWithHTML(messages.generic_error);
      }
    });

    this.telegraf.hears(BotUtil.spotifyUriRegexp, async ctx => {
      const [, , , matchType, matchId] = ctx.match;

      const tempMessage = await ctx.reply('Verifing...')

      try {
        let show = await BotUtil.getShowById(matchType as 'show' | 'episode', matchId);

        await BotUtil.followShow(ctx.chat, show);

        // follow success
        await ctx.deleteMessage(tempMessage.message_id);
        await ctx.reply(messages.track_success({ show_name: show.name }));

      } catch (err) {
        await ctx.deleteMessage(tempMessage.message_id);

        // the user is already following the podcast
        if (err.message === 'already_following_error') {
          return ctx.reply(messages.already_following_error)
        }

        // others errors
        BotUtil.sendToAdmin(this.telegraf.telegram, err.stack);
        return ctx.reply(messages.generic_error)
      }
    });

    this.telegraf.on('inline_query', async ctx => {
      try {
        if (!ctx.inlineQuery.query) { return }

        const spotifyHelper = new SpotifyApiHelper();
        const spotifyApi = await spotifyHelper.authorize();
        const showsResponse = await spotifyApi.search(ctx.inlineQuery.query, ['show'], { market: 'US', limit: 50 });
        const foundShows = showsResponse.body.shows;

        if (foundShows.items.length === 0) {
          return ctx.answerInlineQuery([{
            type: 'article',
            id: 'not-found-404',
            title: '🤔 Nothing found!',
            description: 'Search something different',
            input_message_content: {
              message_text: `You searched for '${ctx.inlineQuery?.query}' but nothing has be found! 🤔`
            }
          }]);
        }

        const res: InlineQueryResultArticle[] = foundShows.items.map(({ id, name, publisher, images, external_urls: { spotify } }) => ({
          type: 'article', id,
          title: name,
          description: publisher,
          thumb_url: images[2].url,
          input_message_content: { message_text: spotify },
          url: spotify
        }))
        return ctx.answerInlineQuery(res);

      } catch (err) {

        BotUtil.sendToAdmin(this.telegraf.telegram, err.stack);
        return ctx.answerInlineQuery([{
          type: 'article',
          id: 'internal-error-500',
          title: '😵 Something went wrong! 😵',
          description: 'Admin has been notified, try again later!',
          input_message_content: {
            message_text: 'Sorry for the inconvenience, try again later!'
          }
        }])
      }
    });

  }
}
