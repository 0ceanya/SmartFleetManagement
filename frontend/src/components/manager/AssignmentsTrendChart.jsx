import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AssignmentsTrendChart({ report }) {
  if (!report) {
    return <p className="text-sm text-gray-500">Generate or select a report to see the trend.</p>;
  }

  let data = [];
  try {
    data = JSON.parse(report.assignmentsByDayJson || "[]");
  } catch {
    data = [];
  }

  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No assignments in this report&apos;s date range.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={160}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#0c8783" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
