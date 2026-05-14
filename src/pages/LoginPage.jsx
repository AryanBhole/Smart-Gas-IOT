// src/pages/LoginPage.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useToast } from "../context/ToastContext";
import CylinderSVG from "../components/CylinderSVG";

export default function LoginPage() {
  const navigate          = useNavigate();
  const { showToast }     = useToast();
  const [phone, setPhone] = useState("");
  const [otp, setOtp]     = useState("");
  const confirmationRef   = useRef(null);

  const sendOTP = async () => {
    if (!phone) { showToast("Enter Phone Number 📱", "info"); return; }

    // Clear any stale verifier from a previous attempt
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch (_) {}
      window.recaptchaVerifier = null;
    }

    try {
      // Use the DOM element directly — never a string.
      // Arg order: (element, params, auth) — this is the correct
      // order for firebase/auth bundled with react-scripts 5 (v9.6–9.23).
      const el = document.getElementById("recaptcha-container");

      window.recaptchaVerifier = new RecaptchaVerifier(
        el,
        { size: "normal" },
        auth
      );

      await window.recaptchaVerifier.render();

      const result = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier
      );

      confirmationRef.current = result;
      showToast("OTP Sent Successfully ✅", "success");

    } catch (err) {
      try { window.recaptchaVerifier?.clear(); } catch (_) {}
      window.recaptchaVerifier = null;
      showToast(err.message, "error");
    }
  };

  const verifyOTP = async () => {
    if (!otp) { showToast("Enter OTP 🔑", "info"); return; }
    if (!confirmationRef.current) {
      showToast("Please send OTP first 📱", "info");
      return;
    }
    try {
      await confirmationRef.current.confirm(otp);
      showToast("Login Successful 🎉", "success");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch {
      showToast("Wrong OTP ❌", "error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap');
        body { margin:0; font-family:Poppins; background:#020617; height:100vh; overflow:hidden; color:white; }
        .blob { position:absolute; width:400px; height:400px; background:radial-gradient(circle,#ef4444,transparent); filter:blur(120px); animation:move 12s infinite alternate; }
        .blob2 { background:radial-gradient(circle,#3b82f6,transparent); animation-duration:15s; }
        @keyframes move { from{transform:translate(-100px,-100px)} to{transform:translate(200px,150px)} }
        .login-card { background:rgba(255,255,255,0.05); backdrop-filter:blur(20px); padding:40px; border-radius:25px; width:360px; text-align:center; box-shadow:0 0 50px rgba(0,0,0,0.6); animation:fade 1s ease; position:relative; z-index:1; }
        @keyframes fade { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
        .cylinder-box { width:120px; margin:auto; }
        @keyframes float { 0%{transform:translateY(0)} 50%{transform:translateY(-10px)} 100%{transform:translateY(0)} }
        @keyframes fillGas { 0%{y:200} 50%{y:120} 100%{y:200} }
        .login-input { width:90%; padding:13px; margin:10px auto; border:none; border-radius:10px; outline:none; transition:.3s; font-family:Poppins; font-size:14px; background:#1e293b; color:white; display:block; }
        .login-input:focus { transform:scale(1.05); box-shadow:0 0 10px #ef4444; }
        .login-btn { padding:13px 30px; border:none; background:#ef4444; color:white; border-radius:10px; cursor:pointer; margin-top:10px; transition:.3s; font-family:Poppins; font-size:14px; width:90%; }
        .login-btn:hover { background:#dc2626; transform:scale(1.05); }
      `}</style>

      <div className="blob" />
      <div className="blob blob2" />

      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh" }}>
        <div className="login-card">

          <div className="cylinder-box">
            <CylinderSVG percent={50} animate />
          </div>

          <h2>Smart Gas Booking</h2>

          <input
            className="login-input"
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div id="recaptcha-container" style={{ margin:"10px auto" }} />

          <button className="login-btn" onClick={sendOTP}>Send OTP</button>

          <input
            className="login-input"
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <button className="login-btn" onClick={verifyOTP}>Verify</button>

        </div>
      </div>
    </>
  );
}
