import { ObjectId } from "mongodb";
import { Chat } from "telegraf/typings/telegram-types";

export class Podcast {
  _id:         ObjectId;
  show:        SpotifyApi.ShowObjectSimplified;
  episodes:    SpotifyApi.EpisodeObjectSimplified[] = [];
  subscribers: Chat[] = [];
  lastCheck?:  Date;
  createdAt:   Date;

  constructor(show: SpotifyApi.ShowObjectSimplified) {
    this.show = show;
    this.createdAt = new Date()
  }
}
