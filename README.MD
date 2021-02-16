# Spotify Podcast Notifier Bot (for telegram)
## Setup project
``` zsh
npm install
```
Create a new `.env` file based on `.env.example` and follow the instructions. This file will be used by the 'dotenv' library to set envs in the node environment. For this project these envs are used only in locale development environment.

---
## Start development
The project is divided in 3 parts
- bot message handler (api functions) - /api
- observer (spotify scraper) - /src/observer
- frontend (react app) - /src/frontend

Every part can be started with a specific command (see package.json),<br />to start all parts type 
```
npm start
```

---
## Deploy: The Vercel solution
### Staging
This project use [vercel](https://vercel.com) as deployment solution. Vercel create production and staging environments to preview the build before appling to production.

Create a Vercel account and type `vercel deploy` on the terminal to login and start a deploy in preview mode.<br>or run
```
npm run deploy
```

### Production
Firts of all, in [Vercel console](https://vercel.com/dashboard), go to the setting of your project, in section 'Environment Variables' add the .env variables

To deploy the project there are two options:
- connect vercel project to your github repository and every push to master will be builded and deployed
- run `vercel deploy --prod`

---

## Technologies behind the scenes
- **Typescript** as main scripting language
- **WebHook** for telegram bot incoming messages
- **AWS Lambda** & **EventBridge** (aka CloudWatch) to schedule operations
- **Spotify API** (it's a spotify based bot... you know..)
- **Rabbit MQ**
- **vercel.com** for deployment
