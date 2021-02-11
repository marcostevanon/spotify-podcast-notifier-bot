export interface ShowPaginator {
  href:     string;
  items:    Episode[];
  limit:    number;
  next:     string;
  offset:   number;
  previous: null;
  total:    number;
}

export class Show {
  id:                   string;
  name:                 string;
  available_markets:    string[];
  copyrights:           any[];
  description:          string;
  // episodes:             ShowPaginator;
  explicit:             boolean;
  external_urls:        ExternalUrls;
  href:                 string;
  images:               Image[];
  is_externally_hosted: boolean;
  languages:            string[];
  media_type:           string;
  publisher:            string;
  total_episodes:       number;
  type:                 string;
  uri:                  string;
  
  constructor(show: Show) {
    this.id = show.id;
    this.name = show.name;
    this.available_markets = show.available_markets;
    this.copyrights = show.copyrights;
    this.description = show.description;
    this.explicit = show.explicit;
    this.external_urls = show.external_urls;
    this.href = show.href;
    this.images = show.images;
    this.is_externally_hosted = show.is_externally_hosted;
    this.languages = show.languages;
    this.media_type = show.media_type;
    this.publisher = show.publisher;
    this.total_episodes = show.total_episodes;
    this.type = show.type;
    this.uri = show.uri;
  }
}

export class Episode {
  id:                     string;
  name:                   string;
  audio_preview_url:      string;
  description:            string;
  duration_ms:            number;
  explicit:               boolean;
  external_urls:          ExternalUrls;
  href:                   string;
  images:                 Image[];
  is_externally_hosted:   boolean;
  is_playable:            boolean;
  language:               string;
  languages:              string[];
  release_date:           string;
  release_date_precision: string;
  show?:                  Show;
  // showId?:                string;
  type:                   string;
  uri:                    string;
  
  constructor(episode: Episode) {
    this.id = episode.id;
    this.name = episode.name;
    this.audio_preview_url = episode.audio_preview_url;
    this.description = episode.description;
    this.duration_ms = episode.duration_ms;
    this.explicit = episode.explicit;
    this.external_urls = episode.external_urls;
    this.href = episode.href;
    this.images = episode.images;
    this.is_externally_hosted = episode.is_externally_hosted;
    this.is_playable = episode.is_playable;
    this.language = episode.language;
    this.languages = episode.languages;
    this.release_date = episode.release_date;
    this.type = episode.type;
    this.uri = episode.uri;
  }

  public get release_date_formatted(): Date {
    // e.g. 2021-01-10
    const parts = this.release_date.split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }
}

export interface ExternalUrls {
  spotify: string;
}

export interface Image {
  height: number;
  url:    string;
  width:  number;
}
