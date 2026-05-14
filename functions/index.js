// functions/index.js
// Firebase Cloud Function — sends real FCM push notifications
// when anything is written to the pushQueue RTDB node.
//
// Deploy with:
//   npm install -g firebase-tools
//   firebase login
//   firebase init functions   (choose existing project: gas-booking-d3f51)
//   copy this file to functions/index.js
//   firebase deploy --only functions

const functions = require("firebase-functions");
const admin     = require("firebase-admin");

admin.initializeApp();
const db = admin.database();

// Trigger: fires every time a new item is pushed to /pushQueue
exports.sendPushNotification = functions.database
  .ref("/pushQueue/{pushId}")
  .onCreate(async (snapshot, context) => {
    const payload = snapshot.val();
    if (!payload) return null;

    const { userId, fcmTokenPath, title, body } = payload;

    try {
      // 1. Read the user's FCM token from /fcmTokens/{key}/token
      const tokenSnap = await db.ref(fcmTokenPath).get();
      if (!tokenSnap.exists()) {
        console.log(`No FCM token for ${userId}`);
        // Remove from queue
        await snapshot.ref.remove();
        return null;
      }

      const token = tokenSnap.val();

      // 2. Send FCM push via Admin SDK
      const message = {
        token,
        notification: { title, body },
        android: {
          notification: {
            icon:     "ic_notification",
            color:    "#ef4444",
            sound:    "default",
            priority: "high",
          },
        },
        apns: {
          payload: {
            aps: { sound: "default", badge: 1 },
          },
        },
        webpush: {
          notification: {
            icon:  "/logo192.png",
            badge: "/logo192.png",
            vibrate: [200, 100, 200],
          },
          fcmOptions: { link: "/dashboard" },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Push sent to ${userId}:`, response);

      // 3. Remove from queue after successful send
      await snapshot.ref.remove();
      return response;

    } catch (err) {
      console.error(`❌ Push failed for ${userId}:`, err.message);
      // Mark as failed instead of looping
      await snapshot.ref.update({ failed: true, error: err.message });
      return null;
    }
  });
