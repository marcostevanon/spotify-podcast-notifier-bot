import SpotifyWebApi from 'spotify-web-api-node';
import { Telegraf } from 'telegraf';
import * as BotUtil from '../bot/bot-util';

export class SpotifyApiHelper {
  protected clientId = process.env.SPOTIFY_CLIENT_ID;
  protected clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  protected spotifyApi: SpotifyWebApi;
  protected tokenExpirationEpoch: number = 0;

  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: this.clientId,
      clientSecret: this.clientSecret
    });
  }

  async authorize(): Promise<SpotifyWebApi> {
    try {
      const now = new Date().getTime() / 1000;

      // is token valid
      if (this.tokenExpirationEpoch - 300 > now) {
        // token is still valid
        return this.spotifyApi;
      }

      // Retrieve an access token
      // https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
      const response = await this.spotifyApi.clientCredentialsGrant();

      // Save the access token so that it's used in future calls
      this.spotifyApi.setAccessToken(response.body.access_token);

      this.tokenExpirationEpoch = now + response.body.expires_in;
      return this.spotifyApi;
    } catch (error) {
      const message = '[SPOTIFY API] Access token error'
      console.error(message, error.message);

      // notify admin
      const telegraf = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      BotUtil.sendToAdmin(telegraf.telegram, error, 'SpotifyApi');

      throw new Error(message)
    }
  }
}
