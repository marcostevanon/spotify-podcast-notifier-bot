import { Context, Telegraf } from 'telegraf';
import { InputTextMessageContent, Message } from 'telegraf/typings/telegram-types';
import { DbService, DbServiceFactory } from '../helpers/mongo-helper';
import { Scheduler } from '../observer';
import { SpotifyAuthHelper } from '../helpers/spotify-helper';
import { Collections } from '../models/mongo-collections';
import { Podcast } from '../models/podcasts';
import { Show } from '../models/spotify/spotify-show';
import { TelegramLog } from '../models/telegram-log';

const help_message = `Send me a link of a Spotify podcast or an episode.\nI will notify you when a new episode is realeased! 🎉`;

export class Bot {
  protected logCollection: DbService<TelegramLog>
  public telegraf: Telegraf<Context>;
  protected spotify: SpotifyAuthHelper;
  protected podcastCollection: DbService<Podcast>;

  constructor() {
    // initialize spotify
    this.spotify = new SpotifyAuthHelper()

    // initialize telegraf
    this.telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.telegraf.use(this.dbLogger);
  }

  initBotCommands() {
    this.telegraf.on('message', (ctx, next) => {
      if (!process.env.TELEGRAM_ADMIN_ID) { next() }
      if ('text' in ctx.message) {
        const text = ctx.message.text;
        if (ctx.from.id !== +process.env.TELEGRAM_ADMIN_ID) {
          ctx.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `[${ctx.from.id}] ${ctx.from.username} - ${ctx.from.first_name} ${ctx.from.last_name} (${ctx.from.language_code})\n${text}`, { disable_web_page_preview: true });
        }
      }
      next();
    });

    this.telegraf.start(ctx => ctx.reply(`Welcome!\n${help_message}`, { parse_mode: 'HTML' }));

    this.telegraf.command('get_podcast_list', async ctx => {
      const temp_message = await ctx.reply('Searching...')

      try {

        // ensure db connection
        if (!this.podcastCollection) {
          this.podcastCollection = await new DbServiceFactory<Podcast>()
            .fromCollection(Collections.PODCASTS)
        }
        const podcastUserList = await this.podcastCollection.find({ "userInfo.id": ctx.from.id })
        if (!podcastUserList || !podcastUserList.length) {
          return this.editMessage(ctx, temp_message, 'Mmm, it looks like you\'re not tracking any podcasts! 🤔\nPress /help for further info')
        }

        const podcastUserListText = podcastUserList.map(podcast => {
          const title = podcast.showInfo.name;
          let text_message = `\n\nTitle: ${title}`;

          if (!podcast.lastEpisode) {
            text_message += `\n<i>Pending verification...</i>`;
            return text_message;
          }

          const last_release = podcast.lastEpisode.release_date;
          const last_episode_url = podcast.lastEpisode.external_urls.spotify;
          text_message += `\nLast Release: ${last_release}\nListen <a href="${last_episode_url}">last episode HERE</a>`;
          return text_message;
        });

        const message_text = `You are tracking the following podcasts: ${podcastUserListText.join('')}`
        this.editMessage(ctx, temp_message, message_text, { message_text, parse_mode: 'HTML', disable_web_page_preview: true });

      } catch (err) {
        this.sendToAdmin(ctx, err.stack)
        this.editMessage(ctx, temp_message, 'Something went wrong! 😔 \nAdmin has been notified, try again later!');
      }
    });

    this.telegraf.help(ctx => ctx.reply(help_message, { parse_mode: 'HTML' }));

    this.telegraf.on('text', async ctx => {

      const not_valid_link_message = 'This is not a valid link! 😔\n\nIf you need help use /help'

      let show: Show;
      try {
        const urlRegExp = RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm);
        const podcastUrl = ctx.message.text.match(urlRegExp)[0];

        show = await this.spotify.getShowByUrl(podcastUrl);
        if (!show) {
          return ctx.reply(not_valid_link_message)
        }
      } catch (err) {
        return ctx.reply(not_valid_link_message)
      }

      const temp_message = await ctx.reply('Verifing...')

      const newPodcast: Partial<Podcast> = {
        createdAt: new Date(),
        showInfo: show,
        userInfo: ctx.from
      }

      try {

        // ensure db connection
        if (!this.podcastCollection) {
          this.podcastCollection = await new DbServiceFactory<Podcast>()
            .fromCollection(Collections.PODCASTS)
        }

        // check if podcast already exist for current user
        const existingPodcast = await this.podcastCollection.find({
          "userInfo.id": newPodcast.userInfo.id,
          "showInfo.id": newPodcast.showInfo.id
        })

        if (existingPodcast && existingPodcast.length > 0) {
          return this.editMessage(ctx, temp_message, `Oops, you are already tracking this podcast!`)
        }

        const podcastCreated = await this.podcastCollection.create(newPodcast)
        this.sendToAdmin(ctx, `NEW PODCAST - ${podcastCreated.showInfo.name}`);
        console.log('NEW PODCAST -', podcastCreated.showInfo.name);

        this.editMessage(ctx, temp_message, 'Success! \nYou will receive a message when new episode is released! 🎉');

        await new Scheduler({
          telegrafInstace: this.telegraf,
          spotifyInstance: this.spotify
        }).notifyNewEpisodes(podcastCreated);

        return;
      } catch (err) {
        this.sendToAdmin(ctx, err.stack);
        this.sendToAdmin(ctx, 'data ref: ' + JSON.stringify(newPodcast, null, 2));
        this.editMessage(ctx, temp_message, 'Something went wrong! 😔 \nAdmin has been notified, try again later!');
        return;
      }
    });

    // this.telegraf.launch();  // no webhook version
    return this.telegraf;
  }

  protected editMessage(ctx: Context, message: Message, newText: string, extra?: InputTextMessageContent) {
    return ctx.telegram.editMessageText(message.chat.id, message.message_id, null, newText, extra);
  }

  protected dbLogger = Telegraf.log(async log => {
    // ensure db connection
    if (!this.logCollection) {
      this.logCollection = await new DbServiceFactory<TelegramLog>()
        .fromCollection(Collections.TELEGRAM_LOG)
    }

    this.logCollection.create(JSON.parse(log));
  })

  protected sendToAdmin(ctx: Context, message: string) {
    if (!process.env.TELEGRAM_ADMIN_ID) { return }
    ctx.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, message)
  }
}
