"use client";

import React, { useEffect, useState } from "react";
import DriverAuthGuard from "@/components/driver/DriverAuthGuard";
import { apiFetch } from "@/lib/api";

function ProfileContent({ driverId, driverInfo: initialDriverInfo }) {
  const [driverInfo, setDriverInfo] = useState(initialDriverInfo || null);
  const [branchName, setBranchName] = useState("Loading branch...");
  const [assignmentsStats, setAssignmentsStats] = useState({ total: 0, completed: 0, vehiclePlate: "N/A" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadBackendDriverProfile() {
      if (!driverId) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Read Driver Employee record from Backend API Database /api/master-data/employees/{id}
        const employeeData = await apiFetch(`/api/master-data/employees/${driverId}`);
        setDriverInfo(employeeData);

        // 2. Read Branch information if BranchId exists
        if (employeeData?.branchId) {
          try {
            const branchData = await apiFetch(`/api/master-data/branches/${employeeData.branchId}`);
            if (branchData?.name) {
              setBranchName(`${branchData.name}${branchData.city ? ` (${branchData.city})` : ""}`);
            }
          } catch {
            setBranchName(`Branch ID: ${employeeData.branchId}`);
          }
        } else {
          setBranchName("Headquarters / Unassigned");
        }

        // 3. Read Driver Assignments from Fleet API to calculate real database stats
        try {
          const assignmentsData = await apiFetch(`/api/fleet/assignments?driverId=${driverId}`);
          if (Array.isArray(assignmentsData)) {
            const completedCount = assignmentsData.filter((a) => a.status === "Completed").length;
            const activeAssignment = assignmentsData.find((a) => a.status === "Active" || a.status === "Approved") || assignmentsData[0];
            const vehiclePlate = activeAssignment?.vehicleId || "N/A";

            setAssignmentsStats({
              total: assignmentsData.length,
              completed: completedCount,
              vehiclePlate: vehiclePlate,
            });
          }
        } catch {
          // Non-blocking for stats
        }
      } catch (err) {
        console.error("Failed to load driver profile from database:", err);
        setError(err.message || "Failed to retrieve driver profile from local API database.");
      } finally {
        setLoading(false);
      }
    }

    loadBackendDriverProfile();
  }, [driverId]);

  // Helper to extract driver initials for placeholder photo
  const getInitials = (name) => {
    if (!name) return "DR";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 text-sm text-rose-800 font-medium">
          ⚠️ Database Notice: {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white border border-gray-300 shadow-xs overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-200">
          {/* Placeholder Photo Avatar */}
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-secondary border-4 border-white flex items-center justify-center text-3xl font-heading font-bold text-amber-300 shadow-md">
              {driverInfo ? getInitials(driverInfo.name) : "..."}
            </div>
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
              driverInfo?.isAvailable !== false ? "bg-emerald-500" : "bg-amber-500"
            }`}></span>
          </div>

          {/* Profile Brief */}
          <div className="text-center sm:text-left space-y-1">
            <span className="bg-amber-400 text-black text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider rounded-xs">
              {driverInfo?.type || "Driver"} • {driverInfo?.isAvailable !== false ? "Available / Active" : "On Duty"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
              {loading ? "Loading Driver..." : driverInfo?.name || "Driver Profile"}
            </h1>
            <p className="text-xs font-mono text-slate-300">
              Driver ID: <span className="text-amber-300 font-bold">{driverId}</span>
            </p>
            <p className="text-xs text-slate-400">
              Branch: {branchName}
            </p>
          </div>
        </div>

        {/* Database Info Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b pb-2">
            Database Driver Information
          </h2>

          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Querying backend database <code className="font-mono">/api/master-data/employees/{driverId}</code>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-slate-50 p-4 border border-gray-200 space-y-1">
                <span className="text-gray-500 font-semibold block">Full Name:</span>
                <span className="text-secondary font-bold text-sm block">{driverInfo?.name || "N/A"}</span>
              </div>

              <div className="bg-slate-50 p-4 border border-gray-200 space-y-1">
                <span className="text-gray-500 font-semibold block">Email Address:</span>
                <span className="font-mono text-gray-800 font-medium text-sm block">{driverInfo?.email || "N/A"}</span>
              </div>

              <div className="bg-slate-50 p-4 border border-gray-200 space-y-1">
                <span className="text-gray-500 font-semibold block">License Number:</span>
                <span className="font-mono text-primary font-bold text-sm block">{driverInfo?.licenseNumber || "Unspecified"}</span>
              </div>

              <div className="bg-slate-50 p-4 border border-gray-200 space-y-1">
                <span className="text-gray-500 font-semibold block">Branch Location:</span>
                <span className="text-secondary font-bold text-sm block">{branchName}</span>
              </div>

              <div className="bg-slate-50 p-4 border border-gray-200 space-y-1">
                <span className="text-gray-500 font-semibold block">Branch ID (Guid):</span>
                <span className="font-mono text-gray-600 block">{driverInfo?.branchId || "N/A"}</span>
              </div>

              <div className="bg-slate-50 p-4 border border-gray-200 space-y-1">
                <span className="text-gray-500 font-semibold block">Assigned Vehicle Plate / ID:</span>
                <span className="font-mono text-emerald-700 font-bold text-sm block">{assignmentsStats.vehiclePlate}</span>
              </div>
            </div>
          )}

          {/* Performance Statistics from Database */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              Operational Statistics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-amber-50 border border-amber-200 p-4 text-center">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Total Assignments
                </span>
                <span className="text-2xl font-heading font-bold text-amber-900">{assignmentsStats.total}</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Completed Deliveries
                </span>
                <span className="text-2xl font-heading font-bold text-emerald-900">{assignmentsStats.completed}</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 text-center">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                  Driver Availability
                </span>
                <span className="text-xl font-heading font-bold text-blue-900">
                  {driverInfo?.isAvailable !== false ? "Available" : "Assigned"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DriverProfilePage() {
  return (
    <DriverAuthGuard>
      {({ driverId, driverInfo }) => (
        <ProfileContent driverId={driverId} driverInfo={driverInfo} />
      )}
    </DriverAuthGuard>
  );
}
