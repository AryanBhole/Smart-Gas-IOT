// src/services/firebase.js
// ─── Single source of truth for Firebase ─────────────────────

import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase }  from "firebase/database";
import { getAuth }      from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:            "AIzaSyBpsV93YNsGe0BhxT9b9Qo-bCpE19QRnxk",
  authDomain:        "gas-booking-d3f51.firebaseapp.com",
  projectId:         "gas-booking-d3f51",
  databaseURL:       "https://gas-booking-d3f51-default-rtdb.firebaseio.com/",
  // ─── ADD THESE from Firebase Console ──────────────────────────
  // Project Settings → General → Your apps → Firebase SDK snippet
  messagingSenderId: "640309951987",   // e.g. "123456789012"
  appId:             "1:640309951987:web:01fed909cfd6caf8342686n",                // e.g. "1:123:web:abc"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db      = getDatabase(app);
export const auth    = getAuth(app);

// Messaging is only available in browsers that support it (not Node/SSR)
export let messaging = null;
try {
  messaging = getMessaging(app);
} catch (_) {}

export { getToken, onMessage };
export default app;
