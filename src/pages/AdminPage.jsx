// src/pages/AdminPage.jsx
import React, { useRef, useEffect, useState } from "react";
import { useBookings } from "../hooks/useBookings";
import { useSupport } from "../hooks/useSupport";
import { useToast } from "../context/ToastContext";
import { sendPushToUser } from "../services/sendPush";

// notifyUser = in-app notification + real FCM push to phone
// No Cloud Functions needed — uses FCM Legacy HTTP API directly
const notifyUser = (userId, message, type = "info") =>
  sendPushToUser(userId, "🔥 Smart Gas Booking", message, type);

const STATUS_MESSAGES = {
  Approved:           (uid) => `✅ Your booking has been approved! We will dispatch soon.`,
  "Out for Delivery": (uid) => `🚚 Your cylinder is out for delivery! Please be available.`,
  Delivered:          (uid) => `🎉 Your cylinder has been delivered successfully. Enjoy!`,
};

export default function AdminPage() {
  const { allBookings, updateStatus, cancelBooking }          = useBookings(null);
  const { allTickets, messages, activeTicket, setActiveTicket,
          sendMessage, resolveTicket, updatePriority }         = useSupport(null);
  const { showToast } = useToast();

  const [tab,      setTab]      = useState("bookings"); // bookings | support | stats
  const [msgText,  setMsgText]  = useState("");
  const chatEndRef              = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const handleUpdate = async (key, status, booking) => {
    await updateStatus(key, status);
    showToast(`Status → ${status}`, "success");
    // Notify the customer whose booking this is
    const msg = STATUS_MESSAGES[status];
    if (msg && booking?.userId) {
      await notifyUser(booking.userId, msg(booking.userId), "success");
    }
  };
  const handleCancel = async (key, booking) => {
    await cancelBooking(key);
    showToast("Booking removed", "info");
    if (booking?.userId) {
      await notifyUser(
        booking.userId,
        `❌ Your booking dated ${booking.date} has been cancelled by the agency. Please contact support if needed.`,
        "error"
      );
    }
  };
  const handleSend = () => {
    if (!msgText.trim() || !activeTicket) return;
    sendMessage(activeTicket, "admin", msgText.trim());
    setMsgText("");
  };
  const handleResolve = (key) => {
    resolveTicket(key);
    setActiveTicket(null);
    showToast("Ticket resolved ✅", "success");
  };

  const statusColor = (s) =>
    ({ Pending:"#f59e0b", Approved:"#22c55e", "Out for Delivery":"#3b82f6", Delivered:"#8b5cf6" }[s] ?? "#6b7280");

  const ticketStatusColor = (s) =>
    ({ Open:"#22c55e", Resolved:"#3b82f6", Closed:"#6b7280" }[s] ?? "#6b7280");

  // Stats
  const stats = {
    total:     allBookings.length,
    pending:   allBookings.filter(b=>b.status==="Pending").length,
    delivered: allBookings.filter(b=>b.status==="Delivered").length,
    openTickets: allTickets.filter(t=>t.status==="Open").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap');
        * { box-sizing:border-box; }
        body { font-family:Poppins; background:#0f172a; color:white; margin:0; min-height:100vh; }
        .ad-header { padding:20px 24px; background:#0a0f1e; border-bottom:1px solid rgba(255,255,255,0.07); display:flex; align-items:center; justify-content:space-between; }
        .ad-tabs { display:flex; gap:8px; padding:16px 24px 0; }
        .ad-tab { padding:10px 20px; border:none; border-radius:10px 10px 0 0; cursor:pointer; font-family:Poppins; font-size:14px; font-weight:500; background:rgba(255,255,255,0.05); color:#aaa; transition:.2s; }
        .ad-tab.active { background:#1f2937; color:white; }
        .ad-body { padding:20px 24px; }
        .ad-card { background:#1f2937; padding:16px; margin:10px 0; border-radius:12px; }
        .ad-card p { margin:4px 0; font-size:14px; }
        .ad-btn { margin:4px; padding:6px 13px; border:none; border-radius:7px; cursor:pointer; font-family:Poppins; font-size:13px; color:white; }
        .btn-approve  { background:#22c55e; }
        .btn-dispatch { background:#3b82f6; }
        .btn-deliver  { background:#8b5cf6; }
        .btn-cancel   { background:#ef4444; }
        .btn-resolve  { background:#22c55e; }
        .btn-priority { background:#f59e0b; }
        .badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
        .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:20px; }
        .stat-card { background:#1f2937; border-radius:12px; padding:18px; text-align:center; }
        .stat-num { font-size:32px; font-weight:700; margin:0; }
        .stat-label { font-size:12px; opacity:0.5; margin-top:4px; }
        .ticket-row { display:flex; justify-content:space-between; align-items:center; padding:12px 14px; border-radius:10px; background:rgba(255,255,255,0.04); margin:6px 0; cursor:pointer; transition:.2s; }
        .ticket-row:hover { background:rgba(255,255,255,0.07); }
        .ticket-row.selected { border:1px solid #ef4444; }
        .chat-panel { background:#111827; border-radius:12px; padding:16px; margin-top:12px; }
        .chat-box { height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding:4px 0; }
        .bubble { max-width:70%; padding:9px 13px; border-radius:12px; font-size:13px; line-height:1.5; }
        .bubble.mine    { align-self:flex-end; background:#ef4444; border-bottom-right-radius:4px; }
        .bubble.theirs  { align-self:flex-start; background:rgba(255,255,255,0.1); border-bottom-left-radius:4px; }
        .bubble .time   { font-size:10px; opacity:0.6; margin-top:3px; }
        .chat-input-row { display:flex; gap:8px; margin-top:10px; }
        .chat-input-row input { flex:1; padding:10px 14px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background:rgba(255,255,255,0.06); color:white; font-family:Poppins; font-size:14px; outline:none; }
        .chat-input-row input:focus { border-color:#ef4444; }
        .chat-send-btn { padding:10px 16px; border:none; border-radius:10px; background:#ef4444; color:white; cursor:pointer; font-size:16px; }
        .empty-state { text-align:center; opacity:0.4; padding:40px; font-size:14px; }
      `}</style>

      {/* Header */}
      <div className="ad-header">
        <div style={{ fontSize:20, fontWeight:700 }}>🔥 Gas Agency Admin Panel</div>
        <div style={{ fontSize:13, opacity:0.5 }}>
          {stats.pending} pending · {stats.openTickets} open tickets
        </div>
      </div>

      {/* Tabs */}
      <div className="ad-tabs">
        {[["bookings","📦 Bookings"],["support","🎧 Support"],["stats","📊 Stats"]].map(([key,label]) => (
          <button key={key} className={`ad-tab${tab===key?" active":""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="ad-body">

        {/* ══ BOOKINGS ══ */}
        {tab === "bookings" && (
          <>
            {allBookings.length === 0 && <div className="empty-state">No booking requests yet.</div>}
            {allBookings.map((b) => (
              <div className="ad-card" key={b.key}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <p><strong>User:</strong> {b.userId}</p>
                    <p><strong>Date:</strong> {b.date}</p>
                    {b.type && <p><strong>Type:</strong> {b.type}</p>}
                  </div>
                  <span className="badge" style={{ background:statusColor(b.status)+"22", color:statusColor(b.status) }}>
                    {b.status}
                  </span>
                </div>
                <div style={{ marginTop:10 }}>
                  <button className="ad-btn btn-approve"  onClick={()=>handleUpdate(b.key,"Approved",b)}>Approve</button>
                  <button className="ad-btn btn-dispatch" onClick={()=>handleUpdate(b.key,"Out for Delivery",b)}>Dispatch</button>
                  <button className="ad-btn btn-deliver"  onClick={()=>handleUpdate(b.key,"Delivered",b)}>Delivered</button>
                  <button className="ad-btn btn-cancel"   onClick={()=>handleCancel(b.key,b)}>Remove</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══ SUPPORT ══ */}
        {tab === "support" && (
          <>
            {allTickets.length === 0 && <div className="empty-state">No support tickets yet.</div>}

            {/* Ticket list */}
            {!activeTicket && allTickets.map((t) => (
              <div
                key={t.key}
                className="ticket-row"
                onClick={() => setActiveTicket(t.key)}
              >
                <div>
                  <div style={{ fontSize:14, fontWeight:500 }}>{t.subject}</div>
                  <div style={{ fontSize:11, opacity:0.5, marginTop:2 }}>
                    {t.userId} · {t.date} · {t.priority}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span className="badge" style={{ background:ticketStatusColor(t.status)+"22", color:ticketStatusColor(t.status) }}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}

            {/* Chat panel for selected ticket */}
            {activeTicket && (() => {
              const ticket = allTickets.find(t => t.key === activeTicket);
              return (
                <div className="chat-panel">
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div>
                      <strong>{ticket?.subject}</strong>
                      <p style={{ margin:0, fontSize:12, opacity:0.5 }}>
                        {ticket?.userId} · #{activeTicket.slice(-6)} · {ticket?.priority}
                      </p>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <select
                        className="ad-btn btn-priority"
                        style={{ cursor:"pointer" }}
                        value={ticket?.priority || "Normal"}
                        onChange={e => updatePriority(activeTicket, e.target.value)}
                      >
                        <option>Low</option>
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                      <button className="ad-btn btn-resolve" onClick={() => handleResolve(activeTicket)}>
                        ✓ Resolve
                      </button>
                      <button className="ad-btn" style={{ background:"#374151" }} onClick={() => setActiveTicket(null)}>
                        ← Back
                      </button>
                    </div>
                  </div>

                  <div className="chat-box">
                    {messages.length === 0 && (
                      <div style={{ textAlign:"center", opacity:0.4, marginTop:60, fontSize:13 }}>
                        No messages yet.
                      </div>
                    )}
                    {messages.map((m) => (
                      <div key={m.key} className={`bubble ${m.sender==="admin" ? "mine" : "theirs"}`}>
                        {m.sender !== "admin" && (
                          <div style={{ fontSize:10, opacity:0.6, marginBottom:2 }}>{m.sender}</div>
                        )}
                        {m.text}
                        <div className="time">{m.time}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="chat-input-row">
                    <input
                      placeholder="Reply to customer…"
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={e => e.key==="Enter" && handleSend()}
                    />
                    <button className="chat-send-btn" onClick={handleSend}>➤</button>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ══ STATS ══ */}
        {tab === "stats" && (
          <>
            <div className="stats-grid">
              {[
                ["📦", stats.total,     "Total Bookings",     "#ef4444"],
                ["⏳", stats.pending,   "Pending",            "#f59e0b"],
                ["✅", stats.delivered, "Delivered",          "#22c55e"],
                ["🎫", stats.openTickets,"Open Tickets",      "#3b82f6"],
              ].map(([icon, num, label, color]) => (
                <div className="stat-card" key={label}>
                  <div style={{ fontSize:24 }}>{icon}</div>
                  <p className="stat-num" style={{ color }}>{num}</p>
                  <p className="stat-label">{label}</p>
                </div>
              ))}
            </div>

            {/* Booking status breakdown */}
            <div className="ad-card">
              <strong style={{ fontSize:15 }}>Booking Status Breakdown</strong>
              {["Pending","Approved","Out for Delivery","Delivered"].map(s => {
                const count = allBookings.filter(b=>b.status===s).length;
                const pct   = allBookings.length ? Math.round((count/allBookings.length)*100) : 0;
                return (
                  <div key={s} style={{ margin:"12px 0" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                      <span>{s}</span><span style={{ opacity:0.5 }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.1)" }}>
                      <div style={{ height:"100%", borderRadius:3, width:`${pct}%`, background:statusColor(s), transition:".4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </>
  );
}
