import React from "react";

const TONE_CLASSES = {
  amber: "bg-amber-50 border-amber-200 text-amber-800",
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
  blue: "bg-blue-50 border-blue-200 text-blue-800",
};

export default function DriverStatTile({ label, value, tone = "amber" }) {
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.amber;
  return (
    <div className={`border p-4 text-center ${toneClass}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider block">{label}</span>
      <span className="text-2xl font-heading font-bold">{value}</span>
    </div>
  );
}
