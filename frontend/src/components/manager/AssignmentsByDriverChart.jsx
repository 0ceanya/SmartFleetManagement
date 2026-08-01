import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AssignmentsByDriverChart({ report, driverMap = {} }) {
  if (!report) {
    return <p className="text-sm text-gray-500">Generate or select a report.</p>;
  }

  let raw = [];
  try {
    raw = JSON.parse(report.assignmentsByDriverJson || "[]");
  } catch {
    raw = [];
  }

  if (raw.length === 0) {
    return <p className="text-sm text-gray-500">No assignments in this report&apos;s date range.</p>;
  }

  const data = raw.map((e) => ({ name: driverMap[e.driverId] || e.driverId, count: e.count }));

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={160}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#0284c7" />
      </BarChart>
    </ResponsiveContainer>
  );
}
