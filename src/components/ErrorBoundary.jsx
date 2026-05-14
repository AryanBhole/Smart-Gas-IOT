// src/components/ErrorBoundary.jsx
// Catches runtime errors and shows a friendly recovery screen
// instead of a blank white page.
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    const isPermission = error?.message?.toLowerCase().includes("permission");
    return {
      hasError: true,
      message: isPermission
        ? "Session expired or permission denied. Please log in again."
        : error?.message ?? "Something went wrong.",
    };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReload = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", background: "#020617", color: "white",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "Poppins, sans-serif", padding: "20px", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: "#ef4444", marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ opacity: 0.6, fontSize: 14, maxWidth: 360, marginBottom: 28 }}>
          {this.state.message}
        </p>
        <button
          onClick={this.handleReload}
          style={{
            background: "#ef4444", color: "white", border: "none",
            padding: "12px 28px", borderRadius: 10, cursor: "pointer",
            fontSize: 15, fontFamily: "Poppins, sans-serif",
          }}
        >
          🔄 Go to Login
        </button>
      </div>
    );
  }
}
