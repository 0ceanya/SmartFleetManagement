"use client";

import React from "react";

export default function CargoForm({ orderData, onChange }) {
  const handleChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="bg-white p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
            Origin Warehouse
          </label>
          <select
            value={orderData.originWarehouse}
            onChange={(e) => handleChange("originWarehouse", e.target.value)}
            className="w-full border-1 border-gray-300 p-3.5 text-sm font-medium focus:border-primary focus:outline-none bg-white transition-colors cursor-pointer"
          >
            <option value="">-- Select Distribution Center --</option>
            <option value="DC-NORTH-01">DC North - Bac Ninh Hub</option>
            <option value="DC-SOUTH-02">DC South - Binh Duong Hub</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
            Destination Store
          </label>
          <select
            value={orderData.destinationStore}
            onChange={(e) => handleChange("destinationStore", e.target.value)}
            className="w-full border-1 border-gray-300 p-3.5 text-sm font-medium focus:border-primary focus:outline-none bg-white transition-colors cursor-pointer"
          >
            <option value="">-- Select Retail Branch --</option>
            <option value="ST-HN-004">
              Supermarket Branch - Cau Giay, Hanoi
            </option>
            <option value="ST-HN-012">
              Supermarket Branch - Hoan Kiem, Hanoi
            </option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div>
          <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
            Total Pallets
          </label>
          <input
            type="number"
            min="1"
            value={orderData.palletCount}
            onChange={(e) =>
              handleChange("palletCount", Number(e.target.value))
            }
            className="w-full border-1 border-gray-300 p-3.5 text-sm font-bold focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
            Estimated Weight (Kg)
          </label>
          <input
            type="number"
            step="50"
            value={orderData.weightKg}
            onChange={(e) => handleChange("weightKg", Number(e.target.value))}
            className="w-full border-1 border-gray-300 p-3.5 text-sm font-bold focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
            Storage Condition
          </label>
          <select
            value={orderData.cargoType}
            onChange={(e) => handleChange("cargoType", e.target.value)}
            className="w-full border-1 border-gray-300 p-3.5 text-sm font-medium focus:border-primary focus:outline-none bg-white transition-colors cursor-pointer"
          >
            <option value="ambient">Standard Ambient</option>
            <option value="chilled">Chilled 0°C - 4°C</option>
          </select>
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
          Item Manifest & Special Instructions (Optional)
        </label>
        <div className="border-1 border-gray-300 p-5 bg-tertiary flex flex-col md:flex-row items-center justify-between gap-4 hover:border-primary transition-colors">
          <div>
            <p className="text-sm font-bold text-black">
              Upload SKU Manifest (CSV / Excel)
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Attach detailed item list for supermarket receiving dock
              validation.
            </p>
          </div>
          <button
            type="button"
            className="bg-white px-4 py-2 text-xs font-bold text-black hover:bg-black hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            + Browse CSV
          </button>
        </div>
      </div>
    </div>
  );
}
