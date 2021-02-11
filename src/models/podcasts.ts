import { ObjectId } from "mongodb";
import { User } from "telegraf/typings/telegram-types";
import { Show, Episode } from "./spotify";

export class Podcast {
  _id:          ObjectId;
  userInfo:     User;
  showInfo:     Show;
  lastCheck:    Date;
  episodes:     Episode[] = [];
  createdAt:    Date;

  constructor(show: Podcast) {
    this.userInfo = show.userInfo;    // TODO crea costruttore, serve veramente fare tutti questi passaggi ogni volta? rivedere questi passaggi
    this.showInfo = new Show(show.showInfo);
    this.episodes = show.episodes ? show.episodes : [];
    this.createdAt = new Date()
  }

  public get lastEpisode(): Episode {
    return this.episodes.sort((a, b) =>
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    )[0];
  }

  addNewEpisodes(episodes: Episode[]) {
    // if (!this.episodes || !this.episodes.length) {
    //   return this.episodes = episodes;
    // }
    this.episodes.unshift(...episodes);
  }
}
