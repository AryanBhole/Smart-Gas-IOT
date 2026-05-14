// src/pages/SupportPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useSupport } from "../hooks/useSupport";
import Navbar from "../components/Navbar";

const FAQS = [
  { q: "How does auto booking work?", a: "When your gas level drops below 20%, the system automatically raises a booking request on your behalf. You'll get a notification instantly." },
  { q: "How long does delivery take?", a: "Standard delivery takes 1–2 business days after the agency approves your request. You can track the status on your dashboard." },
  { q: "What if my cylinder weight reading is wrong?", a: "Ensure the load cell is on a flat surface and the cylinder is placed centrally. Try recalibrating by taring the scale with an empty cylinder." },
  { q: "How do I cancel a booking?", a: "Go to your Dashboard → Booking History and tap Cancel next to the booking. You can only cancel while status is Pending." },
  { q: "Who do I contact for a gas leak emergency?", a: "Immediately close the cylinder valve, open windows and doors, and call 1906 (LPG emergency helpline). Do NOT use any electrical switches." },
];

export default function SupportPage() {
  const navigate        = useNavigate();
  const { currentUser, userId: authUserId } = useAuth();
  const { showToast }   = useToast();
  const userId = authUserId ?? "Guest";

  const {
    myTickets, messages, activeTicket,
    setActiveTicket, raiseTicket, sendMessage, closeTicket,
  } = useSupport(userId);

  const [tab,      setTab]      = useState("chat");   // chat | tickets | faq
  const [subject,  setSubject]  = useState("");
  const [desc,     setDesc]     = useState("");
  const [msgText,  setMsgText]  = useState("");
  const [openFaq,  setOpenFaq]  = useState(null);
  const chatEndRef              = useRef(null);

  useEffect(() => { if (!currentUser) navigate("/"); }, [currentUser, navigate]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleRaise = async () => {
    if (!subject.trim()) { showToast("Enter a subject 📝", "info"); return; }
    const snap = await raiseTicket(userId, subject, desc);
    setActiveTicket(snap.key);
    setSubject(""); setDesc("");
    setTab("chat");
    showToast("Ticket raised ✅ Support will reply shortly", "success");
  };

  const handleSend = () => {
    if (!msgText.trim() || !activeTicket) return;
    sendMessage(activeTicket, userId, msgText.trim());
    setMsgText("");
  };

  const handleClose = () => {
    closeTicket(activeTicket);
    setActiveTicket(null);
    showToast("Ticket closed", "info");
  };

  const statusColor = (s) =>
    s === "Open" ? "#22c55e" : s === "Resolved" ? "#3b82f6" : "#6b7280";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap');
        * { box-sizing:border-box; }
        body { margin:0; font-family:Poppins; background:linear-gradient(120deg,#020617,#111827); color:white; min-height:100vh; }
        .sp-wrap { max-width:860px; margin:0 auto; padding:24px 16px; }
        .sp-tabs { display:flex; gap:8px; margin-bottom:20px; }
        .sp-tab { flex:1; padding:10px; border:none; border-radius:10px; cursor:pointer; font-family:Poppins; font-size:14px; font-weight:500; background:rgba(255,255,255,0.07); color:#aaa; transition:.2s; }
        .sp-tab.active { background:#ef4444; color:white; }
        .sp-card { background:rgba(255,255,255,0.05); border-radius:16px; padding:20px; backdrop-filter:blur(8px); }
        .sp-input { width:100%; padding:11px 14px; margin:8px 0; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background:rgba(255,255,255,0.07); color:white; font-family:Poppins; font-size:14px; outline:none; }
        .sp-input:focus { border-color:#ef4444; }
        textarea.sp-input { resize:vertical; min-height:80px; }
        .sp-btn { width:100%; padding:12px; border:none; border-radius:10px; background:#ef4444; color:white; font-family:Poppins; font-size:15px; cursor:pointer; margin-top:8px; transition:.2s; }
        .sp-btn:hover { background:#dc2626; }
        .sp-btn.outline { background:transparent; border:1px solid #ef4444; color:#ef4444; margin-top:6px; }
        .ticket-row { display:flex; justify-content:space-between; align-items:center; padding:12px; border-radius:10px; background:rgba(255,255,255,0.05); margin:8px 0; cursor:pointer; transition:.2s; }
        .ticket-row:hover { background:rgba(255,255,255,0.09); }
        .ticket-row.selected { border:1px solid #ef4444; }
        .badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
        .chat-box { height:320px; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:10px; }
        .chat-box::-webkit-scrollbar { width:4px; }
        .chat-box::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }
        .bubble { max-width:70%; padding:10px 14px; border-radius:14px; font-size:13px; line-height:1.5; }
        .bubble.mine { align-self:flex-end; background:#ef4444; color:white; border-bottom-right-radius:4px; }
        .bubble.theirs { align-self:flex-start; background:rgba(255,255,255,0.1); color:white; border-bottom-left-radius:4px; }
        .bubble .time { font-size:10px; opacity:0.6; margin-top:4px; }
        .chat-input-row { display:flex; gap:8px; margin-top:10px; }
        .chat-input-row input { flex:1; padding:11px 14px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background:rgba(255,255,255,0.07); color:white; font-family:Poppins; font-size:14px; outline:none; }
        .chat-input-row input:focus { border-color:#ef4444; }
        .chat-send-btn { padding:11px 18px; border:none; border-radius:10px; background:#ef4444; color:white; cursor:pointer; font-size:18px; }
        .faq-item { border-radius:10px; overflow:hidden; margin:8px 0; background:rgba(255,255,255,0.05); }
        .faq-q { padding:14px 16px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; font-size:14px; font-weight:500; }
        .faq-a { padding:0 16px 14px; font-size:13px; color:#aaa; line-height:1.6; }
        .empty-state { text-align:center; opacity:0.4; padding:40px 0; font-size:14px; }
        .hotline-box { background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:16px; margin-top:16px; text-align:center; }
      `}</style>

      <Navbar userId={userId} />

      <div className="sp-wrap">
        <h2 style={{ marginBottom:6 }}>🎧 Customer Support</h2>
        <p style={{ opacity:0.5, fontSize:13, marginBottom:20 }}>
          Raise a ticket, chat with our team, or find quick answers below.
        </p>

        {/* ── Tabs ── */}
        <div className="sp-tabs">
          {[["chat","💬 Live Chat"],["tickets","🎫 My Tickets"],["faq","❓ FAQ"]].map(([key,label]) => (
            <button key={key} className={`sp-tab${tab===key?" active":""}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ TAB: LIVE CHAT ══ */}
        {tab === "chat" && (
          <div className="sp-card">
            {!activeTicket ? (
              <>
                <h3 style={{ marginTop:0 }}>Start a new conversation</h3>
                <input
                  className="sp-input"
                  placeholder="Subject (e.g. Booking not confirmed)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <textarea
                  className="sp-input"
                  placeholder="Describe your issue…"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
                <button className="sp-btn" onClick={handleRaise}>
                  🚀 Start Chat
                </button>

                {myTickets.length > 0 && (
                  <>
                    <p style={{ marginTop:18, marginBottom:6, fontSize:13, opacity:0.6 }}>
                      Or continue an existing ticket:
                    </p>
                    {myTickets.slice(0,3).map((t) => (
                      <div
                        key={t.key}
                        className="ticket-row"
                        onClick={() => { setActiveTicket(t.key); }}
                      >
                        <span style={{ fontSize:13 }}>{t.subject}</span>
                        <span className="badge" style={{ background: statusColor(t.status)+"22", color: statusColor(t.status) }}>
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div>
                    <strong style={{ fontSize:15 }}>
                      {myTickets.find(t => t.key === activeTicket)?.subject || "Support Chat"}
                    </strong>
                    <p style={{ margin:0, fontSize:12, opacity:0.5 }}>Ticket #{activeTicket?.slice(-6)}</p>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="sp-btn outline" style={{ width:"auto", padding:"6px 14px", fontSize:13 }}
                      onClick={() => setActiveTicket(null)}>← Back</button>
                    <button className="sp-btn" style={{ width:"auto", padding:"6px 14px", fontSize:13, background:"#6b7280" }}
                      onClick={handleClose}>Close Ticket</button>
                  </div>
                </div>

                {/* Chat messages */}
                <div className="chat-box">
                  {messages.length === 0 && (
                    <div style={{ textAlign:"center", opacity:0.4, marginTop:60, fontSize:13 }}>
                      No messages yet. Say hello 👋
                    </div>
                  )}
                  {messages.map((m) => (
                    <div key={m.key} className={`bubble ${m.sender === userId ? "mine" : "theirs"}`}>
                      {m.sender !== userId && (
                        <div style={{ fontSize:10, opacity:0.6, marginBottom:3 }}>
                          {m.sender === "admin" ? "🔧 Support Agent" : m.sender}
                        </div>
                      )}
                      {m.text}
                      <div className="time">{m.time}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input row */}
                <div className="chat-input-row">
                  <input
                    placeholder="Type a message…"
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  />
                  <button className="chat-send-btn" onClick={handleSend}>➤</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ TAB: MY TICKETS ══ */}
        {tab === "tickets" && (
          <div className="sp-card">
            <h3 style={{ marginTop:0 }}>Your Tickets</h3>
            {myTickets.length === 0 ? (
              <div className="empty-state">No tickets raised yet.<br/>Go to Live Chat to create one.</div>
            ) : (
              myTickets.map((t) => (
                <div
                  key={t.key}
                  className={`ticket-row${activeTicket===t.key?" selected":""}`}
                  onClick={() => { setActiveTicket(t.key); setTab("chat"); }}
                >
                  <div>
                    <div style={{ fontSize:14, fontWeight:500 }}>{t.subject}</div>
                    <div style={{ fontSize:11, opacity:0.5, marginTop:2 }}>
                      {t.date} · #{t.key?.slice(-6)} · {t.priority}
                    </div>
                  </div>
                  <span className="badge" style={{ background: statusColor(t.status)+"22", color: statusColor(t.status) }}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══ TAB: FAQ ══ */}
        {tab === "faq" && (
          <div className="sp-card">
            <h3 style={{ marginTop:0 }}>Frequently Asked Questions</h3>
            {FAQS.map((f, i) => (
              <div className="faq-item" key={i}>
                <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span style={{ fontSize:18, transition:".2s", transform: openFaq===i?"rotate(45deg)":"none", display:"inline-block" }}>+</span>
                </div>
                {openFaq === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}

            <div className="hotline-box">
              <p style={{ margin:0, fontSize:14, fontWeight:500 }}>🚨 Emergency LPG Helpline</p>
              <p style={{ margin:"6px 0 0", fontSize:22, fontWeight:700, color:"#ef4444" }}>1906</p>
              <p style={{ margin:"4px 0 0", fontSize:12, opacity:0.5 }}>Available 24×7 · Free call</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
