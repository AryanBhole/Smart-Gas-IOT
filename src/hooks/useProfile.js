// src/hooks/useProfile.js
// Read/write user profile data in Firebase.

import { useEffect, useState, useCallback } from "react";
import { db } from "../services/firebase";
import { ref, onValue, set } from "firebase/database";

export function useProfile(userId) {
  const [profile, setProfile] = useState({
    name: "", address: "", email: "", connectionId: "", cylinderType: "14.2 kg",
  });

  useEffect(() => {
    if (!userId) return;
    const key = userId.replace(/[^a-zA-Z0-9]/g, "_");
    return onValue(ref(db, `profiles/${key}`), (snap) => {
      if (snap.exists()) setProfile(snap.val());
    });
  }, [userId]);

  const saveProfile = useCallback((uid, data) => {
    const key = uid.replace(/[^a-zA-Z0-9]/g, "_");
    return set(ref(db, `profiles/${key}`), data);
  }, []);

  return { profile, saveProfile };
}
