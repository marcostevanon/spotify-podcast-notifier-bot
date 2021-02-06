import { differenceWith, isEqual } from 'lodash';
import cron from 'node-cron';
import { Context, Markup, Telegraf } from 'telegraf';
import { Collections } from '../models/mongo-collections';
import { Podcast } from '../models/podcasts';
import { Episode } from '../models/spotify/spotify-episode';
import { ShowPaginator } from '../models/spotify/spotify-show';
import { DbService, DbServiceFactory } from '../helpers/mongo-helper';
import { SpotifyAuthHelper } from '../helpers/spotify-helper';

export class Scheduler {
  protected telegraf: Telegraf<Context>;
  protected spotify: SpotifyAuthHelper;

  private _podcastCollection: Promise<DbService<Podcast>>;
  protected get podcastDb(): Promise<DbService<Podcast>> {
    if (!this._podcastCollection) {
      this._podcastCollection = new DbServiceFactory<Podcast>()
        .fromCollection(Collections.PODCASTS)
    }
    return this._podcastCollection;
  };

  constructor(instances?: {
    telegrafInstace?: Telegraf<Context>,
    spotifyInstance?: SpotifyAuthHelper
  }) {
    // initialize telegraf (just form messages sending)
    this.telegraf = instances?.telegrafInstace
      ? instances.telegrafInstace
      : new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

    // initialize spotify helper
    this.spotify = instances?.spotifyInstance
      ? instances.spotifyInstance
      : new SpotifyAuthHelper();
  }

  // periodically check for new episodes
  startPolling() {
    cron.schedule('*/2 * * * *', async () => {
      const start = Date.now();

      // query that returns documents udated more than 5 minutes ago (avoid high traffic to Spotify APIs)
      const beforeLastCheck = new Date();
      const minimumRetryDelay = 5;
      beforeLastCheck.setMinutes(beforeLastCheck.getMinutes() - minimumRetryDelay);

      const shows = await (await this.podcastDb).find({
        $or: [
          { lastCheck: { $exists: false } },
          { lastCheck: { $lt: beforeLastCheck } }]
      });

      const promises = shows.map(show => this.notifyNewEpisodes(show));
      await Promise.all(promises)
        .catch(err => console.log(JSON.stringify(err, null, 2)));

      console.log(`[${(new Date()).toISOString()}] Scheduler -> Checked: ${promises.length} - Take: ${(Date.now() - start) / 1000}s`,)
    });
  }

  async notifyNewEpisodes(podcast: Podcast): Promise<void> {
    // every promise execute following operations

    let showResponse: ShowPaginator;
    try {
      // get data from spotify api
      showResponse = await this.spotify.getShowsEpisodes(podcast.showInfo.id);
    } catch (err) {
      // Spotify API rate limit exceeded: code 429
      console.log(err);
    }

    // if api does not return data (API limit or other) -> return void -> next check will pass
    if (!showResponse || !showResponse.items || !showResponse.items.length) {
      return;
    }

    let episodesToSend: Episode[] = [];

    if (!podcast.lastEpisodes || !podcast.lastEpisodes.length) {
      // means it's the first time a show has been checked or doesn't have episodes...
      podcast.lastEpisode = showResponse.items[0];
      podcast.lastEpisodes = [...showResponse.items];
    } else {
      const newEpisodes = showResponse.items;
      const pastEpisodes = podcast.lastEpisodes;
      const differenceResult = differenceWith(newEpisodes, pastEpisodes, isEqual);

      const lastEpisodeByDate = podcast.lastEpisodes.sort((a, b) => {
        return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      })

      podcast.lastEpisodes.unshift(...differenceResult);
      podcast.lastEpisode = lastEpisodeByDate[0];

      episodesToSend = differenceResult;
    }
    podcast.lastCheck = new Date();
    await (await this.podcastDb).update(podcast._id, podcast);

    if (episodesToSend.length) {
      console.log('Scheduler -> Notification sent for:', podcast.showInfo.name);
    }
    for (let i = episodesToSend.length - 1; i >= 0; i--) {
      const episode = episodesToSend[i];
      const updateMessage = `
New episode available for: ${podcast.showInfo.name}\n
Title: ${episode.name}
Release Date: ${episode.release_date}
`.trim()

      await this.telegraf.telegram.sendMessage(podcast.userInfo.id, updateMessage,
        Markup.inlineKeyboard([
          Markup.button.url('Podcast Page', podcast.showInfo.external_urls.spotify),
          Markup.button.url('Play Episode', episode.external_urls.spotify),
        ])
        // Extra
        //   .HTML(true)
        //   .markup((m: Markup) =>
        //     m.inlineKeyboard([
        //       Markup.urlButton('Podcast Page', podcast.showInfo.external_urls.spotify),
        //       Markup.urlButton('Play Episode', episode.external_urls.spotify),
        //     ], {})
        //   )
      );
    }
  }
}
