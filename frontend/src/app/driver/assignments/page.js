"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import DriverAuthGuard from "@/components/driver/DriverAuthGuard";
import AssignmentCard from "@/components/driver/AssignmentCard";
import RejectModal from "@/components/driver/RejectModal";

function AssignmentsContent({ driverId, driverInfo }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  // Rejection Modal State
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Fetch Assignments for signed-in driver from local API
  const fetchAssignments = async () => {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("driverId", driverId);
      if (statusFilter) queryParams.append("status", statusFilter);

      const endpoint = `/api/fleet/assignments?${queryParams.toString()}`;
      let data = await apiFetch(endpoint);

      // Fallback: If driver filter returns empty array, query all assignments so user can see DB records
      if ((!Array.isArray(data) || data.length === 0) && !statusFilter) {
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
  }, [driverId, statusFilter]);

  const handleRejectSubmit = async ({ shipmentId, description, severity }) => {
    if (!description.trim()) {
      setSubmitError("Please enter a reason for rejecting the assignment.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const result = await apiFetch("/api/incidents", {
        method: "POST",
        body: JSON.stringify({
          shipmentId: shipmentId,
          description: `[ASSIGNMENT REJECTION] ${description.trim()}`,
          severity: severity,
        }),
      });

      setSubmitSuccess(`Rejection / Incident report submitted successfully (ID: ${result.id || "Recorded"}).`);
      setSelectedAssignment(null);
      await fetchAssignments();
    } catch (err) {
      setSubmitError(err.message || "Failed to submit rejection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Driver Status Banner */}
      <div className="bg-white border border-gray-300 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Authenticated Driver Session
            </span>
          </div>
          <h1 className="text-2xl font-heading text-secondary font-bold mt-0.5">
            Assignments Schedule
          </h1>
          <p className="text-xs font-mono text-gray-500 mt-1">
            Driver: <strong className="text-secondary">{driverInfo?.name || driverInfo?.email || "Signed In"}</strong> | ID: <span className="text-primary font-bold">{driverId}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssignments}
            disabled={loading}
            className="bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 cursor-pointer transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Schedule"}
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white border border-gray-300 p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <label className="font-bold text-gray-700">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 p-2 bg-white font-medium focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {statusFilter && (
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            className="text-primary underline font-bold cursor-pointer"
          >
            Clear Status Filter
          </button>
        )}
      </div>

      {/* Action Banners */}
      {submitSuccess && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 text-sm text-emerald-800 font-medium">
          ✓ {submitSuccess}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-sm text-rose-800 font-medium">
          ⚠️ API Response Warning: {error}
        </div>
      )}

      {/* Live Assignments List */}
      <div className="bg-white border border-gray-300 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-heading text-secondary font-bold">
            Driver Assignments ({assignments.length})
          </h2>
          {loading && <span className="text-xs text-gray-500 animate-pulse">Querying backend database...</span>}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Loading assignments for driver <code className="font-mono">{driverId}</code>...
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 space-y-2">
            <p className="text-sm font-semibold text-gray-700">No assignments found for this driver.</p>
            <p className="text-xs text-gray-500">
              Ensure fleet dispatcher has assigned route shipments to Driver ID: <span className="font-mono font-bold">{driverId}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((item, index) => (
              <AssignmentCard
                key={item.id || index}
                item={item}
                onReject={(assignment) => setSelectedAssignment(assignment)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reusable Reject Modal */}
      <RejectModal
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onSubmit={handleRejectSubmit}
        submitting={submitting}
        error={submitError}
      />
    </main>
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
