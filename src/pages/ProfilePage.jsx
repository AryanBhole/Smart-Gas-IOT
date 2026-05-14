// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useProfile } from "../hooks/useProfile";
import { useNotifications } from "../hooks/useNotifications";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const navigate        = useNavigate();
  const { currentUser, userId: authUserId } = useAuth();
  const { showToast }   = useToast();
  const userId = authUserId ?? "Guest";

  const { profile, saveProfile }                             = useProfile(userId);
  const { notifications, markRead, markAllRead, clearAll }   = useNotifications(userId);

  const [form,     setForm]     = useState(profile);
  const [tab,      setTab]      = useState("profile");  // profile | notifications
  const [editing,  setEditing]  = useState(false);

  useEffect(() => { if (!currentUser) navigate("/"); }, [currentUser, navigate]);
  useEffect(() => { setForm(profile); }, [profile]);

  const handleSave = async () => {
    await saveProfile(userId, form);
    setEditing(false);
    showToast("Profile saved ✅", "success");
  };

  const notifColor = (type) => ({
    success: "#22c55e", error: "#ef4444",
    warning: "#f59e0b", info: "#3b82f6",
  }[type] ?? "#3b82f6");

  const notifIcon = (type) => ({
    success:"✅", error:"❌", warning:"⚠️", info:"ℹ️"
  }[type] ?? "ℹ️");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; font-family:Poppins; background:linear-gradient(120deg,#020617,#111827); color:white; min-height:100vh; }
        .pr-wrap { max-width:700px; margin:0 auto; padding:24px 16px; }
        .pr-tabs { display:flex; gap:8px; margin-bottom:20px; }
        .pr-tab { flex:1; padding:10px; border:none; border-radius:10px; cursor:pointer; font-family:Poppins; font-size:14px; font-weight:500; background:rgba(255,255,255,0.07); color:#aaa; transition:.2s; }
        .pr-tab.active { background:#ef4444; color:white; }
        .pr-card { background:rgba(255,255,255,0.05); border-radius:16px; padding:24px; backdrop-filter:blur(8px); }
        .avatar { width:80px; height:80px; border-radius:50%; background:#ef4444; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:700; margin:0 auto 16px; }
        .pr-label { font-size:11px; opacity:0.5; margin:14px 0 4px; letter-spacing:.5px; text-transform:uppercase; }
        .pr-value { font-size:15px; font-weight:500; }
        .pr-input { width:100%; padding:11px 14px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background:rgba(255,255,255,0.07); color:white; font-family:Poppins; font-size:14px; outline:none; margin-top:4px; }
        .pr-input:focus { border-color:#ef4444; }
        .pr-btn { width:100%; padding:12px; border:none; border-radius:10px; background:#ef4444; color:white; font-family:Poppins; font-size:15px; cursor:pointer; margin-top:16px; transition:.2s; }
        .pr-btn:hover { background:#dc2626; }
        .pr-btn.secondary { background:rgba(255,255,255,0.07); margin-top:8px; }
        .notif-item { display:flex; gap:12px; align-items:flex-start; padding:12px; border-radius:10px; margin:6px 0; transition:.2s; cursor:pointer; }
        .notif-item:hover { background:rgba(255,255,255,0.05); }
        .notif-item.unread { background:rgba(255,255,255,0.07); }
        .notif-dot { width:8px; height:8px; border-radius:50%; margin-top:5px; flex-shrink:0; }
        .notif-actions { display:flex; gap:8px; margin-top:12px; }
        .notif-action-btn { flex:1; padding:9px; border:none; border-radius:8px; font-family:Poppins; font-size:13px; cursor:pointer; }
        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; }
        .empty-state { text-align:center; opacity:0.4; padding:40px 0; font-size:14px; }
      `}</style>

      <Navbar userId={userId} />

      <div className="pr-wrap">
        <h2 style={{ marginBottom:6 }}>👤 My Account</h2>
        <p style={{ opacity:0.5, fontSize:13, marginBottom:20 }}>
          Manage your profile and view notifications.
        </p>

        <div className="pr-tabs">
          <button className={`pr-tab${tab==="profile"?" active":""}`} onClick={() => setTab("profile")}>
            👤 Profile
          </button>
          <button className={`pr-tab${tab==="notifications"?" active":""}`} onClick={() => setTab("notifications")}>
            🔔 Notifications {notifications.filter(n=>!n.read).length > 0 && `(${notifications.filter(n=>!n.read).length})`}
          </button>
        </div>

        {/* ── Profile Tab ── */}
        {tab === "profile" && (
          <div className="pr-card">
            <div className="avatar">
              {(form.name?.[0] || userId?.[0] || "U").toUpperCase()}
            </div>
            <p style={{ textAlign:"center", margin:"0 0 4px", fontSize:18, fontWeight:600 }}>
              {form.name || "Your Name"}
            </p>
            <p style={{ textAlign:"center", opacity:0.5, fontSize:13, margin:0 }}>{userId}</p>

            {editing ? (
              <>
                <div className="pr-label">Full Name</div>
                <input className="pr-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your full name" />

                <div className="pr-label">Email</div>
                <input className="pr-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com" />

                <div className="pr-label">Address</div>
                <input className="pr-input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Delivery address" />

                <div className="pr-label">LPG Connection ID</div>
                <input className="pr-input" value={form.connectionId} onChange={e=>setForm({...form,connectionId:e.target.value})} placeholder="e.g. MH1234567" />

                <div className="pr-label">Cylinder Type</div>
                <select className="pr-input" value={form.cylinderType} onChange={e=>setForm({...form,cylinderType:e.target.value})}>
                  <option>14.2 kg</option>
                  <option>5 kg</option>
                  <option>19 kg (Commercial)</option>
                </select>

                <button className="pr-btn" onClick={handleSave}>💾 Save Profile</button>
                <button className="pr-btn secondary" onClick={() => { setEditing(false); setForm(profile); }}>Cancel</button>
              </>
            ) : (
              <>
                <div className="info-grid">
                  {[
                    ["Email",         form.email        || "—"],
                    ["Address",       form.address      || "—"],
                    ["Connection ID", form.connectionId || "—"],
                    ["Cylinder",      form.cylinderType || "14.2 kg"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding:"10px 0" }}>
                      <div className="pr-label">{label}</div>
                      <div className="pr-value">{value}</div>
                    </div>
                  ))}
                </div>
                <button className="pr-btn" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              </>
            )}
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {tab === "notifications" && (
          <div className="pr-card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ margin:0 }}>Notifications</h3>
              <span style={{ fontSize:12, opacity:0.5 }}>
                {notifications.filter(n=>!n.read).length} unread
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="empty-state">No notifications yet 🔕</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.key}
                  className={`notif-item${!n.read?" unread":""}`}
                  onClick={() => markRead(userId, n.key)}
                >
                  <div className="notif-dot" style={{ background: notifColor(n.type) }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14 }}>{notifIcon(n.type)} {n.message}</div>
                    <div style={{ fontSize:11, opacity:0.5, marginTop:3 }}>{n.time}</div>
                  </div>
                  {!n.read && (
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#ef4444", flexShrink:0, marginTop:5 }} />
                  )}
                </div>
              ))
            )}

            {notifications.length > 0 && (
              <div className="notif-actions">
                <button className="notif-action-btn" style={{ background:"rgba(255,255,255,0.07)", color:"white" }}
                  onClick={() => markAllRead(userId)}>
                  ✓ Mark all read
                </button>
                <button className="notif-action-btn" style={{ background:"rgba(239,68,68,0.15)", color:"#ef4444" }}
                  onClick={() => clearAll(userId)}>
                  🗑 Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
