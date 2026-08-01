import React from "react";

export default function WarehouseTable({ warehouses, branchMap, onEdit, onDelete }) {
  if (!warehouses || warehouses.length === 0) {
    return <p className="p-6 text-sm text-gray-500 text-center">No warehouses found.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
        <tr>
          <th className="p-3">Warehouse Name</th>
          <th className="p-3">Address</th>
          <th className="p-3">Belongs to Branch</th>
          <th className="p-3">Capacity (kg)</th>
          <th className="p-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {warehouses.map((wh) => (
          <tr key={wh.id} className="hover:bg-slate-50 transition-colors">
            <td className="p-3 font-semibold text-black">{wh.name}</td>
            <td className="p-3 text-gray-700">{wh.address}</td>
            <td className="p-3 text-gray-700">{branchMap[wh.branchId] || wh.branchId}</td>
            <td className="p-3 font-mono font-medium">
              {wh.capacityKg ? wh.capacityKg.toLocaleString() : "-"} kg
            </td>
            <td className="p-3 text-right space-x-2">
              <button
                type="button"
                onClick={() => onEdit(wh)}
                className="text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(wh, "warehouses")}
                className="text-xs font-bold text-accent hover:underline cursor-pointer"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
