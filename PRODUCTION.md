# Airtel Education & Scholarship - Production Setup Guide

## Prerequisites
- Node.js 18+ installed
- A publicly accessible server/VPS (or hosting platform like Render, Railway, Fly.io)
- A Telegram bot token from @BotFather
- Your Telegram chat ID (message @userinfobot to get it)

## 1. Environment Variables

Create a `.env` file in the `backend/` directory with these values:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_ADMIN_CHAT_ID=your_telegram_chat_id
TELEGRAM_WEBHOOK_SECRET=random_secret_string_for_webhook_validation

# API Security
API_KEY=random_api_key_for_frontend_auth

# Server
PORT=3001

# Frontend URL (for CORS)
FRONTEND_ORIGIN=https://your-frontend-domain.com

# Webhook Configuration (REQUIRED FOR PRODUCTION)
WEBHOOK_URL=https://your-backend-domain.com
AUTO_SET_WEBHOOK=true
```

### How to get these values:

**TELEGRAM_BOT_TOKEN:**
1. Open Telegram and search for @BotFather
2. Send `/newbot` and follow instructions
3. Copy the token (format: `123456789:ABCdef...`)

**TELEGRAM_ADMIN_CHAT_ID:**
1. Search for @userinfobot on Telegram
2. Send any message
3. Copy your numeric chat ID

**TELEGRAM_WEBHOOK_SECRET:**
- Generate a random string (e.g., `openssl rand -hex 32`)
- This secures your webhook endpoint

**API_KEY:**
- Generate a random string for frontend-to-backend authentication

## 2. Deploy Backend

### Option A: Using PM2 (VPS/Dedicated server)

```bash
cd backend
npm install
pm2 start server.js --name airtel-edu-api
pm2 save
pm2 startup
```

### Option B: Using Docker

Create a `Dockerfile` in backend/:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js ./
EXPOSE 3001
CMD ["node", "server.js"]
```

### Option C: Using Render/Railway/Fly.io

- Connect your GitHub repo
- Set environment variables in the platform dashboard
- Deploy

## 3. Deploy Frontend

The frontend is static HTML/CSS/JS. Deploy to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting

**Important:** Update `FRONTEND_ORIGIN` in backend `.env` to match your frontend URL.

## 4. Configure Telegram Webhook

### Automatic (if AUTO_SET_WEBHOOK=true):
The webhook will be set automatically when the backend starts.

### Manual:
```bash
curl -X POST https://your-backend-domain.com/api/webhook/set \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{"url": "https://your-backend-domain.com/webhook/telegram/your_bot_token"}'
```

### Verify Webhook:
```bash
curl https://your-backend-domain.com/api/webhook/info \
  -H "X-API-Key: your_api_key"
```

## 5. Test the Flow

1. Open your frontend URL
2. Click "Get Started" or "Apply for Scholarship"
3. Enter phone number and PIN
4. Click "Verify Phone & PIN"
5. Check your Telegram - you should receive a verification request with ✅ Verify / ❌ Decline buttons
6. Click a button in Telegram
7. The frontend should update accordingly

## 6. Security Checklist for Production

- [ ] `TELEGRAM_WEBHOOK_SECRET` is set (prevents unauthorized webhook calls)
- [ ] `API_KEY` is set and strong (authenticates frontend-to-backend)
- [ ] `FRONTEND_ORIGIN` matches your actual frontend domain
- [ ] Backend is served over HTTPS (required for Telegram webhooks)
- [ ] `.env` file is NOT committed to git
- [ ] Server has firewall rules allowing only ports 80/443

## 7. Troubleshooting

**No Telegram messages received:**
```bash
# Check webhook status
curl https://your-backend-domain.com/api/webhook/info \
  -H "X-API-Key: your_api_key"

# Check backend logs
pm2 logs airtel-edu-api
```

**Common issues:**
- Backend not publicly accessible (use HTTPS)
- Webhook URL mismatch
- Wrong TELEGRAM_ADMIN_CHAT_ID
- Firewall blocking ports
