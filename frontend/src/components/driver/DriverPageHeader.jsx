import React from "react";

export default function DriverPageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="bg-white border border-gray-300 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">{eyebrow}</span>
        )}
        <h1 className="text-2xl font-heading text-secondary font-bold mt-0.5">{title}</h1>
        {subtitle && <p className="text-xs font-mono text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
