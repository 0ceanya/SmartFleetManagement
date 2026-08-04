"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import EntityPageLayout from "@/components/manager/EntityPageLayout";
import { formatDate } from "@/lib/dateRange";

export default function ManagerStaffPage() {
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
    { key: "totalStaff", label: "Total Staff", accessor: (data) => data.cards.totalStaff },
    { key: "assignmentsCreated", label: "Assignments Created (Period)", accessor: (data) => data.cards.assignmentsCreatedPeriod },
    { key: "ordersProcessed", label: "Orders Processed (Period)", accessor: (data) => data.cards.ordersProcessedPeriod },
  ];

  const filters = [
    { key: "branch", label: "All Branches", param: "branchId", options: branchOptions },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "branchId", label: "Branch", render: (row) => branchMap[row.branchId] || "-" },
    { key: "assignmentsCreated", label: "Assignments Created" },
    { key: "ordersProcessed", label: "Orders Processed" },
    { key: "lastActivity", label: "Last Activity", render: (row) => formatDate(row.lastActivity) },
  ];

  return (
    <EntityPageLayout
      title="Staff"
      fetchEndpoint="/api/reports/staff"
      cards={cards}
      searchPlaceholder="Search name..."
      searchParam="search"
      filters={filters}
      columns={columns}
      rowsAccessor={(data) => data.rows}
      detailRoute={(row) => `/manager/staff/${row.id}`}
      rowKey={(row) => row.id}
    />
  );
}
