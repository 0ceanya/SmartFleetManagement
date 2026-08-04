"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { startOfDayIso, endOfDayIso, getCurrentMonthRange } from "@/lib/dateRange";
import Button from "@/components/ui/Button";
import WidgetCard from "@/components/manager/WidgetCard";
import AssignmentsTrendChart from "@/components/manager/AssignmentsTrendChart";
import FleetStatusDonut from "@/components/manager/FleetStatusDonut";
import TripsByVehicleTypeBar from "@/components/manager/TripsByVehicleTypeBar";

function computeDelta(current, previous) {
  if (previous === 0) return current > 0 ? { text: "New", positive: true } : null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return null;
  return { text: `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(0)}%`, positive: pct > 0 };
}

function KpiCard({ label, value, delta, danger }) {
  return (
    <div className={`bg-white border p-4 shadow-sm ${danger ? "border-accent" : "border-gray-300"}`}>
      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={`text-2xl font-heading font-bold ${danger ? "text-accent" : "text-secondary"}`}>{value}</p>
        {delta && (
          <span className={`text-xs font-bold ${delta.positive ? "text-green-600" : "text-accent"}`}>{delta.text}</span>
        )}
      </div>
    </div>
  );
}

export default function ManagerDashboardPage() {
  const defaultRange = getCurrentMonthRange();
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [branchId, setBranchId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [branches, setBranches] = useState([]);

  const [summary, setSummary] = useState(null);
  const [tripsOverTime, setTripsOverTime] = useState([]);
  const [vehicleReport, setVehicleReport] = useState(null);
  const [tripsByType, setTripsByType] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState(null);

  useEffect(() => {
    apiFetch("/api/master-data/branches").then((data) => setBranches(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const isoFrom = startOfDayIso(from);
    const isoTo = endOfDayIso(to);
    const qs = (extra) => new URLSearchParams({ from: isoFrom, to: isoTo, ...extra }).toString();

    Promise.all([
      apiFetch(`/api/reports/summary?${qs({ ...(branchId ? { branchId } : {}), ...(vehicleType ? { vehicleType } : {}) })}`),
      apiFetch(`/api/reports/trips-over-time?${qs({ ...(branchId ? { branchId } : {}), ...(vehicleType ? { vehicleType } : {}) })}`),
      apiFetch(`/api/reports/vehicles?${qs(branchId ? { branchId } : {})}`),
      apiFetch(`/api/reports/trips-by-vehicle-type?${qs(branchId ? { branchId } : {})}`),
    ])
      .then(([summaryData, trendData, vehiclesData, typeData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setTripsOverTime(trendData || []);
        setVehicleReport(vehiclesData);
        setTripsByType(typeData || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, branchId, vehicleType]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setGenerateMessage(null);
    try {
      await apiFetch("/api/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          reportType: "DashboardSnapshot",
          from: startOfDayIso(from),
          to: endOfDayIso(to),
          branchId: branchId || null,
        }),
      });
      setGenerateMessage("Report generated. View it on the Reports page.");
    } catch (err) {
      setGenerateMessage(`Failed to generate report: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const activeCount = vehicleReport?.cards.activeVehicles ?? 0;
  const totalVehicleCount = vehicleReport?.rows.length ?? 0;
  const idleCount = Math.max(0, totalVehicleCount - activeCount);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-heading text-2xl font-bold text-secondary">Dashboard</h1>
        <Button onClick={handleGenerateReport} disabled={generating}>
          {generating ? "Generating..." : "Generate Report"}
        </Button>
      </div>
      {generateMessage && <p className="text-sm text-secondary">{generateMessage}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-gray-500">From</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-300 p-1.5 text-sm" />
        <label className="text-xs text-gray-500">To</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-300 p-1.5 text-sm" />
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="border border-gray-300 p-1.5 text-sm bg-white">
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="border border-gray-300 p-1.5 text-sm bg-white">
          <option value="">All Vehicle Types</option>
          <option value="Light">Light</option>
          <option value="Medium">Medium</option>
          <option value="Heavy">Heavy</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-accent">Failed to load dashboard: {error}</p>}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard label="Trips Completed" value={summary.tripsCompleted} delta={computeDelta(summary.tripsCompleted, summary.tripsCompletedPrevPeriod)} />
            <KpiCard
              label="Fleet Utilization %"
              value={`${summary.fleetUtilizationPct.toFixed(0)}%`}
              delta={computeDelta(summary.fleetUtilizationPct, summary.fleetUtilizationPctPrevPeriod)}
            />
            <KpiCard label="Total Km" value={summary.totalKm.toFixed(0)} delta={computeDelta(summary.totalKm, summary.totalKmPrevPeriod)} />
            <KpiCard
              label="Open Incidents"
              value={summary.openIncidents}
              delta={computeDelta(summary.openIncidents, summary.openIncidentsPrevPeriod)}
              danger={summary.openIncidents > 0}
            />
          </div>

          <div className="h-80">
            <WidgetCard title="Trips per Day">
              <AssignmentsTrendChart data={tripsOverTime} />
            </WidgetCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-72">
              <WidgetCard title="Active / Idle Vehicles">
                <FleetStatusDonut activeCount={activeCount} idleCount={idleCount} />
              </WidgetCard>
            </div>
            <div className="h-72">
              <WidgetCard title="Trips by Vehicle Type">
                <TripsByVehicleTypeBar data={tripsByType} />
              </WidgetCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
