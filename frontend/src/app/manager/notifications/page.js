"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import EntityPageLayout from "@/components/manager/EntityPageLayout";
import WidgetCard from "@/components/manager/WidgetCard";
import { formatDate } from "@/lib/dateRange";

const ENTITY_DETAIL_ROUTES = {
  Order: (id) => `/manager/orders/${id}`,
  Assignment: (id) => `/manager/assignments/${id}`,
  Vehicle: (id) => `/manager/vehicles/${id}`,
  Driver: (id) => `/manager/drivers/${id}`,
  Staff: (id) => `/manager/staff/${id}`,
};

const POLL_INTERVAL_MS = 30000;

export default function ManagerNotificationsPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterParams, setFilterParams] = useState({});
  const cursorRef = useRef(new Date().toISOString());

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    apiFetch("/api/audit/records?pageSize=50")
      .then((data) => {
        if (cancelled) return;
        const fetched = data?.records || [];
        setRecords(fetched);
        if (fetched.length > 0) cursorRef.current = fetched[0].createdAt;
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const poll = async () => {
      try {
        const data = await apiFetch(`/api/audit/records?after=${encodeURIComponent(cursorRef.current)}&pageSize=50`);
        const newRecords = data?.records || [];
        if (!cancelled && newRecords.length > 0) {
          setPendingRecords((prev) => [...newRecords, ...prev]);
        }
      } catch {
        // swallow - next tick retries
      }
    };
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const applyPending = () => {
    if (pendingRecords.length === 0) return;
    setRecords((prev) => [...pendingRecords, ...prev]);
    cursorRef.current = pendingRecords[0].createdAt;
    setPendingRecords([]);
  };

  const filtered = records.filter((r) => {
    if (filterParams.entityType && r.entityType !== filterParams.entityType) return false;
    if (filterParams.eventType && r.eventType !== filterParams.eventType) return false;
    if (filterParams.from && new Date(r.createdAt) < new Date(filterParams.from)) return false;
    if (filterParams.to && new Date(r.createdAt) > new Date(filterParams.to)) return false;
    if (filterParams.search) {
      const term = filterParams.search.toLowerCase();
      if (!r.description.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const today = new Date().toDateString();
  const cards = [
    { key: "eventsToday", label: "Events Today", accessor: (data) => data.filter((r) => new Date(r.createdAt).toDateString() === today).length },
    { key: "openIncidents", label: "Open Incidents", accessor: (data) => data.filter((r) => r.eventType === "IncidentRaised").length, danger: (v) => v > 0 },
    { key: "statusChanges", label: "Status Changes (Period)", accessor: (data) => data.length },
  ];

  const entityTypeOptions = [...new Set(records.map((r) => r.entityType))].sort().map((t) => ({ value: t, label: t }));
  const eventTypeOptions = [...new Set(records.map((r) => r.eventType))].sort().map((t) => ({ value: t, label: t }));

  return (
    <EntityPageLayout
      title="Notifications"
      cards={cards}
      data={filtered}
      loading={loading}
      error={error}
      onFilterChange={setFilterParams}
      searchPlaceholder="Search description..."
      filters={[
        { key: "entityType", label: "All Entity Types", param: "entityType", options: entityTypeOptions },
        { key: "eventType", label: "All Event Types", param: "eventType", options: eventTypeOptions },
      ]}
      bodySlot={(rows) => (
        <div className="flex flex-col gap-3">
          {pendingRecords.length > 0 && (
            <button
              type="button"
              onClick={applyPending}
              className="bg-primary text-white text-sm font-bold px-4 py-2 self-start hover:opacity-90"
            >
              {pendingRecords.length} new - click to refresh
            </button>
          )}
          <WidgetCard title={`${rows.length} event${rows.length === 1 ? "" : "s"}`}>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
                <tr>
                  <th className="p-2">Timestamp</th>
                  <th className="p-2">Event Type</th>
                  <th className="p-2">Entity</th>
                  <th className="p-2">Actor</th>
                  <th className="p-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((rec) => {
                  const detailRoute = ENTITY_DETAIL_ROUTES[rec.entityType]?.(rec.entityId);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 text-gray-600 whitespace-nowrap">{formatDate(rec.createdAt)}</td>
                      <td className="p-2">
                        <span className="bg-tertiary text-secondary text-xs font-bold px-2 py-0.5">{rec.eventType}</span>
                      </td>
                      <td className="p-2">
                        {detailRoute ? (
                          <button type="button" onClick={() => router.push(detailRoute)} className="text-secondary font-semibold hover:underline">
                            {rec.entityType} {rec.entityId.split("-")[0].toUpperCase()}
                          </button>
                        ) : (
                          `${rec.entityType} ${rec.entityId.split("-")[0].toUpperCase()}`
                        )}
                      </td>
                      <td className="p-2 text-gray-700">{rec.changedBy || "System"}</td>
                      <td className="p-2 text-gray-600">{rec.description}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">No events match the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </WidgetCard>
        </div>
      )}
    />
  );
}
