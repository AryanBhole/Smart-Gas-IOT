// src/hooks/useSupport.js
// Manages customer support tickets and live chat messages in Firebase.

import { useEffect, useState, useCallback } from "react";
import { db } from "../services/firebase";
import {
  ref, onValue, push, set, serverTimestamp, query, orderByChild, equalTo
} from "firebase/database";

export function useSupport(userId) {
  const [myTickets,  setMyTickets]  = useState([]);
  const [allTickets, setAllTickets] = useState([]); // admin
  const [messages,   setMessages]   = useState([]); // chat for open ticket
  const [activeTicket, setActiveTicket] = useState(null);

  // User: their tickets
  useEffect(() => {
    if (!userId) return;
    const q = query(ref(db, "support"), orderByChild("userId"), equalTo(userId));
    return onValue(q, (snap) => {
      const list = [];
      snap.forEach((c) => list.push({ key: c.key, ...c.val() }));
      setMyTickets(list.reverse());
    });
  }, [userId]);

  // Admin: all tickets
  useEffect(() => {
    return onValue(ref(db, "support"), (snap) => {
      const list = [];
      snap.forEach((c) => list.push({ key: c.key, ...c.val() }));
      setAllTickets(list.reverse());
    });
  }, []);

  // Live chat messages for active ticket
  useEffect(() => {
    if (!activeTicket) return;
    return onValue(ref(db, `support/${activeTicket}/messages`), (snap) => {
      const list = [];
      snap.forEach((c) => list.push({ key: c.key, ...c.val() }));
      setMessages(list);
    });
  }, [activeTicket]);

  const raiseTicket = useCallback((uid, subject, description) => {
    return push(ref(db, "support"), {
      userId:      uid,
      subject,
      description,
      status:      "Open",
      priority:    "Normal",
      date:        new Date().toLocaleDateString(),
      timestamp:   Date.now(),
    });
  }, []);

  const sendMessage = useCallback((ticketId, sender, text) => {
    return push(ref(db, `support/${ticketId}/messages`), {
      sender,
      text,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
    });
  }, []);

  const closeTicket = useCallback((ticketId) => {
    return set(ref(db, `support/${ticketId}/status`), "Closed");
  }, []);

  const updatePriority = useCallback((ticketId, priority) => {
    return set(ref(db, `support/${ticketId}/priority`), priority);
  }, []);

  const resolveTicket = useCallback((ticketId) => {
    return set(ref(db, `support/${ticketId}/status`), "Resolved");
  }, []);

  return {
    myTickets,
    allTickets,
    messages,
    activeTicket,
    setActiveTicket,
    raiseTicket,
    sendMessage,
    closeTicket,
    updatePriority,
    resolveTicket,
  };
}
