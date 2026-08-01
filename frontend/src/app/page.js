"use client";

import React from "react";
import { useRouter } from "next/navigation";

const roles = [
  {
    key: "customer",
    name: "Customer",
    description: "Place and track freight orders",
    route: "/order/new",
  },
  {
    key: "staff",
    name: "Staff",
    description: "Manage orders, assignments, billing",
    route: "/staff/orders",
  },
  {
    key: "driver",
    name: "Driver",
    description: "View assignments, confirm deliveries",
    route: "/driver/assignments",
  },
  {
    key: "manager",
    name: "Manager",
    description: "Generate reports, view audit log",
    route: "/manager/reports",
  },
  {
    key: "admin",
    name: "Admin",
    description: "Manage master data (branches, warehouses, employees, vehicles, offerings)",
    route: "/admin/masterdata",
  },
];

export default function RolePickerPage() {
  const router = useRouter();

  const handleSelect = (role) => {
    sessionStorage.setItem("smartfm.role", role.key);
    router.push(role.route);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto p-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading text-secondary mb-2">SmartFM</h1>
          <p className="text-sm text-gray-500">Smart Fleet Management - ABC-Trans</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => handleSelect(role)}
              className="text-left bg-white border-1 border-gray-300 p-6 hover:border-primary transition-colors cursor-pointer"
            >
              <h2 className="text-lg font-heading text-secondary mb-1">{role.name}</h2>
              <p className="text-sm text-gray-500">{role.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
