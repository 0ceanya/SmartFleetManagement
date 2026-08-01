"use client";

import React from "react";
import Link from "next/link";

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
  const handleSelectRole = (roleKey) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("smartfm.role", roleKey);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-2xl w-full mx-auto p-8 bg-white border border-gray-300 shadow-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-heading text-secondary font-bold mb-2">SmartFM</h1>
          <p className="text-sm text-gray-500">Smart Fleet Management - ABC-Trans</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Link
              key={role.key}
              href={role.route}
              onClick={() => handleSelectRole(role.key)}
              className="block text-left bg-white border border-gray-300 p-6 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
            >
              <h2 className="text-lg font-heading text-secondary group-hover:text-primary font-bold mb-1">
                {role.name} →
              </h2>
              <p className="text-sm text-gray-500">{role.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

