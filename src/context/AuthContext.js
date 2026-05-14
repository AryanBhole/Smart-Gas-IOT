// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        console.log("[Auth] Logged in as:", user.phoneNumber ?? user.uid);

        // Force-refresh the token so it never silently expires mid-session
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          const expiry = new Date(idTokenResult.expirationTime);
          setTokenExpiry(expiry);
          console.log("[Auth] Token valid until:", expiry.toLocaleTimeString());

          // Auto-refresh token 5 min before it expires (tokens last 1 hour)
          const msUntilExpiry = expiry.getTime() - Date.now() - 5 * 60 * 1000;
          if (msUntilExpiry > 0) {
            const t = setTimeout(async () => {
              try {
                await user.getIdToken(true); // force refresh
                console.log("[Auth] Token silently refreshed ✅");
              } catch (err) {
                console.warn("[Auth] Token refresh failed:", err.message);
              }
            }, msUntilExpiry);
            return () => clearTimeout(t);
          }
        } catch (err) {
          console.warn("[Auth] Could not get token result:", err.message);
        }
      } else {
        setTokenExpiry(null);
      }
    });

    return unsub;
  }, []);

  const userId = currentUser?.phoneNumber ?? currentUser?.uid ?? null;

  return (
    <AuthContext.Provider value={{ currentUser, userId, loading, tokenExpiry }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
