// src/hooks/useWallet.js
// Manages user wallet balance and transaction history in Firebase.

import { useEffect, useState, useCallback } from "react";
import { db } from "../services/firebase";
import { ref, onValue, set, push, get } from "firebase/database";

const CYLINDER_PRICE = 899; // ₹ default price per cylinder

export function useWallet(userId) {
  const [balance,      setBalance]      = useState(0);
  const [transactions, setTransactions] = useState([]);

  const walletKey = userId?.replace(/[^a-zA-Z0-9]/g, "_");

  // Live balance
  useEffect(() => {
    if (!walletKey) return;
    return onValue(ref(db, `wallets/${walletKey}/balance`), (snap) => {
      setBalance(snap.exists() ? snap.val() : 0);
    });
  }, [walletKey]);

  // Live transaction history
  useEffect(() => {
    if (!walletKey) return;
    return onValue(ref(db, `wallets/${walletKey}/transactions`), (snap) => {
      const list = [];
      snap.forEach((c) => list.push({ key: c.key, ...c.val() }));
      setTransactions(list.reverse());
    });
  }, [walletKey]);

  // Add money to wallet
  const addMoney = useCallback(async (amount) => {
    if (!walletKey || amount <= 0) return { ok: false, msg: "Invalid amount" };
    const balRef  = ref(db, `wallets/${walletKey}/balance`);
    const snap    = await get(balRef);
    const current = snap.exists() ? snap.val() : 0;
    await set(balRef, current + amount);
    await push(ref(db, `wallets/${walletKey}/transactions`), {
      type:      "credit",
      amount,
      label:     "Wallet Top-up",
      date:      new Date().toLocaleDateString(),
      time:      new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      balance:   current + amount,
    });
    return { ok: true };
  }, [walletKey]);

  // Deduct money (returns { ok, msg })
  const deductMoney = useCallback(async (amount, label = "Cylinder Booking") => {
    if (!walletKey) return { ok: false, msg: "No wallet" };
    const balRef  = ref(db, `wallets/${walletKey}/balance`);
    const snap    = await get(balRef);
    const current = snap.exists() ? snap.val() : 0;
    if (current < amount) return { ok: false, msg: "Insufficient balance" };
    const newBal = current - amount;
    await set(balRef, newBal);
    await push(ref(db, `wallets/${walletKey}/transactions`), {
      type:      "debit",
      amount,
      label,
      date:      new Date().toLocaleDateString(),
      time:      new Date().toLocaleTimeString(),
      timestamp: Date.now(),
      balance:   newBal,
    });
    return { ok: true, newBalance: newBal };
  }, [walletKey]);

  return { balance, transactions, addMoney, deductMoney, CYLINDER_PRICE };
}
