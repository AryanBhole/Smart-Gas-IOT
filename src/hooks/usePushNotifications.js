// src/hooks/usePushNotifications.js
// Requests permission, gets FCM token, saves to Firebase RTDB,
// and handles foreground messages — NO Cloud Functions needed.

import { useEffect, useCallback } from "react";
import { messaging, getToken, onMessage } from "../services/firebase";
import { db } from "../services/firebase";
import { ref, set } from "firebase/database";

// ─── Fill these from Firebase Console ──────────────────────────
// Project Settings → Cloud Messaging → Web Push certificates → Key pair
export const VAPID_KEY = "YOUR_VAPID_KEY";

const sanitise = (uid) => uid?.replace(/[^a-zA-Z0-9]/g, "_") ?? "";

export function usePushNotifications(userId, onForegroundMessage) {

  const saveToken = useCallback(async (token) => {
    if (!userId || !token) return;
    const key = sanitise(userId);
    await set(ref(db, `fcmTokens/${key}`), {
      token,
      userId,
      updatedAt: Date.now(),
      platform:  "web",
    });
    console.log("[FCM] Token saved:", token.slice(0, 20) + "…");
  }, [userId]);

  useEffect(() => {
    if (!messaging || !userId) return;
    let unsub = null;

    (async () => {
      try {
        // 1. Ask permission
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { console.warn("[FCM] Permission denied"); return; }

        // 2. Register SW and get token
        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });

        if (token) await saveToken(token);
        else console.warn("[FCM] No token — check VAPID key");

        // 3. Foreground message handler (app is open)
        unsub = onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? "🔥 Smart Gas";
          const body  = payload.notification?.body  ?? payload.data?.message ?? "";
          if (onForegroundMessage) onForegroundMessage({ title, body });
        });

      } catch (err) {
        console.error("[FCM] Init error:", err.message);
      }
    })();

    return () => { if (unsub) unsub(); };
  }, [userId, saveToken, onForegroundMessage]);
}
