// src/context/ToastContext.js
import React, { createContext, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

const SOUND_URL =
  "https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3";

export function ToastProvider({ children }) {
  const [toast, setToast]   = useState({ msg: "", type: "success", visible: false });
  const timerRef            = useRef(null);
  const audioRef            = useRef(new Audio(SOUND_URL));

  const showToast = (msg, type = "success") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type, visible: true });
    audioRef.current.play().catch(() => {});
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3000);
  };

  const COLOR_MAP = {
    success: "#22c55e",
    error:   "#ef4444",
    warning: "#f59e0b",
    info:    "#3b82f6",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast UI — same style as original */}
      <div
        style={{
          position:     "fixed",
          top:          "30px",
          right:        toast.visible ? "30px" : "-350px",
          background:   COLOR_MAP[toast.type] || COLOR_MAP.success,
          color:        "white",
          padding:      "16px 24px",
          borderRadius: "12px",
          fontWeight:   500,
          boxShadow:    "0 10px 30px rgba(0,0,0,0.4)",
          transition:   "right 0.4s",
          zIndex:       9999,
          fontFamily:   "Poppins, sans-serif",
        }}
      >
        {toast.msg}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
