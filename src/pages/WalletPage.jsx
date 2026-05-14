// src/pages/WalletPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth }          from "../context/AuthContext";
import { useToast }         from "../context/ToastContext";
import { useWallet }        from "../hooks/useWallet";
import { useNotifications } from "../hooks/useNotifications";
import Navbar from "../components/Navbar";

const QUICK_AMOUNTS = [200, 500, 1000, 2000];

export default function WalletPage() {
  const navigate        = useNavigate();
  const { currentUser, userId: authUserId } = useAuth();
  const { showToast }   = useToast();
  const userId = authUserId ?? "Guest";

  const { balance, transactions, addMoney, deductMoney, CYLINDER_PRICE } = useWallet(userId);
  const { addNotification } = useNotifications(userId);

  const [amount,    setAmount]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [tab,       setTab]       = useState("overview"); // overview | history

  useEffect(() => { if (!currentUser) navigate("/"); }, [currentUser, navigate]);

  const handleAddMoney = async (val) => {
    const amt = Number(val || amount);
    if (!amt || amt < 1) { showToast("Enter a valid amount ₹", "info"); return; }
    if (amt > 50000)     { showToast("Max top-up ₹50,000", "info"); return; }
    setLoading(true);
    const result = await addMoney(amt);
    setLoading(false);
    if (result.ok) {
      setAmount("");
      showToast(`₹${amt.toLocaleString("en-IN")} added to wallet 🎉`, "success");
      await addNotification(userId, `💰 ₹${amt.toLocaleString("en-IN")} added to your wallet. New balance: ₹${(balance + amt).toLocaleString("en-IN")}.`, "success");
    } else {
      showToast(result.msg, "error");
    }
  };

  const creditTotal  = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const debitTotal   = transactions.filter(t => t.type === "debit").reduce((s, t)  => s + t.amount, 0);
  const bookingCount = transactions.filter(t => t.type === "debit").length;

  const canAfford = balance >= CYLINDER_PRICE;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; font-family:Poppins; background:linear-gradient(120deg,#020617,#111827); color:white; min-height:100vh; }
        .wl-wrap { max-width:760px; margin:0 auto; padding:24px 16px; }
        .wl-hero { background:linear-gradient(135deg,#1e3a5f,#0f172a); border:1px solid rgba(59,130,246,0.2); border-radius:20px; padding:32px 28px; text-align:center; margin-bottom:24px; position:relative; overflow:hidden; }
        .wl-hero::before { content:""; position:absolute; top:-60px; right:-60px; width:200px; height:200px; background:radial-gradient(circle,rgba(59,130,246,0.15),transparent); border-radius:50%; }
        .wl-balance { font-size:48px; font-weight:700; letter-spacing:-1px; margin:8px 0; }
        .wl-balance span { font-size:24px; opacity:0.6; margin-right:4px; }
        .afford-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 14px; border-radius:20px; font-size:12px; font-weight:600; margin-top:8px; }
        .afford-yes { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3); color:#22c55e; }
        .afford-no  { background:rgba(239,68,68,0.15);  border:1px solid rgba(239,68,68,0.3);  color:#ef4444; }
        .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:24px; }
        .stat-box { background:rgba(255,255,255,0.05); border-radius:14px; padding:16px; text-align:center; }
        .stat-num { font-size:22px; font-weight:700; margin:0; }
        .stat-lbl { font-size:11px; opacity:0.45; margin-top:4px; }
        .wl-tabs { display:flex; gap:8px; margin-bottom:20px; }
        .wl-tab { flex:1; padding:10px; border:none; border-radius:10px; cursor:pointer; font-family:Poppins; font-size:14px; font-weight:500; background:rgba(255,255,255,0.07); color:#aaa; transition:.2s; }
        .wl-tab.active { background:#3b82f6; color:white; }
        .wl-card { background:rgba(255,255,255,0.05); border-radius:16px; padding:22px; backdrop-filter:blur(8px); }
        .quick-row { display:flex; gap:10px; flex-wrap:wrap; margin:14px 0; }
        .quick-btn { flex:1; min-width:70px; padding:10px; border:1px solid rgba(59,130,246,0.3); border-radius:10px; background:rgba(59,130,246,0.08); color:#93c5fd; font-family:Poppins; font-size:14px; font-weight:600; cursor:pointer; transition:.2s; }
        .quick-btn:hover { background:rgba(59,130,246,0.2); border-color:#3b82f6; }
        .wl-input { width:100%; padding:13px 16px; border:1px solid rgba(255,255,255,0.1); border-radius:12px; background:rgba(255,255,255,0.07); color:white; font-family:Poppins; font-size:16px; font-weight:600; outline:none; margin-top:6px; }
        .wl-input:focus { border-color:#3b82f6; }
        .wl-input::placeholder { font-weight:400; opacity:0.4; }
        .add-btn { width:100%; padding:14px; border:none; border-radius:12px; background:#3b82f6; color:white; font-family:Poppins; font-size:15px; font-weight:600; cursor:pointer; margin-top:14px; transition:.2s; }
        .add-btn:hover { background:#2563eb; }
        .add-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .price-info { background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.2); border-radius:10px; padding:12px 16px; margin-top:16px; display:flex; justify-content:space-between; align-items:center; font-size:13px; }

        /* Transactions */
        .tx-item { display:flex; align-items:center; gap:14px; padding:13px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
        .tx-item:last-child { border-bottom:none; }
        .tx-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .tx-credit { background:rgba(34,197,94,0.12); }
        .tx-debit  { background:rgba(239,68,68,0.12); }
        .tx-label  { font-size:14px; font-weight:500; }
        .tx-date   { font-size:11px; opacity:0.4; margin-top:2px; }
        .tx-amount { margin-left:auto; font-size:15px; font-weight:700; }
        .tx-bal    { font-size:11px; opacity:0.4; text-align:right; margin-top:2px; }
        .empty-state { text-align:center; opacity:0.4; padding:40px 0; font-size:14px; }
      `}</style>

      <Navbar userId={userId} />

      <div className="wl-wrap">
        <h2 style={{ marginBottom:6 }}>💰 My Wallet</h2>
        <p style={{ opacity:0.5, fontSize:13, marginBottom:20 }}>
          Add money and pay for cylinder bookings automatically.
        </p>

        {/* ── Hero balance card ── */}
        <div className="wl-hero">
          <div style={{ opacity:0.5, fontSize:13 }}>Available Balance</div>
          <div className="wl-balance">
            <span>₹</span>{balance.toLocaleString("en-IN")}
          </div>
          <div
            className={`afford-badge ${canAfford ? "afford-yes" : "afford-no"}`}
          >
            {canAfford
              ? `✅ Sufficient for ${Math.floor(balance / CYLINDER_PRICE)} cylinder booking${Math.floor(balance / CYLINDER_PRICE) !== 1 ? "s" : ""}`
              : `❌ Insufficient — cylinder costs ₹${CYLINDER_PRICE}`
            }
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="stats-row">
          <div className="stat-box">
            <p className="stat-num" style={{ color:"#22c55e" }}>
              ₹{creditTotal.toLocaleString("en-IN")}
            </p>
            <div className="stat-lbl">Total Added</div>
          </div>
          <div className="stat-box">
            <p className="stat-num" style={{ color:"#ef4444" }}>
              ₹{debitTotal.toLocaleString("en-IN")}
            </p>
            <div className="stat-lbl">Total Spent</div>
          </div>
          <div className="stat-box">
            <p className="stat-num" style={{ color:"#f59e0b" }}>
              {bookingCount}
            </p>
            <div className="stat-lbl">Bookings Paid</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="wl-tabs">
          <button className={`wl-tab${tab==="overview"?" active":""}`} onClick={() => setTab("overview")}>
            ➕ Add Money
          </button>
          <button className={`wl-tab${tab==="history"?" active":""}`} onClick={() => setTab("history")}>
            📋 Transactions ({transactions.length})
          </button>
        </div>

        {/* ── Add Money tab ── */}
        {tab === "overview" && (
          <div className="wl-card">
            <h3 style={{ margin:"0 0 4px" }}>Top Up Wallet</h3>
            <p style={{ margin:"0 0 6px", fontSize:13, opacity:0.5 }}>
              Quick amounts:
            </p>
            <div className="quick-row">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  className="quick-btn"
                  onClick={() => handleAddMoney(a)}
                  disabled={loading}
                >
                  ₹{a.toLocaleString("en-IN")}
                </button>
              ))}
            </div>

            <p style={{ margin:"16px 0 4px", fontSize:13, opacity:0.5 }}>
              Or enter custom amount:
            </p>
            <input
              className="wl-input"
              type="number"
              placeholder="₹ Enter amount"
              value={amount}
              min="1"
              max="50000"
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddMoney()}
            />
            <button
              className="add-btn"
              onClick={() => handleAddMoney()}
              disabled={loading || !amount}
            >
              {loading ? "Processing…" : "➕ Add Money"}
            </button>

            {/* Cylinder price info */}
            <div className="price-info">
              <div>
                <div style={{ fontWeight:600 }}>🔥 Cylinder Price</div>
                <div style={{ opacity:0.5, fontSize:12, marginTop:2 }}>
                  Deducted automatically on each auto/manual booking
                </div>
              </div>
              <div style={{ fontSize:20, fontWeight:700, color:"#ef4444" }}>
                ₹{CYLINDER_PRICE}
              </div>
            </div>
          </div>
        )}

        {/* ── Transaction history tab ── */}
        {tab === "history" && (
          <div className="wl-card">
            <h3 style={{ margin:"0 0 16px" }}>Transaction History</h3>
            {transactions.length === 0 ? (
              <div className="empty-state">No transactions yet 💸</div>
            ) : (
              transactions.map(tx => (
                <div className="tx-item" key={tx.key}>
                  <div className={`tx-icon ${tx.type === "credit" ? "tx-credit" : "tx-debit"}`}>
                    {tx.type === "credit" ? "💰" : "📦"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div className="tx-label">{tx.label}</div>
                    <div className="tx-date">{tx.date} · {tx.time}</div>
                  </div>
                  <div>
                    <div
                      className="tx-amount"
                      style={{ color: tx.type === "credit" ? "#22c55e" : "#ef4444" }}
                    >
                      {tx.type === "credit" ? "+" : "−"}₹{tx.amount?.toLocaleString("en-IN")}
                    </div>
                    <div className="tx-bal">
                      Bal: ₹{tx.balance?.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
