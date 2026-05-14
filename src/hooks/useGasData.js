// src/hooks/useGasData.js
// Subscribes to Firebase gasData node, returns live weight + percentage.

import { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { ref, onValue } from "firebase/database";

export function useGasData() {
  const [gasData, setGasData] = useState({ weight: 0, percentage: 0, lowGas: "NO" });

  useEffect(() => {
    const gasRef = ref(db, "gasData");
    const unsub  = onValue(gasRef, (snap) => {
      if (snap.exists()) {
        setGasData({
          weight:     snap.val().weight     ?? 0,
          percentage: snap.val().percentage ?? 0,
          lowGas:     snap.val().lowGas     ?? "NO",
        });
      }
    });
    return unsub;
  }, []);

  return gasData;
}
