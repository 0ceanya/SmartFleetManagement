"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

export default function AuditLog() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch("/api/reports/audit-records")
      .then((data) => setRecords(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const actionTypes = useMemo(() => [...new Set(records.map((r) => r.action))].sort(), [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (actionFilter && r.action !== actionFilter) return false;
      if (fromDate && new Date(r.createdAt) < new Date(fromDate)) return false;
      if (toDate && new Date(r.createdAt) > new Date(`${toDate}T23:59:59`)) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (
          !r.details.toLowerCase().includes(term) &&
          !r.performedBy.toLowerCase().includes(term) &&
          !r.action.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [records, actionFilter, fromDate, toDate, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="text"
          placeholder="Search action, performer, details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 p-1.5 text-xs w-56"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-gray-300 p-1.5 text-xs bg-white"
        >
          <option value="">All Event Types</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-300 p-1.5 text-xs" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-300 p-1.5 text-xs" />
      </div>

      {loading && <p className="text-sm text-gray-500">Loading audit records...</p>}
      {error && <p className="text-sm text-accent">Failed to load audit records: {error}</p>}

      {!loading && !error && (
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200 sticky top-0">
              <tr>
                <th className="p-2">Event Type</th>
                <th className="p-2">Performed By</th>
                <th className="p-2">Details</th>
                <th className="p-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 font-semibold text-secondary">{record.action}</td>
                  <td className="p-2 text-gray-700">{record.performedBy}</td>
                  <td className="p-2 text-gray-600">{record.details}</td>
                  <td className="p-2 text-gray-600">{formatDate(record.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">No audit records match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
