import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0c8783", "#d1d5db"];

export default function FleetStatusDonut({ activeCount, idleCount }) {
  const data = [
    { name: "Active", value: activeCount },
    { name: "Idle", value: idleCount },
  ];

  if (activeCount + idleCount === 0) {
    return <p className="text-sm text-gray-500">No vehicle data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={160}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
