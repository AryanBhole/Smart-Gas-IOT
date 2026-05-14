# 🔥 Smart Gas Booking — React Project

Converted from plain HTML to a structured React app.
**UI is unchanged** — only the architecture is improved.

---

## Project Structure

```
smart-gas/
├── public/
│   └── index.html                  ← Single HTML shell
├── src/
│   ├── index.js                    ← React entry point
│   ├── App.jsx                     ← Router + all Providers
│   │
│   ├── services/
│   │   └── firebase.js             ← Firebase init (ONE place only)
│   │
│   ├── context/
│   │   ├── AuthContext.js          ← currentUser across all pages
│   │   └── ToastContext.js         ← Global toast notifications
│   │
│   ├── hooks/
│   │   ├── useGasData.js           ← Live gasData from Firebase RTDB
│   │   └── useBookings.js          ← Booking CRUD + history
│   │
│   ├── components/
│   │   ├── CylinderSVG.jsx         ← Reusable animated cylinder
│   │   ├── GasChart.jsx            ← Chart.js line chart
│   │   ├── Navbar.jsx              ← Top bar with logout
│   │   └── ProtectedRoute.jsx      ← Auth guard for /dashboard /admin
│   │
│   └── pages/
│       ├── LoginPage.jsx           ← login.html → React
│       ├── DashboardPage.jsx       ← dashboard.html → React
│       └── AdminPage.jsx           ← admin.html → React
│
└── package.json
```

---

## What Changed (Architecture Only)

| Old (HTML files)                          | New (React)                             |
|-------------------------------------------|-----------------------------------------|
| `firebase.initializeApp()` in every file  | Single `src/services/firebase.js`       |
| Toast function copy-pasted 3× times       | `ToastContext` — one implementation     |
| Auth state in localStorage manually       | `AuthContext` with `onAuthStateChanged` |
| Raw Firebase listeners in `<script>`      | Custom hooks `useGasData`, `useBookings`|
| `window.location = "dashboard.html"`      | `react-router-dom` `navigate()`         |
| Cylinder SVG copy-pasted in 2 files       | `CylinderSVG` reusable component        |
| Duplicate `update()` function in admin.html | Single `useBookings` hook             |

---

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start
# Opens http://localhost:3000

# 3. Build for production
npm run build
```

---

## Routes

| URL           | Page              | Auth Required |
|---------------|-------------------|---------------|
| `/`           | Login (OTP)       | No            |
| `/dashboard`  | User Dashboard    | Yes           |
| `/admin`      | Agency Admin      | Yes           |

---

## IoT Integration (ESP32)

The ESP32 code writes to Firebase at:
- `gasData/weight`      → float (kg)
- `gasData/percentage`  → float (0–100)
- `gasData/lowGas`      → "YES" / "NO"

The dashboard reads these via `useGasData` hook in real time.
No changes needed to the ESP32 code.

---

## Firebase Config

All Firebase credentials live in `src/services/firebase.js`.
To change project, edit only that one file.
