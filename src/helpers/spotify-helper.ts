import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import { Episode, Show, ShowPaginator } from '../models/spotify';

export class SpotifyAuthHelper {
  protected clientId = process.env.SPOTIFY_CLIENT_ID;
  protected clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  protected clientCredentials: string;
  protected spotifyAuthConfig: AxiosRequestConfig;
  protected spotifyAuthResponse: SpotifyAuthResponse & { expire_date: Date };

  constructor() {
    if (!this.clientId) {
      throw new Error('Missing SPOTIFY_CLIENT_ID');
    }
    if (!this.clientSecret) {
      throw new Error('Missing SPOTIFY_CLIENT_SECRET');
    }

    // Spotify api require a Basic authentication with base64 encoded credentials
    // https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
    this.clientCredentials = Buffer
      .from(`${this.clientId}:${this.clientSecret}`)
      .toString('base64');

    this.spotifyAuthConfig = {
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': `Basic ${this.clientCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify({ grant_type: 'client_credentials' })
    };

    this.authorize().then();
  }

  protected async authorize() {
    return axios(this.spotifyAuthConfig)
      .then((res: AxiosResponse<SpotifyAuthResponse>) => {
        const date = new Date();
        date.setSeconds(date.getSeconds() + res.data.expires_in);
        this.spotifyAuthResponse = { ...res.data, expire_date: date };
      })
      .catch(err => { throw new Error(err); })
  }

  protected async getRequest(url: string) {
    if (this.isTokenEspired()) {
      await this.authorize();
    }

    return axios({
      method: 'GET',
      url,
      headers: this.generateHeaders()
    })
      .then(res => res.data)
      .catch(({ response }) => {
        const errorData = {
          response: response.data.error,
          retryAfter: +response.headers['retry-after'],
          retryAfterPrecision: 'seconds'
        };
        throw new Error(errorData.response)
      })
  }

  protected isTokenEspired() {
    return !this.spotifyAuthResponse || this.spotifyAuthResponse.expire_date.getTime() - new Date().getTime() < 0
  }

  protected generateHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `${this.spotifyAuthResponse.token_type} ${this.spotifyAuthResponse.access_token}`
    }
  }

  // market is required with client-credentials-flow
  // https://community.spotify.com/t5/Spotify-for-Developers/Search-for-shows-returns-an-array-of-null/td-p/4953378
  async getEpisode(episodeId: string): Promise<Episode> {
    const url = `https://api.spotify.com/v1/episodes/${episodeId}?market=US`
    return this.getRequest(url);
  }

  async getShowsEpisodes(showId: string, limit = 10): Promise<ShowPaginator> {
    let url = `https://api.spotify.com/v1/shows/${showId}/episodes?market=US`
    if (limit) {
      url += `&limit=${limit}`;
    }

    return this.getRequest(url);
  }

  async getShow(showId: string): Promise<Show> {
    const url = `https://api.spotify.com/v1/shows/${showId}?market=US`
    return this.getRequest(url);
  }

  // verify id and type through spotify api
  async getShowByUrl(url: string): Promise<Show> {

    // Possible incoming text for podcast show
    // 1 - URL: https://open.spotify.com/show/43A9fUmUbLYaHKSi1lAtn5?si=Y5kyuclUQjunk6iEpyEYyA
    // 2 - URI: spotify:show:43A9fUmUbLYaHKSi1lAtn5
    // 3 - ID : 43A9fUmUbLYaHKSi1lAtn5

    // Possible incoming text for show episodes
    // 1 - URL: https://open.spotify.com/episode/43oawkAzeeIJ2QqxOA7bui?si=1OvXEM4TT8uvnDz8NmGF_A
    // 2 - URI: spotify:episode:43oawkAzeeIJ2QqxOA7bui
    // 3 - ID : 43oawkAzeeIJ2QqxOA7bui

    let spotifyItem: SpotifyItem;
    try {
      let id = url.match(RegExp(/([0-9A-Z])\w+/g))[0];
      let types = url.match(RegExp(/(show|episode)/g));
      let type;
      if (types[0]) {
        type = types[0];
      }

      spotifyItem = { id, type };

      if (spotifyItem.type === 'show') {
        const show = await this.getShow(spotifyItem.id);
        return show;
      }

      if (spotifyItem.type === 'episode') {
        const episode = await this.getEpisode(spotifyItem.id);
        return episode.show;
      }

      return null;
    } catch (err) {
      // Link not valid
      throw new Error(err);
    }
  }
}

interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface SpotifyItem {
  id: string;
  type?: 'show' | 'episode';
}
