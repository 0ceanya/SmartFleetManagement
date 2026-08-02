"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const CATEGORIES = ["AssignmentDecline", "CargoDamage", "CargoMissing", "CustomerComplaint", "VehicleBreakdown", "Accident", "Other"];

export default function IncidentFeed({ vehicleMap, branchMap, onDrillDown }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch("/api/incidents")
      .then((data) => setIncidents(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      if (severityFilter && i.severity !== severityFilter) return false;
      if (categoryFilter && i.category !== categoryFilter) return false;
      if (fromDate && new Date(i.createdAt) < new Date(fromDate)) return false;
      if (toDate && new Date(i.createdAt) > new Date(`${toDate}T23:59:59`)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const vehicleReg = vehicleMap[i.vehicleId]?.registrationNumber || "";
        if (!i.description.toLowerCase().includes(term) && !vehicleReg.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [incidents, severityFilter, categoryFilter, fromDate, toDate, searchTerm, vehicleMap]);

  const branchFor = (vehicleId) => {
    const vehicle = vehicleMap[vehicleId];
    if (!vehicle) return "-";
    return branchMap[vehicle.branchId] || vehicle.branchId;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Search description, vehicle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 p-1.5 text-xs w-48"
        />
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="border border-gray-300 p-1.5 text-xs bg-white"
        >
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 p-1.5 text-xs bg-white"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-300 p-1.5 text-xs" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-300 p-1.5 text-xs" />
      </div>

      {loading && <p className="text-sm text-gray-500">Loading incidents...</p>}
      {error && <p className="text-sm text-accent">Failed to load incidents: {error}</p>}

      {!loading && !error && (
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200 sticky top-0">
              <tr>
                <th className="p-2">Severity</th>
                <th className="p-2">Category</th>
                <th className="p-2">Vehicle</th>
                <th className="p-2">Branch</th>
                <th className="p-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((incident) => (
                <tr
                  key={incident.id}
                  onClick={() => onDrillDown({ vehicleId: incident.vehicleId })}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  title="Click to filter the Assignment Browser by this vehicle"
                >
                  <td className="p-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                        incident.severity === "Critical" || incident.severity === "High"
                          ? "bg-rose-100 text-rose-800"
                          : incident.severity === "Medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </td>
                  <td className="p-2 text-gray-700">{incident.category || "-"}</td>
                  <td className="p-2 font-mono text-xs">{vehicleMap[incident.vehicleId]?.registrationNumber || incident.vehicleId}</td>
                  <td className="p-2 text-gray-700">{branchFor(incident.vehicleId)}</td>
                  <td className="p-2 text-gray-600">{formatDate(incident.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No incidents match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
