// src/components/Navbar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../hooks/useNotifications";
import { useWallet } from "../hooks/useWallet";

export default function Navbar({ userId }) {
  const navigate      = useNavigate();
  const location      = useLocation();
  const { showToast } = useToast();
  const { unreadCount }           = useNotifications(userId);
  const { balance, CYLINDER_PRICE } = useWallet(userId);

  const logout = () => {
    signOut(auth).then(() => {
      localStorage.clear();
      showToast("Logged Out Successfully 👋", "info");
      setTimeout(() => navigate("/"), 1000);
    });
  };

  const isActive = (path) => location.pathname === path;

  const NavBtn = ({ path, label, badge }) => (
    <button
      onClick={() => navigate(path)}
      style={{
        background:   isActive(path) ? "rgba(239,68,68,0.2)" : "transparent",
        border:       isActive(path) ? "1px solid rgba(239,68,68,0.4)" : "1px solid transparent",
        padding:      "7px 13px",
        borderRadius: "8px",
        color:        isActive(path) ? "#ef4444" : "#aaa",
        cursor:       "pointer",
        fontSize:     "13px",
        fontFamily:   "Poppins, sans-serif",
        transition:   ".2s",
        position:     "relative",
        whiteSpace:   "nowrap",
      }}
    >
      {label}
      {badge > 0 && (
        <span style={{
          position:"absolute", top:"-6px", right:"-6px",
          background:"#ef4444", color:"white", borderRadius:"50%",
          width:"18px", height:"18px", fontSize:"10px",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:700,
        }}>
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );

  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"12px 20px", background:"#0f172a",
      flexWrap:"wrap", gap:"10px",
      borderBottom:"1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Logo */}
      <div
        style={{ fontSize:"19px", fontWeight:"bold", color:"#ef4444", cursor:"pointer" }}
        onClick={() => navigate("/dashboard")}
      >
        🔥 Smart Gas
      </div>

      {/* Nav links */}
      <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
        <NavBtn path="/dashboard" label="🏠 Dashboard" />
        <NavBtn path="/support"   label="🎧 Support" />

        {/* Wallet — shows balance; red if insufficient */}
        <button
          onClick={() => navigate("/wallet")}
          style={{
            background:   isActive("/wallet")
              ? "rgba(59,130,246,0.2)"
              : balance < CYLINDER_PRICE
                ? "rgba(239,68,68,0.1)"
                : "transparent",
            border:       isActive("/wallet")
              ? "1px solid rgba(59,130,246,0.4)"
              : balance < CYLINDER_PRICE
                ? "1px solid rgba(239,68,68,0.3)"
                : "1px solid transparent",
            padding:      "7px 13px",
            borderRadius: "8px",
            color:        isActive("/wallet")
              ? "#93c5fd"
              : balance < CYLINDER_PRICE ? "#ef4444" : "#aaa",
            cursor:       "pointer",
            fontSize:     "13px",
            fontFamily:   "Poppins, sans-serif",
            transition:   ".2s",
            whiteSpace:   "nowrap",
          }}
        >
          💰 ₹{balance.toLocaleString("en-IN")}
          {balance < CYLINDER_PRICE && " ⚠️"}
        </button>

        <NavBtn path="/profile" label="👤 Profile" badge={unreadCount} />

        {userId && (
          <span style={{ fontSize:"12px", opacity:0.35, padding:"0 2px" }}>
            {userId.length > 12 ? userId.slice(0,12)+"…" : userId}
          </span>
        )}

        <button
          onClick={logout}
          style={{
            background:"#ef4444", padding:"8px 15px",
            border:"none", borderRadius:"8px", color:"white",
            cursor:"pointer", fontSize:"13px", fontFamily:"Poppins, sans-serif",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
