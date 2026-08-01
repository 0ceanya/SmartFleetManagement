import React from "react";

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

export default function AssignmentDetailModal({ assignment, vehicleMap, driverMap, onClose }) {
  if (!assignment) return null;

  const vehicle = vehicleMap[assignment.vehicleId];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-300 shadow-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-secondary text-lg">Assignment Detail</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-black font-bold cursor-pointer">
            Close
          </button>
        </div>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="font-semibold">{assignment.status}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Driver</dt><dd>{driverMap[assignment.driverId] || assignment.driverId}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Vehicle</dt><dd>{vehicle ? vehicle.registrationNumber : assignment.vehicleId}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Shipments</dt><dd>{assignment.shipmentIds.length}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Created At</dt><dd>{formatDate(assignment.createdAt)}</dd></div>
          {assignment.route && (
            <>
              <div className="pt-2 border-t border-gray-200 font-semibold text-secondary">Route</div>
              <div className="flex justify-between"><dt className="text-gray-500">Origin</dt><dd className="text-right">{assignment.route.originAddress}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Destination</dt><dd className="text-right">{assignment.route.destinationAddress}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Distance</dt><dd>{assignment.route.distanceKm ?? "-"} km</dd></div>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
