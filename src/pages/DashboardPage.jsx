// src/pages/DashboardPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth }          from "../context/AuthContext";
import { useToast }         from "../context/ToastContext";
import { useGasData }       from "../hooks/useGasData";
import { useBookings }      from "../hooks/useBookings";
import { useWallet }        from "../hooks/useWallet";
import Navbar               from "../components/Navbar";
import CylinderSVG          from "../components/CylinderSVG";
import GasChart             from "../components/GasChart";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { sendPushToUser }        from "../services/sendPush";

const AUTO_THRESHOLD = 20;

export default function DashboardPage() {
  const navigate        = useNavigate();
  const { currentUser, userId: authUserId } = useAuth();
  const { showToast }   = useToast();
  const gasData         = useGasData();
  const userId = authUserId ?? "Guest";

  const { bookings, deliveryStatus, manualBook, autoBook, cancelBooking } = useBookings(userId);
  const { balance, deductMoney, CYLINDER_PRICE }  = useWallet(userId);

  const [autoMode,     setAutoMode]     = useState(() => localStorage.getItem("autoMode") === "true");

  // ── FCM push notifications ──────────────────────────────────
  // Shows a toast for foreground messages; background handled by service worker
  usePushNotifications(userId, ({ title, body }) => {
    showToast(`${title}: ${body}`, "info");
  });
  const [walletAlert,  setWalletAlert]  = useState(null); // show low-balance warning
  const bookingDoneRef = useRef(false);

  useEffect(() => { if (!currentUser) navigate("/"); }, [currentUser, navigate]);

  // ── Auto booking: deduct wallet + send notification ──
  useEffect(() => {
    const p = gasData.percentage;
    if (p > 60) { bookingDoneRef.current = false; return; }
    if (p > AUTO_THRESHOLD || bookingDoneRef.current || !autoMode) return;

    (async () => {
      bookingDoneRef.current = true; // prevent double-trigger

      // 1. Try wallet deduction
      const result = await deductMoney(CYLINDER_PRICE, "Auto Cylinder Booking");

      if (!result.ok) {
        // Insufficient balance — notify & show alert, but still raise booking
        showToast(`⚠️ Auto Booking — Low Wallet! ${result.msg}`, "warning");
        setWalletAlert(`Auto booking triggered but wallet balance is low (₹${balance}). Please add money.`);
        await sendPushToUser(userId, "🔥 Smart Gas", `⚠️ Auto booking triggered but wallet has insufficient balance (₹${balance}). Please top up.`, "error");
      } else {
        showToast(`🤖 Auto Booking done! ₹${CYLINDER_PRICE} deducted. Balance: ₹${result.newBalance}`, "warning");
        // 2. Send success notification
        await sendPushToUser(userId, "🔥 Smart Gas", `🤖 Auto booking placed! ₹${CYLINDER_PRICE} deducted. New balance: ₹${result.newBalance}.`, "warning");
      }

      // 3. Always push the booking to Firebase
      await autoBook(userId);

      // 4. Extra notification for the booking itself
      await sendPushToUser(userId, "🔥 Smart Gas", `📦 New cylinder booking on ${new Date().toLocaleDateString()}. Status: Pending.`, "info");
    })();
  }, [gasData.percentage, autoMode, userId, balance, deductMoney, CYLINDER_PRICE, autoBook, showToast]);

  const handleManualBook = async () => {
    await manualBook(userId);
    await sendPushToUser(userId, "🔥 Smart Gas", `📦 Manual booking placed on ${new Date().toLocaleDateString()}. Status: Pending.`, "info");
    showToast("Cylinder Booking Request Sent ✅", "success");
  };

  const handleToggleAuto = () => {
    const next = !autoMode;
    setAutoMode(next);
    localStorage.setItem("autoMode", next);
    showToast(`Auto Booking ${next ? "enabled 🟢" : "disabled 🔴"}`, next ? "success" : "info");
  };

  const handleCancelBooking = async (id) => {
    await cancelBooking(id);
    showToast("Booking Cancelled ❌", "error");
  };

  const handleClearAll = async () => {
    for (const b of bookings) await cancelBooking(b.key);
    showToast("All bookings cleared 🧹", "info");
  };

  const statusColor = (s) => ({
    Pending: "#f59e0b", Approved: "#22c55e",
    "Out for Delivery": "#3b82f6", Delivered: "#8b5cf6",
  }[s] ?? "#6b7280");

  const statusDot = (s) => (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: statusColor(s), marginRight: 6, flexShrink: 0,
    }} />
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; font-family:Poppins; background:linear-gradient(120deg,#020617,#111827); color:white; }
        .container { display:flex; flex-wrap:wrap; gap:30px; justify-content:center; padding:30px; }
        .card { background:rgba(255,255,255,0.05); padding:25px; border-radius:20px; width:320px; text-align:center; backdrop-filter:blur(8px); }
        .cylinder-box { width:160px; margin:auto; transition:0.5s; }
        .action-btn { background:#ef4444; padding:12px; border:none; border-radius:10px; color:white; cursor:pointer; width:100%; margin-top:10px; font-size:15px; font-family:Poppins; transition:.2s; }
        .action-btn:hover { opacity:.85; }
        .auto-btn-on  { background:#22c55e !important; }
        .auto-btn-off { background:#ef4444 !important; }

        /* Booking history table */
        .hist-table { width:100%; margin-top:12px; border-collapse:collapse; }
        .hist-table td { padding:9px 6px; border-bottom:1px solid rgba(255,255,255,0.07); font-size:12px; text-align:left; vertical-align:middle; }
        .hist-table tr:last-child td { border-bottom:none; }
        .type-badge { font-size:10px; padding:2px 7px; border-radius:20px; font-weight:600; }
        .cancel-btn { background:#f59e0b; padding:3px 9px; border-radius:6px; cursor:pointer; border:none; color:white; font-family:Poppins; font-size:11px; }
        .clear-btn { background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:9px; border-radius:10px; margin-top:10px; cursor:pointer; color:#ef4444; font-family:Poppins; width:100%; font-size:13px; }

        /* Wallet balance chip in cylinder card */
        .wallet-chip { display:inline-flex; align-items:center; gap:6px; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); border-radius:20px; padding:5px 14px; font-size:13px; font-weight:600; color:#22c55e; margin-top:10px; }

        /* Low balance alert banner */
        .wallet-alert { background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:10px 14px; font-size:12px; color:#ef4444; margin-top:10px; text-align:left; display:flex; gap:8px; align-items:flex-start; }
      `}</style>

      <Navbar userId={userId} />

      <div className="container">

        {/* ── Card 1: Cylinder Status ── */}
        <div className="card">
          <h3 style={{ margin:"0 0 12px" }}>Cylinder Status</h3>

          <div className="cylinder-box">
            <CylinderSVG percent={gasData.percentage} />
          </div>

          <h1 style={{ margin:"10px 0 4px" }}>{Math.round(gasData.percentage)}%</h1>
          <h3 style={{ margin:"4px 0 8px", opacity:0.7, fontSize:14 }}>
            Delivery: {deliveryStatus}
          </h3>

          {/* Wallet balance chip */}
          <div className="wallet-chip">
            💰 Wallet: ₹{balance.toLocaleString("en-IN")}
          </div>

          {/* Low balance alert */}
          {walletAlert && (
            <div className="wallet-alert">
              ⚠️ <span>{walletAlert}</span>
            </div>
          )}

          <button className="action-btn" onClick={handleManualBook} style={{ marginTop:14 }}>
            📦 Book Cylinder
          </button>

          <button
            className={`action-btn ${autoMode ? "auto-btn-on" : "auto-btn-off"}`}
            onClick={handleToggleAuto}
          >
            🤖 Auto Booking : {autoMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* ── Card 2: Gas Usage Chart ── */}
        <div className="card">
          <h3 style={{ margin:"0 0 16px" }}>Gas Usage Chart</h3>
          <GasChart percentage={gasData.percentage} />
        </div>

        {/* ── Card 3: Booking History (FIXED) ── */}
        <div className="card">
          <h3 style={{ margin:"0 0 4px" }}>Booking History</h3>
          <p style={{ margin:"0 0 4px", fontSize:12, opacity:0.4 }}>
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </p>

          {bookings.length === 0 ? (
            <p style={{ opacity:0.4, fontSize:13, marginTop:24 }}>No bookings yet</p>
          ) : (
            <table className="hist-table">
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.key}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center" }}>
                        {statusDot(b.status)}
                        <span>{b.status}</span>
                      </div>
                      <div style={{ opacity:0.45, fontSize:11, marginTop:2 }}>
                        {b.date} {b.time && `· ${b.time}`}
                      </div>
                    </td>
                    <td>
                      <span
                        className="type-badge"
                        style={{
                          background: b.type === "Auto" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
                          color:      b.type === "Auto" ? "#ef4444" : "#3b82f6",
                        }}
                      >
                        {b.type || "Manual"}
                      </span>
                    </td>
                    <td>
                      {b.status === "Pending" && (
                        <button className="cancel-btn" onClick={() => handleCancelBooking(b.key)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {bookings.length > 0 && (
            <button className="clear-btn" onClick={handleClearAll}>
              🧹 Clear All
            </button>
          )}
        </div>

      </div>
    </>
  );
}
