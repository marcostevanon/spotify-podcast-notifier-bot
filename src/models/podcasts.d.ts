import { ObjectId } from "mongodb";
import { User } from "telegraf/typings/telegram-types";
import { Episode } from "./spotify/spotify-episode";
import { Show } from "./spotify/spotify-show";

interface Podcast {
  _id:          ObjectId;
  userInfo:     User;
  showInfo:     Show,
  lastCheck:    Date;
  lastEpisode:  Episode;
  lastEpisodes: Episode[];
  createdAt:    Date;
}
