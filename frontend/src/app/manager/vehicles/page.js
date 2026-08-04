"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import EntityPageLayout from "@/components/manager/EntityPageLayout";

export default function ManagerVehiclesPage() {
  const [branchMap, setBranchMap] = useState({});

  useEffect(() => {
    apiFetch("/api/master-data/branches")
      .then((branches) => {
        const map = {};
        (branches || []).forEach((b) => {
          map[b.id] = b.name;
        });
        setBranchMap(map);
      })
      .catch(() => {});
  }, []);

  const cards = [
    { key: "activeVehicles", label: "Active Vehicles", accessor: (data) => data.cards.activeVehicles },
    { key: "totalKm", label: "Total Km (Period)", accessor: (data) => data.cards.totalKmPeriod.toFixed(1) },
    { key: "underMaintenance", label: "Under Maintenance", accessor: (data) => data.cards.vehiclesUnderMaintenance, danger: (v) => v > 0 },
  ];

  const filters = [
    { key: "vehicleType", label: "All Types", param: "vehicleType", options: [
      { value: "Light", label: "Light" },
      { value: "Medium", label: "Medium" },
      { value: "Heavy", label: "Heavy" },
    ] },
    { key: "status", label: "All Statuses", param: "status", options: [
      { value: "Available", label: "Available" },
      { value: "Assigned", label: "Assigned" },
      { value: "UnderMaintenance", label: "Under Maintenance" },
    ] },
  ];

  const columns = [
    { key: "registrationNumber", label: "Registration" },
    { key: "vehicleType", label: "Type" },
    { key: "currentStatus", label: "Status" },
    { key: "branchId", label: "Branch", render: (row) => branchMap[row.branchId] || "-" },
    { key: "tripsPeriod", label: "Trips" },
    { key: "kmPeriod", label: "Km", render: (row) => row.kmPeriod.toFixed(1) },
    { key: "incidents", label: "Incidents" },
  ];

  return (
    <EntityPageLayout
      title="Vehicles"
      fetchEndpoint="/api/reports/vehicles"
      cards={cards}
      searchPlaceholder="Search registration..."
      searchParam="search"
      filters={filters}
      columns={columns}
      rowsAccessor={(data) => data.rows}
      detailRoute={(row) => `/manager/vehicles/${row.id}`}
      rowKey={(row) => row.id}
    />
  );
}
