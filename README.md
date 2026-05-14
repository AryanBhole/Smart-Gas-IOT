# 🔥 Smart Gas Booking — React Project



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

---

## Firebase Config

All Firebase credentials live in `src/services/firebase.js`.
To change project, edit only that one file.
