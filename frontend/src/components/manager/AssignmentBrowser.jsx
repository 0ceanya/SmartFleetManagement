"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import AssignmentDetailModal from "./AssignmentDetailModal";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

const STATUSES = ["Pending", "Assigned", "Loaded", "Delivering", "Delivered", "Rejected"];

export default function AssignmentBrowser({ assignmentFilter, onClearFilter, vehicleMap, driverMap }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (assignmentFilter?.driverId) params.set("driverId", assignmentFilter.driverId);
    const qs = params.toString();

    setLoading(true);
    setError(null);
    apiFetch(`/api/fleet/assignments${qs ? `?${qs}` : ""}`)
      .then((data) => setAssignments(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, assignmentFilter?.driverId]);

  const filtered = useMemo(() => {
    let list = assignments;
    if (assignmentFilter?.vehicleId) {
      list = list.filter((a) => a.vehicleId === assignmentFilter.vehicleId);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((a) => {
        const driverName = driverMap[a.driverId] || "";
        const vehicleReg = vehicleMap[a.vehicleId]?.registrationNumber || "";
        return (
          driverName.toLowerCase().includes(term) ||
          vehicleReg.toLowerCase().includes(term) ||
          a.status.toLowerCase().includes(term)
        );
      });
    }
    const sorted = [...list].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [assignments, assignmentFilter, searchTerm, sortKey, sortDir, driverMap, vehicleMap]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const openDetail = async (id) => {
    try {
      const detail = await apiFetch(`/api/fleet/assignments/${id}`);
      setSelectedAssignment(detail);
    } catch {
      // ignore, row stays unselected
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Search driver, vehicle, status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 p-1.5 text-xs w-56"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 p-1.5 text-xs bg-white"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(assignmentFilter?.vehicleId || assignmentFilter?.driverId) && (
          <button
            type="button"
            onClick={onClearFilter}
            className="text-xs font-bold text-accent hover:underline cursor-pointer"
          >
            Clear drill-down filter
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading assignments...</p>}
      {error && <p className="text-sm text-accent">Failed to load assignments: {error}</p>}

      {!loading && !error && (
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200 sticky top-0">
              <tr>
                <th className="p-2 cursor-pointer" onClick={() => toggleSort("status")}>Status</th>
                <th className="p-2">Driver</th>
                <th className="p-2">Vehicle</th>
                <th className="p-2 cursor-pointer" onClick={() => toggleSort("createdAt")}>Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => openDetail(a.id)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="p-2 font-semibold">{a.status}</td>
                  <td className="p-2">{driverMap[a.driverId] || a.driverId}</td>
                  <td className="p-2 font-mono text-xs">{vehicleMap[a.vehicleId]?.registrationNumber || a.vehicleId}</td>
                  <td className="p-2 text-gray-600">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">No assignments match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AssignmentDetailModal
        assignment={selectedAssignment}
        vehicleMap={vehicleMap}
        driverMap={driverMap}
        onClose={() => setSelectedAssignment(null)}
      />
    </div>
  );
}
