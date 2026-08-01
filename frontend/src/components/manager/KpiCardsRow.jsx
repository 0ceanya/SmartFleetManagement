import React from "react";
import { METRICS } from "./ReportBuilderPanel";

function formatNumber(n) {
  if (n === null || n === undefined) return "-";
  return Number(n).toLocaleString();
}

const FLEET_WIDE_KEYS = ["totalCargoWeightKg", "revenue"];

export default function KpiCardsRow({ report, visibleMetrics }) {
  if (!report) {
    return <p className="text-sm text-gray-500">Generate or select a report to see KPIs.</p>;
  }

  const cards = METRICS.filter((m) => visibleMetrics.includes(m.key)).map((m) => {
    let value = report[m.key];
    if (m.key === "totalCargoWeightKg") value = `${formatNumber(value)} kg`;
    else if (m.key === "revenue") value = formatNumber(value);
    else value = formatNumber(value);
    return { ...m, value, fleetWide: FLEET_WIDE_KEYS.includes(m.key) };
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.key} className="bg-white border border-gray-200 p-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            {card.label}
          </span>
          <p className="text-2xl font-bold text-black">{card.value}</p>
          {card.fleetWide && <span className="text-xs text-gray-400">(fleet-wide)</span>}
        </div>
      ))}
    </div>
  );
}
