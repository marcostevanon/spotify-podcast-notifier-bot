## Spotify Notifier Bot Telegram
---
### Install dependencies
``` zsh
npm install
```
### Start only telegram bot - development
``` zsh
npm run botdev
```
---
### SETUP PRODUCTION

### Setup GitHub Action
Workflow is here: [.github/workflows/main.yaml](.github/workflows/main.yaml)
Github action: https://github.com/marketplace/actions/deploy-to-heroku

Set secret in github repo settings

Heroku
- Name: HEROKU_API_KEY
- Value: [here](https://dashboard.heroku.com/account)

ENVS
- Name: ENVS
- Value: *copy from repository*
