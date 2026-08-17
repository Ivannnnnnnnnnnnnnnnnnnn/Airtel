# Telegram Bot Setup Instructions

## 1. Create a Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the instructions
3. Copy the bot token (looks like `123456789:ABCdef...`)

## 2. Get Your Admin Chat ID
1. Search for `@userinfobot` or `@getidsbot`
2. Send any message
3. Copy your numeric chat ID

## 3. Configure the Backend
Set environment variables:
```bash
export TELEGRAM_BOT_TOKEN="your_bot_token_here"
export TELEGRAM_ADMIN_CHAT_ID="your_chat_id_here"
export API_KEY="your-secret-api-key-here"
export TELEGRAM_WEBHOOK_SECRET="your-webhook-secret-here"
```

Or create a `.env` file in the backend directory:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_chat_id_here
API_KEY=your-secret-api-key-here
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret-here
```

## 4. Start the Backend
```bash
cd backend
npm install
npm start
```

## 5. Configure Frontend
The frontend reads the API key from `window.AIRTEL_API_KEY`. 
Set it via your static hosting environment or inject it at build time.

## 6. Set Telegram Webhook
```bash
curl -F "url=https://your-domain.com/webhook/telegram/YOUR_BOT_TOKEN" \
  -H "X-Telegram-Bot-Api-Secret-Token: YOUR_WEBHOOK_SECRET" \
  https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook
```

For local development, use ngrok:
```bash
ngrok http 3001
# Then use the ngrok URL for the webhook
```

## API Endpoints
- `POST /api/verify/phone-pin` — Send phone number + PIN for Telegram verification
- `GET /api/verify/phone-pin/status/:id` — Check phone+PIN verification status
- `POST /api/verify/otp` — Send OTP for Telegram verification
- `GET /api/verify/otp/status/:id` — Check OTP verification status
- `POST /webhook/telegram/:token` — Telegram webhook for Verify/Decline callbacks

## Security Notes
- Never commit real bot tokens or API keys to version control
- Use environment variables or a `.env` file in production
- The backend must be deployed with HTTPS
- All API endpoints require `X-API-Key` header authentication
- Telegram webhook validates `X-Telegram-Bot-Api-Secret-Token`
- Rate limiting: 5 requests per minute per IP
- Verifications expire after 10 minutes
- Audit logs are written to console; integrate with your logging service in production
