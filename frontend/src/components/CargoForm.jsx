"use client";

import React, { useRef, useState } from "react";

export default function CargoForm({ orderData = {}, onChange }) {
  const [manifestInfo, setManifestInfo] = useState({});
  const fileInputRefs = useRef({});

  const cargoItems = orderData.cargoItems || [
    {
      description: "Cargo 1 - Fresh Produce Pallet",
      weightKg: 250,
      volumeCbm: 1.2,
      isHazardous: false,
      manifestFileName: null,
      manifestItems: [],
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
        manifestFileName: null,
        manifestItems: [],
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

  // Helper to parse CSV text into items list
  const parseCSV = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return [];

    const items = [];
    const hasHeader =
      lines[0].toLowerCase().includes("description") ||
      lines[0].toLowerCase().includes("item") ||
      lines[0].toLowerCase().includes("weight");

    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const desc = parts[0] || `Item #${i}`;
        const weight = parseFloat(parts[1]) || 0;
        const volume = parts.length >= 3 ? parseFloat(parts[2]) || 0 : 0;
        const isHaz =
          parts.length >= 4
            ? ["true", "yes", "1"].includes(parts[3].toLowerCase())
            : false;

        items.push({
          description: desc,
          weightKg: weight,
          volumeCbm: volume > 0 ? volume : null,
          isHazardous: isHaz,
        });
      }
    }
    return items;
  };

  const handleFileUpload = (cargoIndex, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result || "";
      const parsedItems = parseCSV(text);

      let updatedCargoes = [...cargoItems];
      let cargo = { ...updatedCargoes[cargoIndex] };

      cargo.manifestFileName = file.name;
      cargo.manifestItems = parsedItems;

      if (parsedItems.length > 0) {
        const totalParsedWeight = parsedItems.reduce(
          (sum, item) => sum + (item.weightKg || 0),
          0
        );
        const totalParsedVolume = parsedItems.reduce(
          (sum, item) => sum + (item.volumeCbm || 0),
          0
        );
        const hasHazardous = parsedItems.some((item) => item.isHazardous);

        if (totalParsedWeight > 0) cargo.weightKg = totalParsedWeight;
        if (totalParsedVolume > 0) cargo.volumeCbm = Number(totalParsedVolume.toFixed(2));
        if (hasHazardous) cargo.isHazardous = true;

        if (!cargo.description || cargo.description.startsWith("Cargo ")) {
          cargo.description = `Cargo #${cargoIndex + 1} (${parsedItems.length} items from ${file.name})`;
        }
      }

      updatedCargoes[cargoIndex] = cargo;
      onChange("cargoItems", updatedCargoes);

      const newTotalWeight = updatedCargoes.reduce(
        (sum, c) => sum + (Number(c.weightKg) || 0),
        0
      );
      onChange("orderWeightKg", newTotalWeight);

      setManifestInfo((prev) => ({
        ...prev,
        [cargoIndex]: `${file.name} parsed (${parsedItems.length} items)`,
      }));
    };

    reader.readAsText(file);
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
          + Add Cargo Container
        </button>
      </div>

      {cargoItems.map((cargo, cIdx) => (
        <div key={cIdx} className="border-1 border-gray-300 p-5 space-y-5">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-sm text-secondary">Cargo Item #{cIdx + 1}</h3>
            {cargoItems.length > 1 && (
              <button
                type="button"
                onClick={() => removeCargo(cIdx)}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
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

          <div className="flex items-center justify-between">
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

          {/* Load Manifest CSV / Excel Upload Section */}
          <div className="border-1 border-dashed border-gray-300 p-4 bg-tertiary flex flex-col md:flex-row items-center justify-between gap-4 hover:border-primary transition-colors">
            <div>
              <p className="text-xs font-bold text-black uppercase tracking-wider">
                Upload Load Manifest (CSV / Excel)
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Attach SKU item manifest sheet to auto-calculate cargo specifications and validate receiving dock items.
              </p>
              {cargo.manifestFileName && (
                <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  ✓ Attached: <span className="underline">{cargo.manifestFileName}</span>
                  {cargo.manifestItems?.length > 0 && ` (${cargo.manifestItems.length} items parsed)`}
                </div>
              )}
            </div>

            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              ref={(el) => (fileInputRefs.current[cIdx] = el)}
              onChange={(e) => handleFileUpload(cIdx, e)}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRefs.current[cIdx]?.click()}
              className="bg-white border border-gray-400 px-4 py-2 text-xs font-bold text-black hover:bg-black hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              {cargo.manifestFileName ? "Change Manifest Sheet" : "+ Upload Load Manifest"}
            </button>
          </div>

          {/* Display parsed manifest items if uploaded */}
          {cargo.manifestItems && cargo.manifestItems.length > 0 && (
            <div className="bg-white p-3 border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-700 uppercase">Parsed Load Manifest Items</span>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {cargo.manifestItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 px-2 bg-gray-50 border-b border-gray-100">
                    <span className="font-medium text-gray-800">{item.description}</span>
                    <span className="text-gray-500 font-mono">
                      {item.weightKg} kg {item.volumeCbm ? `| ${item.volumeCbm} m³` : ""} {item.isHazardous ? "| ⚠️ Hazardous" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
