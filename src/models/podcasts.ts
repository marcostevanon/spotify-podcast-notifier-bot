import { ObjectId } from "mongodb";
import { Chat } from "telegraf/typings/telegram-types";

export class Podcast {
  _id:         ObjectId;
  show:        SpotifyApi.ShowObjectSimplified;
  episodes:    SpotifyApi.EpisodeObjectSimplified[] = [];
  subscribers: Chat[] = [];
  lastCheck?:  Date;
  createdAt:   Date;
  get lastEpisode(): SpotifyApi.EpisodeObjectSimplified {
    const sortedEpisodes = this.episodes.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    return sortedEpisodes[0];
  }

  constructor(show: SpotifyApi.ShowObjectSimplified) {
    this.show = show;
    this.createdAt = new Date()
  }
}
