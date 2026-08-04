"use client";

import React from "react";
import EntityPageLayout from "@/components/manager/EntityPageLayout";
import { formatDate } from "@/lib/dateRange";

export default function ManagerOrdersPage() {
  const cards = [
    { key: "ordersPeriod", label: "Orders (Period)", accessor: (data) => data.cards.ordersPeriod },
    { key: "pendingApproval", label: "Pending Approval", accessor: (data) => data.cards.pendingApproval },
    { key: "completed", label: "Completed", accessor: (data) => data.cards.completed },
  ];

  const filters = [
    { key: "status", label: "All Statuses", param: "status", options: [
      { value: "Pending", label: "Pending" },
      { value: "Approved", label: "Approved" },
      { value: "Active", label: "Active" },
      { value: "Fulfilled", label: "Fulfilled" },
      { value: "Cancelled", label: "Cancelled" },
    ] },
  ];

  const columns = [
    { key: "id", label: "Order ID", render: (row) => row.id.split("-")[0].toUpperCase() },
    { key: "customerName", label: "Customer" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
    { key: "cargoCount", label: "Cargo Items" },
    { key: "paymentStatus", label: "Payment" },
  ];

  return (
    <>
      <EntityPageLayout
        title="Orders"
        fetchEndpoint="/api/reports/orders"
        cards={cards}
        searchPlaceholder="Search order ID or customer..."
        searchParam="search"
        filters={filters}
        columns={columns}
        rowsAccessor={(data) => data.rows}
        detailRoute={(row) => `/manager/orders/${row.id}`}
        rowKey={(row) => row.id}
      />
      <p className="text-xs text-gray-500 mt-2">Read-only - order processing belongs to Staff.</p>
    </>
  );
}
