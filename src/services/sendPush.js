// src/services/sendPush.js
// Sends push notifications using Firebase FCM HTTP v1 API.
//
// FCM Legacy API (Server Key) was SHUT DOWN July 2024.
// FCM v1 requires a service account — cannot be called from a browser safely.
//
// SOLUTION: We write to a `pushQueue` node in Firebase RTDB.
// A tiny free Node server (Render/Railway — both free tier) reads the queue
// and sends the push using the Admin SDK.
//
// For NOW: this file only writes the in-app notification.
// The push server handles the actual device push.

import { db } from "./firebase";
import { ref, push, get } from "firebase/database";

const sanitise = (uid) => uid?.replace(/[^a-zA-Z0-9]/g, "_") ?? "";

/**
 * sendPushToUser — writes in-app notification + queues a push for the server.
 */
export async function sendPushToUser(userId, title, body, type = "info") {
  if (!userId) return;
  const key = sanitise(userId);

  // 1. In-app notification (Profile → Notifications tab)
  await push(ref(db, `notifications/${key}`), {
    message:   body,
    type,
    read:      false,
    timestamp: Date.now(),
    time:      new Date().toLocaleTimeString(),
  });

  // 2. Queue push for the Node push server
  await push(ref(db, "pushQueue"), {
    userId,
    key,
    title,
    body,
    type,
    sentAt: Date.now(),
    sent:   false,
  });
}
