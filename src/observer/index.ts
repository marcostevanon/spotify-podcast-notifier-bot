import { assign, differenceBy } from 'lodash';
import { Markup, Telegraf } from 'telegraf';
import { Chat } from 'telegraf/typings/telegram-types';
import * as messages from '../bot/reply-messages';
import { DbService, DbServiceFactory } from '../helpers/mongo-helper';
import { SpotifyApiHelper } from '../helpers/spotify-helper';
import { Collections } from '../models/mongo-collections';
import { Podcast } from '../models/podcasts';

export class Observer {
  private static _podcastCollection: Promise<DbService<Podcast>>;
  protected static get podcastDb(): Promise<DbService<Podcast>> {
    if (!this._podcastCollection) {
      this._podcastCollection = new DbServiceFactory<Podcast>()
        .fromCollection(Collections.PODCASTS)
    }
    return this._podcastCollection;
  };

  static async checkNewEpisodes() {
    console.log('Observer ~ Start checking podcasts...')

    const start = Date.now();
    let showChecked = 0;
    let showsCount = 0;

    try {
      // Get podcasts from database ordered by last check date(ASC)
      // --> items with older last check date will be re-checked first.
      const podcastList = await this.getPodcastList();
      showsCount = podcastList.length;

      for (let podcast of podcastList) {
        showChecked++;

        // get updated show data from spotify api
        // it also contains last 50 episodes
        const updatedShow = await this.getShowFromSpotify(podcast.show.id);
        let newEpisodes = updatedShow.episodes.items;
        delete updatedShow.episodes;

        // update show infos
        podcast.show = assign(podcast.show, updatedShow);

        // sort by release_date date (DESC, from newer to older)
        newEpisodes = newEpisodes.sort((a, b) =>
          this.parseReleaseDate(b.release_date).getTime() - this.parseReleaseDate(a.release_date).getTime())

        const episodes = podcast.episodes;
        if (!episodes || !episodes.length) {
          // means it's the first time a show has been checked or doesn't have episodes...
          // fill 'episodes' with all episodes returned from api

          if (!podcast.episodes) {
            podcast.episodes = [];
          }
          podcast.episodes.unshift(...newEpisodes);
          podcast.lastCheck = new Date();

          console.log(`Observer ~ Saved ${newEpisodes.length} new ${newEpisodes.length === 1 ? 'episode' : 'episodes'} for show: '${podcast.show.name}'`);

          // save data to db
          await (await this.podcastDb).update(podcast._id, podcast);

          // no need to filter and notify all new episodes
          continue;
        }

        // filter new episodes from those present in database
        const filteredEpisodes = await this.filterEpisodes(episodes, newEpisodes);

        // no new episodes, continue
        if (!filteredEpisodes.length) { continue; }

        console.log(`Observer ~ Found ${filteredEpisodes.length} new ${filteredEpisodes.length === 1 ? 'episode' : 'episodes'} for show: '${podcast.show.name}'`);

        // send update to every subscribed users for every new episode
        for (const ep of filteredEpisodes) {
          for (const sub of podcast.subscribers) {
            await this.sendUpdate(podcast.show, ep, sub);
          }
        }

        // if every notification is send with success
        // --> update db

        // add new episode to the beginning of the episodes array
        podcast.episodes.unshift(...filteredEpisodes);

        // update last check date
        podcast.lastCheck = new Date();

        // save data to db
        await (await this.podcastDb).update(podcast._id, podcast);

        // end
      }
    } catch (err) {
      console.log(err);
    }

    console.log(`Observer ~ Checked: ${showChecked}/${showsCount} - ${(Date.now() - start) / 1000}s`,)
  }

  static async getPodcastList(): Promise<Podcast[]> {
    // inizialize db connection
    const podcastCollection = (await this.podcastDb);
    return podcastCollection.find({}, {
      orderby: { lastCheck: 1 },  // asc order
      limit: +process.env.CHECK_LIMIT_NUMBER || 50
    });
  }

  static async getShowFromSpotify(showId: string): Promise<SpotifyApi.ShowObjectFull> {
    try {
      // get data from spotify api
      const spotifyHelper = new SpotifyApiHelper();
      const spotifyApi = await spotifyHelper.authorize();
      const show = await spotifyApi.getShow(showId, { market: 'US' });
      return show.body;
    } catch (err) {
      // Spotify API rate limit exceeded: code 429
      throw new Error(err)
    }
  }

  static parseReleaseDate(release_date: string): Date {
    // release_date -> e.g. 2021-01-10
    const parts = release_date.split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  static async filterEpisodes(
    oldEpisodes: SpotifyApi.EpisodeObjectSimplified[],
    newEpisodes: SpotifyApi.EpisodeObjectSimplified[]
  ): Promise<SpotifyApi.EpisodeObjectSimplified[]> {
    return differenceBy(newEpisodes, oldEpisodes, 'id');
  }

  // Send a message to the user with the new episode infos
  static async sendUpdate(show: SpotifyApi.ShowObjectSimplified, episode: SpotifyApi.EpisodeObjectSimplified, chat: Chat) {
    const message = messages.new_podcast_notification({
      showName: show.name,
      episodeName: episode.name,
      lastRelease: episode.release_date
    })

    const telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    await telegraf.telegram.sendMessage(chat.id, message,
      Markup.inlineKeyboard([
        Markup.button.url('Podcast Page', show.external_urls.spotify),
        Markup.button.url('Play Episode', episode.external_urls.spotify),
      ])
    );
    console.log('Observer -> Notification sent to:', chat.id);
  }

  static async checkActiveChats() {
  }
}
