import React from "react";

export default function WidgetCard({ title, subtitle, action, children }) {
  return (
    <div className="bg-white border border-gray-300 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="border-b border-gray-200 bg-tertiary px-4 py-2 shrink-0 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-heading font-bold text-sm text-secondary uppercase tracking-wider">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
