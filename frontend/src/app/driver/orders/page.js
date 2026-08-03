"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import DriverAuthGuard from "@/components/driver/DriverAuthGuard";
import DriverPageShell from "@/components/driver/DriverPageShell";
import DriverPageHeader from "@/components/driver/DriverPageHeader";
import DriverStatTile from "@/components/driver/DriverStatTile";
import { getStatusChipClasses } from "@/lib/driverStatus";
import {
  simulateWeather,
  simulateTraffic,
  simulateCategory,
  simulateEcoPoints,
  deriveArea,
  formatOrderDateTime,
  getPeriodRange,
} from "@/lib/driverOrderDisplay";

function Field({ label, value }) {
  return (
    <div>
      <span className="text-gray-500 block font-semibold">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

function OrderCard({ assignment, vehicleMap, detail }) {
  const [showAudit, setShowAudit] = useState(false);
  const [auditRecords, setAuditRecords] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const shipment = assignment.shipments?.[0];
  if (!shipment) return null;

  const orderId = detail?.order?.id || shipment?.orderId;

  const handleToggleAudit = async () => {
    if (showAudit) { setShowAudit(false); return; }
    setShowAudit(true);
    if (auditRecords !== null) return;
    setAuditLoading(true);
    try {
      const records = await apiFetch(`/api/audit/records?entityType=Order&entityId=${orderId}`);
      setAuditRecords(records || []);
    } catch {
      setAuditRecords([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const vehicle = vehicleMap.get(assignment.vehicleId);
  const orderDateTime = formatOrderDateTime(detail?.order?.createdAt);
  const pickupTime = detail?.manifest?.createdAt ? formatOrderDateTime(detail.manifest.createdAt).time : "N/A";
  const deliveryTime = detail?.confirmation?.confirmedAt
    ? formatOrderDateTime(detail.confirmation.confirmedAt).time
    : "N/A";
  const area = deriveArea(shipment.deliveryAddress);
  const weather = simulateWeather(assignment.id);
  const traffic = simulateTraffic(assignment.id);
  const category = simulateCategory(assignment.id, vehicle?.vehicleClass);
  const ecoPoints = simulateEcoPoints(assignment.id, assignment.route?.distanceKm);

  return (
    <div className="bg-white border border-gray-300 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3">
        <div>
          <h3 className="font-bold text-secondary">
            {shipment.pickupAddress} -&gt; {shipment.deliveryAddress}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {shipment.customerName}
            {shipment.customerPhone && (
              <>
                {" "}
                &middot;{" "}
                <a href={`tel:${shipment.customerPhone}`} className="text-primary font-bold hover:underline">
                  {shipment.customerPhone}
                </a>
              </>
            )}
          </p>
        </div>
        <span className={`${getStatusChipClasses(assignment.status)} text-[10px] font-bold px-2 py-0.5 uppercase`}>
          {assignment.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <Field label="Order Date" value={orderDateTime.date} />
        <Field label="Order Time" value={orderDateTime.time} />
        <Field label="Pickup Time" value={pickupTime} />
        <Field label="Delivery Time" value={deliveryTime} />
        <Field label="Vehicle" value={vehicle?.registrationNumber || assignment.vehicleId} />
        <Field label="Area" value={area} />
      </div>

      <div className="bg-slate-50 border border-dashed border-gray-300 p-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Estimated conditions (simulated for display)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Field label="Weather" value={weather} />
          <Field label="Traffic" value={traffic} />
          <Field label="Category" value={category} />
          <Field label="Eco Points" value={ecoPoints} />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <button
          type="button"
          onClick={handleToggleAudit}
          className="text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          {showAudit ? "Hide Audit Trail ▲" : "View Audit Trail ▼"}
        </button>
        {showAudit && (
          <div className="mt-3 space-y-1">
            {auditLoading ? (
              <p className="text-xs text-gray-500">Loading audit records...</p>
            ) : !auditRecords?.length ? (
              <p className="text-xs text-gray-500">No audit records found.</p>
            ) : (
              auditRecords.map((r) => {
                const dt = formatOrderDateTime(r.createdAt);
                return (
                  <div key={r.id} className="flex items-start gap-2 text-xs py-1 border-b border-gray-100 last:border-0">
                    <span className="text-gray-400 shrink-0">{dt.date} {dt.time}</span>
                    <span className="text-gray-700 font-medium">
                      {r.fromStatus ? `${r.fromStatus} → ${r.toStatus}` : r.toStatus}
                    </span>
                    {r.changedBy && <span className="text-gray-400 ml-auto shrink-0">{r.changedBy}</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MyOrderContent({ driverId }) {
  const [assignments, setAssignments] = useState([]);
  const [details, setDetails] = useState({});
  const [vehicleMap, setVehicleMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("thisMonth");

  useEffect(() => {
    async function load() {
      if (!driverId) return;
      setLoading(true);
      setError(null);
      try {
        const [assignmentsData, vehiclesData] = await Promise.all([
          apiFetch(`/api/fleet/assignments?driverId=${driverId}&status=Delivered`),
          apiFetch("/api/master-data/vehicles"),
        ]);
        const list = assignmentsData || [];
        setAssignments(list);
        setVehicleMap(new Map((vehiclesData || []).map((v) => [v.id, v])));

        const detailEntries = await Promise.all(
          list.map(async (assignment) => {
            const shipment = assignment.shipments?.[0];
            if (!shipment) return [assignment.id, null];
            const [order, manifest, confirmation] = await Promise.all([
              apiFetch(`/api/orders/${shipment.orderId}`).catch(() => null),
              apiFetch(`/api/fleet/shipments/${shipment.id}/load-manifest`).catch(() => null),
              apiFetch(`/api/fleet/shipments/${shipment.id}/delivery-confirmation`).catch(() => null),
            ]);
            return [assignment.id, { order, manifest, confirmation }];
          })
        );
        setDetails(Object.fromEntries(detailEntries));
      } catch (err) {
        setError(err.message || "Failed to load order history.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [driverId]);

  const range = useMemo(() => getPeriodRange(period), [period]);

  const filteredAssignments = useMemo(() => {
    const list = !range.start
      ? assignments
      : assignments.filter((assignment) => {
          const detail = details[assignment.id];
          const completedAt = detail?.confirmation?.confirmedAt || assignment.createdAt;
          return new Date(completedAt) >= range.start && new Date(completedAt) <= range.end;
        });
    return [...list].sort((a, b) => {
      const dateA = new Date(details[a.id]?.confirmation?.confirmedAt || a.createdAt);
      const dateB = new Date(details[b.id]?.confirmation?.confirmedAt || b.createdAt);
      return dateB - dateA;
    });
  }, [assignments, details, range]);

  const kpis = useMemo(() => {
    const completedCount = filteredAssignments.length;
    const totalDistanceKm = filteredAssignments.reduce((sum, a) => sum + (a.route?.distanceKm || 0), 0);
    return { completedCount, totalDistanceKm };
  }, [filteredAssignments]);

  return (
    <DriverPageShell maxWidth="6xl">
      <DriverPageHeader
        title="My Order"
        subtitle="Completed deliveries and order history."
        actions={
          <div className="flex items-center gap-2 text-xs">
            <label className="font-bold text-gray-700">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 p-1.5 bg-white font-medium focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="allTime">All Time</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <DriverStatTile label="Orders Completed" value={kpis.completedCount} tone="emerald" />
        <DriverStatTile label="Distance Traveled" value={`${kpis.totalDistanceKm.toFixed(1)} km`} tone="blue" />
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-sm text-rose-800 font-medium">
          Warning: {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500 text-sm">Loading order history...</div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300">
          <p className="text-sm font-semibold text-gray-700">No completed orders in this period.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <OrderCard
              key={assignment.id}
              assignment={assignment}
              vehicleMap={vehicleMap}
              detail={details[assignment.id]}
            />
          ))}
        </div>
      )}
    </DriverPageShell>
  );
}

export default function MyOrderPage() {
  return (
    <DriverAuthGuard>{({ driverId }) => <MyOrderContent driverId={driverId} />}</DriverAuthGuard>
  );
}
