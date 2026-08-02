"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import DriverAuthGuard from "@/components/driver/DriverAuthGuard";
import DriverPageShell from "@/components/driver/DriverPageShell";
import DriverPageHeader from "@/components/driver/DriverPageHeader";
import AssignmentListItem from "@/components/driver/AssignmentListItem";

function AssignmentsContent({ driverId, driverInfo }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      let data = await apiFetch(`/api/fleet/assignments?driverId=${driverId}`);

      if (!Array.isArray(data) || data.length === 0) {
        const allData = await apiFetch("/api/fleet/assignments");
        if (Array.isArray(allData) && allData.length > 0) {
          data = allData;
        }
      }

      setAssignments(data || []);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(err.message || "Failed to load assignments from API.");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [driverId]);

  const activeAssignments = useMemo(
    () => assignments.filter((a) => a.status !== "Delivered" && a.status !== "Rejected"),
    [assignments]
  );

  return (
    <DriverPageShell maxWidth="6xl">
      <DriverPageHeader
        title={
          <>
          Driver: <strong className="text-secondary">{driverInfo?.name || driverInfo?.email || "Signed In"}</strong> 
          </>
        }
        subtitle={
          <>
            ID:{" "}
            <span>{driverId}</span>
          </>
        }
        actions={
          <button
            onClick={fetchAssignments}
            disabled={loading}
            className="bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 cursor-pointer transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Schedule"}
          </button>
        }
      />

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-sm text-rose-800 font-medium">
          API Response Warning: {error}
        </div>
      )}

      <div className="bg-white border border-gray-300 p-6 space-y-4 shadow-xs">
        <div className="border-b pb-3">
          <h2 className="text-lg font-heading text-secondary font-bold">
            Driver Assignments ({activeAssignments.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Loading assignments for driver <code className="font-mono">{driverId}</code>...
          </div>
        ) : activeAssignments.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 space-y-2">
            <p className="text-sm font-semibold text-gray-700">No assignments currently awaiting completion.</p>
            <p className="text-xs text-gray-500">
              Completed deliveries move to My Order. Ensure fleet dispatcher has assigned route shipments to
              Driver ID: <span className="font-mono font-bold">{driverId}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAssignments.map((item) => (
              <AssignmentListItem key={item.id} item={item} href={`/driver/assignments/${item.id}`} actionLabel="View" />
            ))}
          </div>
        )}
      </div>
    </DriverPageShell>
  );
}

export default function MyAssignmentsPage() {
  return (
    <DriverAuthGuard>
      {({ driverId, driverInfo }) => (
        <AssignmentsContent driverId={driverId} driverInfo={driverInfo} />
      )}
    </DriverAuthGuard>
  );
}
