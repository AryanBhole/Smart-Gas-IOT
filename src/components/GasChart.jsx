// src/components/GasChart.jsx
import React, { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement, PointElement, LinearScale,
  CategoryScale, Tooltip, Filler, Legend
);

const MAX_POINTS = 12;

export default function GasChart({ percentage }) {
  const chartRef  = useRef(null);
  const labelsRef = useRef([]);
  const dataRef   = useRef([]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const time = new Date().toLocaleTimeString();
    labelsRef.current.push(time);
    dataRef.current.push(percentage);

    if (labelsRef.current.length > MAX_POINTS) {
      labelsRef.current.shift();
      dataRef.current.shift();
    }

    chart.data.labels                = [...labelsRef.current];
    chart.data.datasets[0].data     = [...dataRef.current];
    chart.update("none");
  }, [percentage]);

  const data = {
    labels:   [],
    datasets: [{
      label:           "Gas %",
      data:            [],
      borderWidth:     3,
      tension:         0.4,
      borderColor:     "#ef4444",
      backgroundColor: "rgba(239,68,68,0.1)",
      fill:            true,
      pointRadius:     3,
    }],
  };

  const options = {
    responsive: true,
    animation:  false,
    plugins: {
      legend: { labels: { color: "white", font: { family: "Poppins" } } },
    },
    scales: {
      x: { ticks: { color: "#aaa", maxRotation: 45 }, grid: { color: "#333" } },
      y: {
        ticks: { color: "#aaa" },
        grid:  { color: "#333" },
        min: 0, max: 100,
      },
    },
  };

  return <Line ref={chartRef} data={data} options={options} />;
}
