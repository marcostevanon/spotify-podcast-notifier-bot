import { differenceBy } from 'lodash';
import { ObjectID } from 'mongodb';
import { Markup, Telegraf } from 'telegraf';
import { User } from 'telegraf/typings/telegram-types';
import { DbService, DbServiceFactory } from '../helpers/mongo-helper';
import { SpotifyAuthHelper } from '../helpers/spotify-helper';
import { Collections } from '../models/mongo-collections';
import { Podcast } from '../models/podcasts';
import { Show, Episode } from '../models/spotify';

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
    console.log('Observer ~ Start checking...')

    const start = Date.now();
    let showChecked = 0;
    let showsCount = 0;

    // TODO non va l'aggiunta di nuovi episodi ad un nuovo podcast
    // TODO rifare il giro completo commentando tutte le parti di codice che non serveno (anche tutte le proprietà nelle classi di spotify che non vengono utiizzate)

    try {
      // Get shows from database ordered by last check date(ASC)
      // --> items with older last check date will be re checked first.
      const shows = await this.getPodcastList();
      showsCount = shows.length;

      for (let show of shows) {
        showChecked++;

        // get updated show data from spotify api
        let newEpisodes = await this.getShowEpisodes(show.showInfo.id);

        // sort by release_date date (ASC, from older to newer)
        newEpisodes = newEpisodes.sort((a, b) => a.release_date_formatted.getTime() - b.release_date_formatted.getTime())

        const episodes = show.episodes;
        if (!episodes || !episodes.length) {
          // means it's the first time a show has been checked or doesn't have episodes...
          // fill 'lastEpisodes' with all episodes returned from api

          show.addNewEpisodes(newEpisodes);
          show.lastCheck = new Date();

          // savo i dati
          await (await this.podcastDb).update(show._id, show);

          // no need to filter and notify all new episodes
          continue;
        }

        // filter new episodes from those present in database
        const filteredEpisodes = await this.filterEpisodes(episodes, newEpisodes);

        // se non ci sono episodi nuovi (continua)
        if (!filteredEpisodes.length) { continue; }

        console.log(`Observer ~ Found ${filteredEpisodes.length} new ${filteredEpisodes.length === 1 ? 'episode' : 'episodes'}`);

        // send send update to subscribed users
        // for (const user of show.subscribedUsers) {
        // TODO cambiare la struttura del db e fare gli script per sistemare la produzione (oppure scrivere una procedura per farlo a mano)
        //   const didSend = await this.sendUpdate(show, filterEpisodes, user);

        //   // if success
        //   if (didSend) {
        //     // --> update db
        //     // update last check date
        //     show.lastCheck = new Date();
        //     show.lastEpisodes.push(filteredEpisodes)
        //     await this.updateShow(show);  // funzione che fa l'update dell'oggetto a database;
        //   }
        // }
        // finito
      }
    } catch (err) {
      console.log(err);
    }

    console.log(`Observer ~ Checked: ${showChecked}/${showsCount} - ${(Date.now() - start) / 1000}s`,)
  }

  static async getPodcastList(): Promise<Podcast[]> {
    // inizialize db connection
    const shows = (await this.podcastDb);

    return shows.find({
      _id: new ObjectID('5f8c15699b69bfb05645f3ef')  // TODO remove
    },
      {
        orderby: { lastCheck: 1 },  // asc order
        limit: 5000
      })
      .then(shows => shows.map(show => new Podcast(show)))

    //#region // ! old query
    // // query that returns documents udated more than 5 minutes ago (avoid high traffic to Spotify APIs)
    // const beforeLastCheck = new Date();
    // const minimumRetryDelay = 0;
    // // const minimumRetryDelay = 5;
    // beforeLastCheck.setMinutes(beforeLastCheck.getMinutes() - minimumRetryDelay);

    // return this.podcastsDb.find({
    //   $or: [
    //     { lastCheck: { $exists: false } },
    //     { lastCheck: { $lt: beforeLastCheck } }]
    // });
    //#endregion
  }

  static async getShowEpisodes(showId: string): Promise<Episode[]> {
    try {
      // get data from spotify api
      const spotifyService = new SpotifyAuthHelper();
      const episodes = await spotifyService.getShowsEpisodes(showId);
      return episodes.items.map(item => new Episode(item));
    } catch (err) {
      // Spotify API rate limit exceeded: code 429
      throw new Error(err)
    }
  }

  static async filterEpisodes(oldEpisodes: Episode[], newEpisodes: Episode[]): Promise<Episode[]> {
    return differenceBy(newEpisodes, oldEpisodes, 'id');

    //#region // ! old function
    // const lastEpisodeByDate = oldEpisodes.sort((a, b) => {
    //   return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    // })
    // podcast.lastEpisodes.unshift(...differenceResult);
    // podcast.lastEpisode = lastEpisodeByDate[0];
    //#endregion
  }

  static async getNewEpisodesFromPodcast(podcast: Podcast): Promise<Episode[]> {



    let episodesToSend: Episode[] = [];

    // if (!podcast.lastEpisodes || !podcast.lastEpisodes.length) {
    //   // means it's the first time a show has been checked or doesn't have episodes...
    //   podcast.lastEpisode = showResponse.items[0];
    //   podcast.lastEpisodes = [...showResponse.items];
    // } else {
    //   const newEpisodes = showResponse.items;
    //   const pastEpisodes = podcast.lastEpisodes;
    //   const differenceResult = differenceWith(newEpisodes, pastEpisodes, isEqual);  // TODO isEqual compara gli oggetti per in ogni loro proprietà, se cambia l'immagine l'utente viene notificato una volta in più

    //   const lastEpisodeByDate = podcast.lastEpisodes.sort((a, b) => {
    //     return new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    //   })

    //   podcast.lastEpisodes.unshift(...differenceResult);
    //   podcast.lastEpisode = lastEpisodeByDate[0];

    //   episodesToSend = differenceResult;
    // }
    // podcast.lastCheck = new Date();
    // // await this.podcastsDb.update(podcast._id, podcast); // TODO non va bene che aggiorni il db senza prima mandare i messaggi...?
    // // TODO eliminare i dati degli utenti che hanno bloccato il bot

    return episodesToSend;
  }

  /**
   * Send a message to the user with the new episode infos
   */
  static async sendUpdate(show: Show, episode: Episode, user: User) {
    const updateMessage = `
New episode available for: ${show.name}
Title: ${episode.name}
Release Date: ${episode.release_date}
`.trim()

    const telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    await telegraf.telegram.sendMessage(user.id, updateMessage,
      Markup.inlineKeyboard([
        Markup.button.url('Podcast Page', show.external_urls.spotify),
        Markup.button.url('Play Episode', episode.external_urls.spotify),
      ])
    );
    console.log('Observer -> Notification sent for:', show.name);
  }

  static async checkActiveChats() {
    // fare un aggregare di tutti gli utenti presenti a db (compresi i gruppi) 
    // inviare un chatAction=typing 
    // se il risultato eee1 un 403 (bot bloccato dall'utente) rimuovere i dati relativi a quell'utente dal db

    const { telegram } = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    await telegram.sendChatAction(process.env.TELEGRAM_ADMIN_ID, 'typing');

  }
}
