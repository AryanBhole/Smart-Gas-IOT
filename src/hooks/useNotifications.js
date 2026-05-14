// src/hooks/useNotifications.js
// Real-time in-app notifications stored in Firebase.

import { useEffect, useState, useCallback } from "react";
import { db } from "../services/firebase";
import { ref, onValue, push, set, remove } from "firebase/database";

// Sanitise userId so Firebase path never contains + / special chars
const sanitise = (uid) => uid?.replace(/[^a-zA-Z0-9]/g, "_") ?? "";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const safeKey = sanitise(userId);

  useEffect(() => {
    if (!safeKey) return;
    return onValue(ref(db, `notifications/${safeKey}`), (snap) => {
      const list = [];
      snap.forEach((c) => list.push({ key: c.key, ...c.val() }));
      setNotifications(list.reverse());
    });
  }, [safeKey]);

  const addNotification = useCallback((uid, message, type = "info") => {
    const k = sanitise(uid);
    return push(ref(db, `notifications/${k}`), {
      message,
      type,
      read:      false,
      timestamp: Date.now(),
      time:      new Date().toLocaleTimeString(),
    });
  }, []);

  const markRead = useCallback((uid, notifKey) => {
    return set(ref(db, `notifications/${sanitise(uid)}/${notifKey}/read`), true);
  }, []);

  const markAllRead = useCallback((uid) => {
    const k = sanitise(uid);
    notifications.forEach((n) => {
      if (!n.read) set(ref(db, `notifications/${k}/${n.key}/read`), true);
    });
  }, [notifications]);

  const clearAll = useCallback((uid) => {
    return remove(ref(db, `notifications/${sanitise(uid)}`));
  }, []);

  return { notifications, unreadCount, addNotification, markRead, markAllRead, clearAll };
}
