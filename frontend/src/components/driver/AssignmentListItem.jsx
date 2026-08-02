"use client";

import React from "react";
import Link from "next/link";

function formatCreatedAt(item) {
  return item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A";
}

export default function AssignmentListItem({ item, isActive = false, onClick, href, actionLabel }) {
  const shipment = item.shipments?.[0];
  const title = shipment ? `${shipment.pickupAddress} -> ${shipment.deliveryAddress}` : item.id;

  const content = (
    <div
      className={`w-full text-left border p-3 text-xs transition-colors ${
        isActive ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-secondary truncate">{title}</span>
        <span className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 uppercase shrink-0">
          {item.status || "Unknown"}
        </span>
      </div>
      {shipment?.customerName && (
        <p className="text-gray-500 mt-1 truncate">{shipment.customerName}</p>
      )}
      <p className="text-gray-400 mt-1 font-mono text-[11px]">{formatCreatedAt(item)}</p>
      {actionLabel && (
        <span className="mt-2 inline-block text-primary font-bold">{actionLabel} &rarr;</span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block cursor-pointer">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block w-full cursor-pointer">
      {content}
    </button>
  );
}
