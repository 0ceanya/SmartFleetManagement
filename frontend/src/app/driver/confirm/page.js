"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DriverAuthGuard from "@/components/driver/DriverAuthGuard";
import { apiFetch } from "@/lib/api";

function DeliveryLandingContent({ driverId, driverInfo }) {
  const router = useRouter();
  const [manualShipmentId, setManualShipmentId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActiveAssignments() {
      if (!driverId) return;
      setLoading(true);
      try {
        const data = await apiFetch(`/api/fleet/assignments?driverId=${driverId}`);
        setAssignments(data || []);
      } catch (err) {
        console.error("Failed to load driver assignments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadActiveAssignments();
  }, [driverId]);

  const handleLookupSubmit = (e) => {
    e.preventDefault();
    if (manualShipmentId.trim()) {
      router.push(`/driver/confirm/${manualShipmentId.trim()}`);
    }
  };

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-white border border-gray-300 p-5 shadow-xs">
        <h1 className="text-2xl font-heading text-secondary font-bold">
          Delivery Confirmations
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Select an active shipment from your schedule below or enter a Shipment ID to confirm proof of delivery.
        </p>
      </div>

      {/* Manual Lookup Form */}
      <div className="bg-white border border-gray-300 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Confirm Delivery by Shipment ID
        </h2>

        <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="Enter Shipment ID (Guid or Shipment Code)"
            value={manualShipmentId}
            onChange={(e) => setManualShipmentId(e.target.value)}
            className="flex-1 border border-gray-300 p-2.5 text-xs font-mono focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs px-6 py-2.5 transition-colors cursor-pointer"
          >
            Go to Confirmation →
          </button>
        </form>
      </div>

      {/* Active Assignments List for Direct Access */}
      <div className="bg-white border border-gray-300 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Select Active Delivery Assignment
        </h2>

        {loading ? (
          <p className="text-xs text-gray-500 p-4 text-center">Loading delivery schedule...</p>
        ) : assignments.length === 0 ? (
          <p className="text-xs text-gray-500 p-4 text-center">No active assignments found for Driver ID: {driverId}</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((item) => {
              const targetShipmentId = item.shipmentIds?.[0] || item.id;
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-primary text-sm block">
                      Assignment: {item.id}
                    </span>
                    <p className="text-gray-600 mt-0.5">
                      Route: {item.route?.originAddress || "Origin"} → {item.route?.destinationAddress || "Destination"}
                    </p>
                    {item.shipmentIds && (
                      <p className="text-gray-500 text-[11px] mt-1 font-mono">
                        Shipment ID: {targetShipmentId}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/driver/confirm/${targetShipmentId}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Confirm Delivery →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DeliveryLandingPage() {
  return (
    <DriverAuthGuard>
      {({ driverId, driverInfo }) => (
        <DeliveryLandingContent driverId={driverId} driverInfo={driverInfo} />
      )}
    </DriverAuthGuard>
  );
}
