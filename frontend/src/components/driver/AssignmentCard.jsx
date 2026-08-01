"use client";

import React from "react";
import Link from "next/link";

export default function AssignmentCard({ item, onReject }) {
  const firstShipmentId = item.shipmentIds?.[0] || item.id;

  return (
    <div className="border border-gray-300 p-5 bg-slate-50 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Assignment ID
          </span>
          <span className="font-mono text-sm font-bold text-primary">{item.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-secondary text-white text-xs font-bold px-3 py-1 uppercase">
            Status: {item.status || "Unknown"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <span className="text-gray-500 block font-semibold">Driver ID:</span>
          <span className="font-mono">{item.driverId || "Unassigned"}</span>
        </div>
        <div>
          <span className="text-gray-500 block font-semibold">Vehicle ID:</span>
          <span className="font-mono">{item.vehicleId || "Unassigned"}</span>
        </div>
        <div>
          <span className="text-gray-500 block font-semibold">Assigned / Scheduled:</span>
          <span>
            {item.assignedAt
              ? new Date(item.assignedAt).toLocaleString()
              : item.scheduledDeparture
                ? new Date(item.scheduledDeparture).toLocaleString()
                : "N/A"}
          </span>
        </div>
      </div>

      {item.route && (
        <div className="bg-white p-3 border border-gray-200 text-xs space-y-1">
          <span className="font-bold text-gray-700 uppercase block">Route Information</span>
          <p><strong>Origin:</strong> {item.route.originAddress || "N/A"}</p>
          <p><strong>Destination:</strong> {item.route.destinationAddress || "N/A"}</p>
          {item.route.distanceKm && <p><strong>Distance:</strong> {item.route.distanceKm} km</p>}
        </div>
      )}

      {item.shipmentIds && item.shipmentIds.length > 0 && (
        <div className="text-xs text-gray-600">
          <strong>Shipments:</strong> {item.shipmentIds.join(", ")}
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onReject(item)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 cursor-pointer transition-colors"
        >
          Reject Assignment
        </button>

        <Link
          href={`/driver/confirm/${firstShipmentId}`}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 cursor-pointer transition-colors inline-block"
        >
          Confirm Delivery Status
        </Link>
      </div>
    </div>
  );
}
