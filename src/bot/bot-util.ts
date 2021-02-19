import { Telegraf } from "telegraf";
import Telegram from "telegraf/typings/telegram";
import { Chat } from "telegraf/typings/telegram-types";
import { DbServiceFactory } from "../helpers/mongo-helper";
import { SpotifyApiHelper } from "../helpers/spotify-helper";
import { Collections } from "../models/mongo-collections";
import { Podcast } from "../models/podcasts";
import { TelegramLog } from "../models/telegram-log";

export const dbLogger = Telegraf.log(async log => {
  new DbServiceFactory<TelegramLog>()
    .fromCollection(Collections.TELEGRAM_LOG)
    .then(logCollection => logCollection.create(JSON.parse(log)));
})

export const sendToAdmin = (telegram: Telegram, message: string, source?: string): void => {
  if (!process.env.TELEGRAM_ADMIN_ID) { return }
  telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `ADMIN MESSAGE\n${source && `Source: ${source}`}\n${message}`)
}

export const lastCheckToString = (lastCheckDate: Date): string => {
  const lastCheckTime = new Date().getTime() - lastCheckDate.getTime();

  const date = new Date();
  date.setTime(lastCheckTime);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();

  let lastCheckString = '';
  if (hours >= 2) { return '-' }
  if (hours > 0) {
    lastCheckString += `${hours}h `
  }
  if (minutes > 0) {
    lastCheckString += `${minutes}m `
  }
  lastCheckString += `${seconds}s ago`;
  return lastCheckString
}

// https://regex101.com/r/cntAKN/1
export const spotifyUriRegexp = RegExp(/^(https:\/\/open.spotify.com\/(show|episode)\/|spotify:(show|episode):)([a-zA-Z0-9]+)(.*)$/);

/**
 * Verify id and type through spotify api
 */
export const getShowById = async (itemType: 'show' | 'episode', itemId: string): Promise<SpotifyApi.ShowObjectSimplified> => {
  const spotifyHelper = new SpotifyApiHelper();
  const spotifyApi = await spotifyHelper.authorize();

  try {
    if (itemType === 'show') {
      const response = await spotifyApi.getShow(itemId, { market: 'US' });
      delete response.body.episodes;
      return response.body;
    }

    if (itemType === 'episode') {
      const response = await spotifyApi.getEpisode(itemId, { market: 'US' });
      return response.body.show;
    }
  } catch (err) {
    // Id not valid
    throw new Error(err);
  }
}

export const followShow = async (chat: Chat, show: SpotifyApi.ShowObjectSimplified): Promise<void> => {
  const podcastCollection = await new DbServiceFactory<Podcast>()
    .fromCollection(Collections.PODCASTS)

  // check if podcast already exist
  const existingPodcast = (await podcastCollection.find({ "show.id": show.id }))[0];

  // otherwise create it
  if (!existingPodcast) {
    const newPodcast = new Podcast(show);
    newPodcast.subscribers.push(chat);
    await podcastCollection.create(newPodcast);
    return;
  }

  // if podcast already exist
  // check if current user is already following
  const subFound = existingPodcast.subscribers.find(s => s.id === chat.id);
  if (subFound) {
    throw new Error('already_following_error')
  }

  await podcastCollection.addToSubscribers(existingPodcast._id, chat);
}
