export interface TelegramLog {
  update_id: number;
  message:   Message;
  createdAt: Date;
}

export interface Message {
  message_id: number;
  from:       From;
  chat:       Chat;
  date:       number;
  text:       string;
  entities:   Entity[];
}

export interface From {
  id:            number;
  is_bot:        boolean;
  first_name:     string;
  last_name:     string;
  username:      string;
  language_code: string;
}

export interface Chat {
  id:         number;
  first_name:  string;
  last_name:  string;
  username:   string;
  type:       string;
}

export interface Entity {
  offset: number;
  length: number;
  type:   string;
}

