"use client";

import React from "react";

export default function CargoForm({ orderData = {}, onChange }) {
  const cargoItems = orderData.cargoItems || [
    {
      description: "Cargo 1 - Fresh Produce Pallet",
      weightKg: 250,
      volumeCbm: 1.2,
      isHazardous: false,
    },
  ];

  const totalOrderWeightKg = cargoItems.reduce(
    (sum, cargo) => sum + (Number(cargo.weightKg) || 0),
    0
  );

  const handleCargoChange = (index, field, value) => {
    const updatedCargoes = [...cargoItems];
    updatedCargoes[index] = { ...updatedCargoes[index], [field]: value };
    onChange("cargoItems", updatedCargoes);

    const newTotalWeight = updatedCargoes.reduce(
      (sum, cargo) => sum + (Number(cargo.weightKg) || 0),
      0
    );
    onChange("orderWeightKg", newTotalWeight);
  };

  const addCargo = () => {
    const updatedCargoes = [
      ...cargoItems,
      {
        description: `Cargo ${cargoItems.length + 1}`,
        weightKg: 100,
        volumeCbm: 1.0,
        isHazardous: false,
      },
    ];
    onChange("cargoItems", updatedCargoes);

    const newTotalWeight = updatedCargoes.reduce(
      (sum, cargo) => sum + (Number(cargo.weightKg) || 0),
      0
    );
    onChange("orderWeightKg", newTotalWeight);
  };

  const removeCargo = (index) => {
    if (cargoItems.length <= 1) return;
    const updatedCargoes = cargoItems.filter((_, idx) => idx !== index);
    onChange("cargoItems", updatedCargoes);

    const newTotalWeight = updatedCargoes.reduce(
      (sum, cargo) => sum + (Number(cargo.weightKg) || 0),
      0
    );
    onChange("orderWeightKg", newTotalWeight);
  };

  return (
    <div className="bg-white p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
            Origin Warehouse
          </label>
          <select
            value={orderData.originWarehouse || ""}
            onChange={(e) => onChange("originWarehouse", e.target.value)}
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
            value={orderData.destinationStore || ""}
            onChange={(e) => onChange("destinationStore", e.target.value)}
            className="w-full border-1 border-gray-300 p-3.5 text-sm font-medium focus:border-primary focus:outline-none bg-white transition-colors cursor-pointer"
          >
            <option value="">-- Select Retail Branch --</option>
            <option value="ST-HN-004">Supermarket Branch - Cau Giay, Hanoi</option>
            <option value="ST-HN-012">Supermarket Branch - Hoan Kiem, Hanoi</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-50 border-1 border-gray-200 p-4 rounded-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Calculated Total Order Weight</span>
          <p className="text-2xl font-bold text-black">{totalOrderWeightKg.toFixed(2)} kg</p>
        </div>
        <button
          type="button"
          onClick={addCargo}
          className="bg-black text-white px-4 py-2 text-xs font-bold hover:bg-gray-800 transition-colors cursor-pointer"
        >
          + Add Cargo Item
        </button>
      </div>

      {cargoItems.map((cargo, cIdx) => (
        <div key={cIdx} className="border-1 border-gray-300 p-4 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-sm text-secondary">Cargo Item #{cIdx + 1}</h3>
            {cargoItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeCargo(cIdx)}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cargo Description</label>
              <input
                type="text"
                placeholder="e.g. Pallet of Dairy Products"
                value={cargo.description || ""}
                onChange={(e) => handleCargoChange(cIdx, "description", e.target.value)}
                className="w-full border border-gray-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (Kg)</label>
              <input
                type="number"
                step="1"
                min="0.1"
                placeholder="Weight in Kg"
                value={cargo.weightKg || ""}
                onChange={(e) => handleCargoChange(cIdx, "weightKg", Number(e.target.value))}
                className="w-full border border-gray-300 p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Volume (m³)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Volume in m³"
                value={cargo.volumeCbm || ""}
                onChange={(e) => handleCargoChange(cIdx, "volumeCbm", Number(e.target.value))}
                className="w-full border border-gray-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="inline-flex items-center text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={cargo.isHazardous || false}
                onChange={(e) => handleCargoChange(cIdx, "isHazardous", e.target.checked)}
                className="mr-2"
              />
              Hazardous Material
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
