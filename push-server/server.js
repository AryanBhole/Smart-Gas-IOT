// push-server/server.js
// Tiny Node.js server — reads pushQueue from Firebase RTDB
// and sends real FCM pushes using Admin SDK (FCM v1 API).
//
// Deploy FREE on Render.com:
//   1. Push this folder to a GitHub repo
//   2. New Web Service → connect repo → Start Command: node server.js
//   3. Add environment variables (see below)

const admin = require("firebase-admin");

// ─── Environment variables (set in Render dashboard) ──────────
// FIREBASE_SERVICE_ACCOUNT  — paste the full JSON from Firebase Console
//   Project Settings → Service Accounts → Generate new private key
//   Copy entire JSON content as the env variable value
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential:  admin.credential.cert(serviceAccount),
  databaseURL: "https://gas-booking-d3f51-default-rtdb.firebaseio.com/",
});

const db = admin.database();

console.log("🔥 Smart Gas Push Server started");

// Listen for new items in pushQueue
db.ref("pushQueue").on("child_added", async (snap) => {
  const payload = snap.val();
  if (!payload || payload.sent) return;

  const { userId, key, title, body } = payload;

  try {
    // Read user's FCM token
    const tokenSnap = await db.ref(`fcmTokens/${key}/token`).get();
    if (!tokenSnap.exists()) {
      console.log(`⚠️  No FCM token for ${userId}`);
      await snap.ref.update({ sent: true, result: "no_token" });
      return;
    }

    const token = tokenSnap.val();

    // Send via FCM v1
    const message = {
      token,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon:    "/logo192.png",
          badge:   "/logo192.png",
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
        fcmOptions: { link: "https://YOUR-APP-URL.com/dashboard" },
      },
      android: {
        priority: "high",
        notification: { sound: "default", priority: "high", channelId: "smart_gas" },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Push sent to ${userId}:`, response);
    await snap.ref.update({ sent: true, result: "ok", response });

  } catch (err) {
    console.error(`❌ Push failed for ${userId}:`, err.message);
    await snap.ref.update({ sent: true, result: "error", error: err.message });
  }
});

// Keep server alive (Render free tier)
const http = require("http");
http.createServer((req, res) => res.end("Smart Gas Push Server running ✅"))
    .listen(process.env.PORT || 3001, () => {
      console.log(`HTTP health check on port ${process.env.PORT || 3001}`);
    });
