// src/components/CylinderSVG.jsx
// Reusable animated cylinder used on Login and Dashboard pages.

import React from "react";

const PATH =
  "M60 40 Q60 10 100 10 Q140 10 140 40 L140 240 Q140 280 100 280 Q60 280 60 240 Z";

// fillColor: green / amber / red based on gas %
// yOffset: 260 - (percent * 1.8) — same formula as original
function getColor(percent) {
  if (percent < 20) return "#ef4444";
  if (percent < 60) return "#f59e0b";
  return "#22c55e";
}

export default function CylinderSVG({ percent = 0, animate = false }) {
  const y     = 260 - percent * 1.8;
  const color = getColor(percent);

  return (
    <svg
      viewBox="0 0 200 300"
      style={
        animate
          ? { width: "100%", animation: "float 3s ease-in-out infinite" }
          : { width: "100%" }
      }
    >
      <defs>
        <clipPath id="clip">
          <path d={PATH} />
        </clipPath>
      </defs>

      {/* Cylinder outline */}
      <path
        d={PATH}
        fill="none"
        stroke="#ef4444"
        strokeWidth="6"
      />

      {/* Gas fill level */}
      <rect
        clipPath="url(#clip)"
        x="0"
        y={y}
        width="200"
        height="200"
        fill={color}
        style={
          animate
            ? { animation: "fillGas 4s ease-in-out infinite" }
            : { transition: "y 0.8s ease, fill 0.5s ease" }
        }
      />
    </svg>
  );
}
