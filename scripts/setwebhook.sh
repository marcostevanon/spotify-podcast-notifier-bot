# This script is executed at deploy time
# Set the webhook url to the telegram api every deploy

WEBHOOK_URL=$VERCEL_URL
TOKEN=$(dotenv -p TELEGRAM_BOT_TOKEN)
curl -F "url=$WEBHOOK_URL/api/webhook" https://api.telegram.org/bot\{$TOKEN}/setWebhook
