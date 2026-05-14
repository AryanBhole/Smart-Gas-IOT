// public/firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging — handles background push notifications.
// This file MUST be at the root of your domain (public/ folder in CRA).

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:     "AIzaSyBpsV93YNsGe0BhxT9b9Qo-bCpE19QRnxk",
  authDomain: "gas-booking-d3f51.firebaseapp.com",
  projectId:  "gas-booking-d3f51",
  databaseURL:"https://gas-booking-d3f51-default-rtdb.firebaseio.com/",
  // ADD YOUR messagingSenderId and appId from Firebase Console
  // Project Settings → General → Your apps → SDK setup
  messagingSenderId: "640309951987",
  appId:             "1:640309951987:web:01fed909cfd6caf8342686",
});

const messaging = firebase.messaging();

// Handle background messages (app minimised or closed)
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message received:", payload);

  const { title, body, icon } = payload.notification ?? {};

  self.registration.showNotification(title ?? "🔥 Smart Gas", {
    body:  body  ?? payload.data?.message ?? "You have a new notification.",
    icon:  icon  ?? "/logo192.png",
    badge: "/logo192.png",
    data:  payload.data,
    actions: [
      { action: "open",    title: "Open App" },
      { action: "dismiss", title: "Dismiss"  },
    ],
  });
});

// Clicking the notification opens the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action !== "dismiss") {
    event.waitUntil(clients.openWindow("/dashboard"));
  }
});
