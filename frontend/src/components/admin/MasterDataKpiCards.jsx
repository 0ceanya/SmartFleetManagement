import React from "react";

export default function MasterDataKpiCards({
  activeTab,
  setActiveTab,
  branchCount,
  warehouseCount,
  employeeCount,
  vehicleCount,
  offeringCount,
}) {
  const cards = [
    { id: "branches", label: "Branches", count: branchCount, sub: "Hubs & Locations" },
    { id: "warehouses", label: "Warehouses", count: warehouseCount, sub: "Storage Depots" },
    { id: "employees", label: "Employees", count: employeeCount, sub: "Drivers, Staff & Mgrs" },
    { id: "vehicles", label: "Vehicles", count: vehicleCount, sub: "Fleet Units" },
    { id: "offerings", label: "Offerings", count: offeringCount, sub: "Service Tiers" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => {
        const isActive = activeTab === card.id;
        return (
          <div
            key={card.id}
            onClick={() => setActiveTab(card.id)}
            className={`p-5 bg-white border cursor-pointer transition-all ${
              isActive ? "border-primary ring-2 ring-primary/30" : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
              {card.label}
            </span>
            <p className="text-3xl font-heading text-secondary">{card.count}</p>
            <span className="text-xs text-gray-400">{card.sub}</span>
          </div>
        );
      })}
    </div>
  );
}
