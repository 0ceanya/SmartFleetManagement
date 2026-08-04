"use client";

import React from "react";
import EntityPageLayout from "@/components/manager/EntityPageLayout";
import { formatDate } from "@/lib/dateRange";

export default function ManagerAssignmentsPage() {
  const cards = [
    { key: "active", label: "Active Assignments", accessor: (data) => data.cards.activeAssignments },
    { key: "completed", label: "Completed (Period)", accessor: (data) => data.cards.completedPeriod },
    { key: "awaiting", label: "Awaiting Driver/Vehicle", accessor: (data) => data.cards.awaitingDriverOrVehicle },
  ];

  const filters = [
    { key: "status", label: "All Statuses", param: "status", options: [
      { value: "Pending", label: "Pending" },
      { value: "Assigned", label: "Assigned" },
      { value: "Loaded", label: "Loaded" },
      { value: "Delivering", label: "Delivering" },
      { value: "Delivered", label: "Delivered" },
      { value: "Rejected", label: "Rejected" },
    ] },
  ];

  const columns = [
    { key: "id", label: "ID", render: (row) => row.id.split("-")[0].toUpperCase() },
    { key: "driverName", label: "Driver" },
    { key: "vehicleRegistration", label: "Vehicle" },
    { key: "routeSummary", label: "Route", render: (row) => row.routeSummary || "-" },
    { key: "status", label: "Status" },
    { key: "createdByStaff", label: "Created By" },
    { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <>
      <EntityPageLayout
        title="Assignments"
        fetchEndpoint="/api/reports/assignments"
        cards={cards}
        searchPlaceholder="Search ID, driver, vehicle..."
        searchParam="search"
        filters={filters}
        columns={columns}
        rowsAccessor={(data) => data.rows}
        detailRoute={(row) => `/manager/assignments/${row.id}`}
        rowKey={(row) => row.id}
      />
      <p className="text-xs text-gray-500 mt-2">Read-only - assignment creation belongs to Staff.</p>
    </>
  );
}
