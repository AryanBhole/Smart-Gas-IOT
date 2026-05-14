// src/hooks/useBookings.js

import { useEffect, useState, useCallback } from "react";
import { db } from "../services/firebase";
import {
  ref, onValue, push, remove, query,
  orderByChild, equalTo, set
} from "firebase/database";

export function useBookings(userId) {
  const [bookings,       setBookings]       = useState([]);  // user's own bookings
  const [allBookings,    setAllBookings]    = useState([]);  // admin: every booking
  const [deliveryStatus, setDeliveryStatus] = useState("No Booking");

  // ── User's own bookings (dashboard history + delivery status) ──
  // FIX: was reading from "history/" which is never written to.
  // Now reads from "bookings/" filtered by userId.
  useEffect(() => {
    if (!userId) return;
    const q = query(
      ref(db, "bookings"),
      orderByChild("userId"),
      equalTo(userId)
    );
    return onValue(q, (snap) => {
      if (!snap.exists()) {
        setBookings([]);
        setDeliveryStatus("No Booking");
        return;
      }
      const list = [];
      let lastStatus = "";
      snap.forEach((c) => {
        list.push({ key: c.key, ...c.val() });
        lastStatus = c.val().status;
      });
      // Most recent first
      setBookings(list.reverse());
      setDeliveryStatus(lastStatus);
    });
  }, [userId]);

  // ── Admin: all bookings ──
  useEffect(() => {
    return onValue(ref(db, "bookings"), (snap) => {
      const list = [];
      snap.forEach((c) => list.push({ key: c.key, ...c.val() }));
      setAllBookings(list.reverse());
    });
  }, []);

  const manualBook = useCallback((uid) => {
    return push(ref(db, "bookings"), {
      userId:    uid,
      date:      new Date().toLocaleDateString(),
      time:      new Date().toLocaleTimeString(),
      status:    "Pending",
      type:      "Manual",
    });
  }, []);

  const autoBook = useCallback((uid) => {
    return push(ref(db, "bookings"), {
      userId:    uid,
      date:      new Date().toLocaleDateString(),
      time:      new Date().toLocaleTimeString(),
      status:    "Pending",
      type:      "Auto",
    });
  }, []);

  const updateStatus = useCallback((id, status) => {
    return set(ref(db, `bookings/${id}/status`), status);
  }, []);

  const cancelBooking = useCallback((id) => {
    return remove(ref(db, `bookings/${id}`));
  }, []);

  // kept for backward compat — now same as cancelBooking
  const cancelHistory = cancelBooking;

  const clearHistory = useCallback((uid) => {
    // Remove only this user's bookings one by one
    // (we can't bulk-delete a filtered query in RTDB)
    return null; // handled in DashboardPage with the bookings list
  }, []);

  return {
    bookings,
    allBookings,
    deliveryStatus,
    manualBook,
    autoBook,
    updateStatus,
    cancelBooking,
    cancelHistory,
    clearHistory,
  };
}
