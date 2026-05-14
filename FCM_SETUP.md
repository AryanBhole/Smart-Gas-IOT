# 🔔 FCM Push Notifications — Setup Guide

> ⚠️ FCM Legacy API (Server Key) was shut down July 2024 — it no longer works.
> This guide uses the current FCM v1 API via a free Node server on Render.com.

---

## Overview

```
Phone browser → saves FCM token to Firebase
Admin clicks Approve → writes to pushQueue in Firebase
Push server (Render) → reads pushQueue → sends FCM v1 push → Phone gets notification
```

---

## Step 1 — Get VAPID Key + messagingSenderId + appId

**Firebase Console → Project Settings**

### A) messagingSenderId and appId
- Tab: **General** → Your apps → your web app → SDK config
- Copy `messagingSenderId` and `appId`

Paste into **both files**:
```
src/services/firebase.js            line: messagingSenderId, appId
public/firebase-messaging-sw.js     line: messagingSenderId, appId
```

### B) VAPID Key
- Tab: **Cloud Messaging** → Web Push certificates → Generate key pair
- Copy the Key pair

Paste into:
```
src/hooks/usePushNotifications.js   line: const VAPID_KEY = "..."
```

---

## Step 2 — Get Service Account JSON (for push server)

Firebase Console → Project Settings → **Service accounts** tab
→ Click **"Generate new private key"**
→ Download the JSON file
→ Open it and copy the ENTIRE content (you'll need it in Step 3)

---

## Step 3 — Deploy Push Server FREE on Render.com

1. Create a free account at **render.com**

2. Create a new GitHub repo and push the `push-server/` folder to it:
```bash
cd push-server
git init
git add .
git commit -m "push server"
git remote add origin https://github.com/YOUR_USERNAME/smart-gas-push.git
git push -u origin main
```

3. On Render.com:
   - Click **New → Web Service**
   - Connect your GitHub repo
   - Settings:
     - **Build Command:** `npm install`
     - **Start Command:** `node server.js`
     - **Instance type:** Free

4. Add Environment Variable:
   - Key: `FIREBASE_SERVICE_ACCOUNT`
   - Value: paste the **entire JSON content** of the service account file
     (the whole thing from `{` to `}`)

5. Click **Deploy** — takes ~2 minutes

---

## Step 4 — Deploy database rules

```powershell
cd C:\project\smart-gas
firebase deploy --only database
```

---

## Testing

1. Open app on your phone in Chrome
2. Login with OTP
3. Tap **Allow** when browser asks for notifications
4. Open Admin panel on another device
5. Tap **Approve** on any booking
6. ✅ Push notification appears on your phone within 2–3 seconds

---

## Notifications sent

| Trigger | Message |
|---------|---------|
| Auto booking | 🤖 Auto booking placed! ₹899 deducted |
| Low wallet | ⚠️ Insufficient wallet — please top up |
| Manual booking | 📦 Manual booking placed |
| Admin: Approved | ✅ Your booking has been approved! |
| Admin: Dispatched | 🚚 Your cylinder is out for delivery! |
| Admin: Delivered | 🎉 Your cylinder has been delivered! |
| Admin: Cancelled | ❌ Your booking has been cancelled |
