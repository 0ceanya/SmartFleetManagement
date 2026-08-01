"use client";

import React, { useMemo, useState } from "react";
import BranchTable from "@/components/admin/BranchTable";
import VehicleTable from "@/components/admin/VehicleTable";
import EmployeeTable from "@/components/admin/EmployeeTable";
import WarehouseTable from "@/components/admin/WarehouseTable";

function filterList(list, searchTerm, searchKeys) {
  if (!searchTerm.trim()) return list;
  const term = searchTerm.toLowerCase();
  return list.filter((item) =>
    searchKeys.some((key) => {
      const val = item[key];
      return val && String(val).toLowerCase().includes(term);
    })
  );
}

export default function MasterDataBrowser({ branches, vehicles, drivers, warehouses, branchMap }) {
  const [activeTab, setActiveTab] = useState("branches");
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = useMemo(
    () => [
      { id: "branches", label: "Branches", count: branches.length },
      { id: "vehicles", label: "Vehicles", count: vehicles.length },
      { id: "drivers", label: "Drivers", count: drivers.length },
      { id: "warehouses", label: "Warehouses", count: warehouses.length },
    ],
    [branches, vehicles, drivers, warehouses]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-4 gap-2 mb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(""); }}
              className={`p-2 bg-white border cursor-pointer text-center transition-all ${
                isActive ? "border-primary ring-1 ring-primary/30" : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">{tab.label}</span>
              <p className="text-lg font-heading text-secondary">{tab.count}</p>
            </div>
          );
        })}
      </div>

      <input
        type="text"
        placeholder={`Search ${activeTab}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border border-gray-300 p-1.5 text-xs mb-3 w-64"
      />

      <div className="overflow-auto flex-1 border border-gray-200">
        {activeTab === "branches" && (
          <BranchTable branches={filterList(branches, searchTerm, ["name", "city"])} readOnly />
        )}
        {activeTab === "vehicles" && (
          <VehicleTable
            vehicles={filterList(vehicles, searchTerm, ["registrationNumber", "vehicleClass", "currentStatus"])}
            branchMap={branchMap}
            readOnly
          />
        )}
        {activeTab === "drivers" && (
          <EmployeeTable
            employees={filterList(drivers, searchTerm, ["name", "email", "licenseNumber"])}
            branchMap={branchMap}
            readOnly
          />
        )}
        {activeTab === "warehouses" && (
          <WarehouseTable
            warehouses={filterList(warehouses, searchTerm, ["name", "address"])}
            branchMap={branchMap}
            readOnly
          />
        )}
      </div>
    </div>
  );
}
