/**
 * Notification Service (Admin Backend)
 * 
 * Handles:
 *  1. DB Notification record creation (always)
 *  2. Expo Push Notification via FCM token (if fcmToken exists on user)
 * 
 * Uses Expo's push API — no Firebase SDK needed.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const https = require('https');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a single Expo push notification
 * @param {string} expoPushToken - The expo push token (ExponentPushToken[...])
 * @param {string} title
 * @param {string} body
 * @param {object} data - Extra JSON data attached to notification
 */
async function sendExpoPush(expoPushToken, title, body, data = {}) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    return; // Not a valid Expo token, skip silently
  }

  const payload = JSON.stringify({
    to: expoPushToken,
    title,
    body,
    data,
    sound: 'default',
    badge: 1,
    priority: 'high',
  });

  return new Promise((resolve) => {
    const url = new URL(EXPO_PUSH_URL);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed?.data?.status === 'error') {
              console.warn('[PushNotification] Expo push error:', parsed.data);
            }
          } catch (_) {}
          resolve();
        });
      }
    );
    req.on('error', (err) => {
      console.error('[PushNotification] Network error sending Expo push:', err.message);
      resolve(); // Don't fail assignment because of notification failure
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Notify a user: create DB notification record + send Expo push (if token exists)
 *
 * @param {import('@prisma/client').PrismaClient | any} tx - Prisma client or transaction
 * @param {object} opts
 * @param {string} opts.userId
 * @param {'system'|'alert'|'reminder'|'info'} opts.type
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {object} [opts.data]
 */
async function notifyUser(tx, { userId, type = 'system', title, body, data = {} }) {
  try {
    // 1. Create DB notification record
    await tx.notification.create({
      data: {
        userId,
        type,
        channel: 'push',
        title,
        body,
        data,
        sentAt: new Date(),
      },
    });

    // 2. Get the user's Expo push token (fcmToken field)
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (user?.fcmToken) {
      // Fire and forget — don't await in transaction
      setImmediate(() => sendExpoPush(user.fcmToken, title, body, data));
    }
  } catch (err) {
    // Never let notification failure crash the main operation
    console.error('[NotificationService] Failed to notify user:', userId, err.message);
  }
}

/**
 * Notify multiple users at once
 * @param {any} tx
 * @param {Array<{userId, type, title, body, data}>} notifications
 */
async function notifyMany(tx, notifications) {
  for (const n of notifications) {
    await notifyUser(tx, n);
  }
}

module.exports = { notifyUser, notifyMany, sendExpoPush };
