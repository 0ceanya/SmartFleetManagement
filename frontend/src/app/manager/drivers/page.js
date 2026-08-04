"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import EntityPageLayout from "@/components/manager/EntityPageLayout";

export default function ManagerDriversPage() {
  const [branchOptions, setBranchOptions] = useState([]);
  const [branchMap, setBranchMap] = useState({});

  useEffect(() => {
    apiFetch("/api/master-data/branches")
      .then((branches) => {
        const map = {};
        (branches || []).forEach((b) => {
          map[b.id] = b.name;
        });
        setBranchMap(map);
        setBranchOptions((branches || []).map((b) => ({ value: b.id, label: b.name })));
      })
      .catch(() => {});
  }, []);

  const cards = [
    { key: "activeDrivers", label: "Active Drivers", accessor: (data) => data.cards.activeDrivers },
    { key: "tripsCompleted", label: "Trips Completed (Period)", accessor: (data) => data.cards.tripsCompletedPeriod },
    { key: "involvedInIncidents", label: "Involved in Incidents", accessor: (data) => data.cards.driversInvolvedInIncidents, danger: (v) => v > 0 },
  ];

  const filters = [
    { key: "branch", label: "All Branches", param: "branchId", options: branchOptions },
    { key: "status", label: "All Statuses", param: "status", options: [
      { value: "Available", label: "Available" },
      { value: "Unavailable", label: "Unavailable" },
    ] },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "branchId", label: "Branch", render: (row) => branchMap[row.branchId] || "-" },
    { key: "trips", label: "Trips" },
    { key: "km", label: "Km", render: (row) => row.km.toFixed(1) },
    { key: "deliveryConfirmations", label: "Delivery Confirmations" },
    { key: "incidents", label: "Incidents" },
  ];

  return (
    <EntityPageLayout
      title="Drivers"
      fetchEndpoint="/api/reports/drivers"
      cards={cards}
      searchPlaceholder="Search name..."
      searchParam="search"
      filters={filters}
      columns={columns}
      rowsAccessor={(data) => data.rows}
      detailRoute={(row) => `/manager/drivers/${row.id}`}
      rowKey={(row) => row.id}
    />
  );
}
