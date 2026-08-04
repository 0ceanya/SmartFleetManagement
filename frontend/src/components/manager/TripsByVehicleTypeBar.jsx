import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TripsByVehicleTypeBar({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">No trips in this date range.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={160}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="vehicleType" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#49c9c1" />
      </BarChart>
    </ResponsiveContainer>
  );
}
