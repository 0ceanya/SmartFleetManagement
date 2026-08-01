import React from "react";

export default function VehicleTable({ vehicles, branchMap, onEditStatus, onDelete }) {
  if (!vehicles || vehicles.length === 0) {
    return <p className="p-6 text-sm text-gray-500 text-center">No vehicles found.</p>;
  }

  return (
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase border-b border-gray-200">
        <tr>
          <th className="p-3">Registration Plate</th>
          <th className="p-3">Vehicle Class</th>
          <th className="p-3">Status</th>
          <th className="p-3">Branch</th>
          <th className="p-3">Max Payload</th>
          <th className="p-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {vehicles.map((veh) => (
          <tr key={veh.id} className="hover:bg-slate-50 transition-colors">
            <td className="p-3 font-mono font-bold text-black">{veh.registrationNumber}</td>
            <td className="p-3 font-semibold text-secondary">{veh.vehicleClass}</td>
            <td className="p-3">
              <span
                className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                  veh.currentStatus === "Available"
                    ? "bg-emerald-100 text-emerald-800"
                    : veh.currentStatus === "Assigned"
                    ? "bg-sky-100 text-sky-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {veh.currentStatus}
              </span>
            </td>
            <td className="p-3 text-gray-700">{branchMap[veh.branchId] || veh.branchId}</td>
            <td className="p-3 font-mono text-xs">{veh.maxPayloadKg ? `${veh.maxPayloadKg.toLocaleString()} kg` : "-"}</td>
            <td className="p-3 text-right space-x-2">
              <button
                type="button"
                onClick={() => onEditStatus(veh)}
                className="text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                Update Status
              </button>
              <button
                type="button"
                onClick={() => onDelete(veh, "vehicles")}
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
