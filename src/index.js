// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
// StrictMode removed intentionally — Firebase RecaptchaVerifier
// breaks under double-mount behaviour in development StrictMode.
root.render(<App />);
