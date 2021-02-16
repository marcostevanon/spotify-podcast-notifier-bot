import { config } from 'dotenv';
import { commands } from './commands';
config()

export const help = `
⚙️ Commands:

/track - ${commands.find(c => c.command === 'track').description}
/list - ${commands.find(c => c.command === 'list').description}
/remove - ${commands.find(c => c.command === 'remove').description}
/cancel - ${commands.find(c => c.command === 'cancel').description}


🔎 Search:

Use inline search to find podcast:
- type @${process.env.TELEGRAM_BOT_USERNAME} and name of your favorite podcast


⛔️ I work only with Spotify, don't try to track others platform podcast, they won't works..

❇️ Want to contribute, suggest a feature or report a bug? Please go <a href="https://github.com/marcostevanon/spotify-podcast-notifier-bot">HERE</a>
`.trim();

export const welcome_1 = ($: { username: string }) => `
👋 Hi${$.username ? ` ${$.username}` : ''}, I can help you keeping up to date with new podcast releases!
`.trim();

export const welcome_2 = `
✅ What you need to know

1️⃣ To add a new podcast type /track

2️⃣ If you don't understand something or you have a problem with the bot, type /help.

3️⃣ Yes, the bot work only with Spotify, don't try to track others platform podcast, they won't works..
`.trim();

export const track_success = ($: { show_name: string }) => `
Got it! 🎉
I will send you a message when ${$.show_name} release a new episode!
`.trim();

export const list_podcast_verified = ($) => `
🎧 ${$.title}
🎤 ${$.publisher}
📆 Last Release ${$.lastRelease}
🔎 Last check ${$.lastCheck}
🔊 Listen <a href="${$.lastEpisodeUrl}">last episode HERE</a>
`.trim();

export const list_podcast_unverified = ($: { title: any; }) => `
🎧 ${$.title}
🔎 <i>Pending verification...</i>
`.trim();

export const list_podcasts = ($: { messages: string[] }) => `
You're following ${$.messages.length} ${$.messages.length === 0 ? 'podcast' : `podcasts`}

${$.messages.join(`\n\n`)}
`.trim();

export const list_no_podcast = `
🤔 You're not following any podcast. Start by using the command /track
`.trim();

export const generic_error = `
😵 Something went wrong! 😵
Admin has been notified, try again later!
`.trim();

export const already_following_error = `
Oops, you are already tracking this podcast...
I will notify you when new episodes are available!
`.trim();
