import React from "react";

export default function OfferingTable({ offerings, onEdit, onDelete }) {
  if (!offerings || offerings.length === 0) {
    return <p className="p-6 text-sm text-gray-500 text-center">No offerings found.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
        <tr>
          <th className="p-3">Service Name</th>
          <th className="p-3">Description</th>
          <th className="p-3">Vehicle Class</th>
          <th className="p-3">Base Price</th>
          <th className="p-3">Max Weight / Vol</th>
          <th className="p-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {offerings.map((off) => (
          <tr key={off.id} className="hover:bg-slate-50 transition-colors">
            <td className="p-3 font-semibold text-black">{off.name}</td>
            <td className="p-3 text-gray-600 text-xs max-w-xs truncate">{off.description}</td>
            <td className="p-3 font-semibold text-secondary">{off.vehicleClass}</td>
            <td className="p-3 font-mono font-bold text-black">
              {off.basePrice ? `${off.basePrice.toLocaleString()} VND` : "-"}
            </td>
            <td className="p-3 font-mono text-xs text-gray-700">
              {off.maxWeightKg} kg / {off.maxVolumeCbm} CBM
            </td>
            <td className="p-3 text-right space-x-2">
              <button
                type="button"
                onClick={() => onEdit(off)}
                className="text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(off, "offerings")}
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
