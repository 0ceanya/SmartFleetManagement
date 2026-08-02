"use client";

import Link from "next/link";
import AppFooter from "@/components/AppFooter";

const roles = [
  {
    key: "customer",
    name: "Customer",
    tag: "PORTAL",
    description:
      "Place replenishment orders, select offerings, and track freight transit.",
    route: "/orders",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "staff",
    name: "Staff",
    tag: "OPERATIONS",
    description:
      "Manage incoming cargo, coordinate assignments, and handle billing workflows.",
    route: "/staff/orders",
    image:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "driver",
    name: "Driver",
    tag: "FIELD LOGISTICS",
    description:
      "View dispatch assignments, update shipment milestones, and confirm deliveries.",
    route: "/driver/assignments",
    image:
      "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "manager",
    name: "Manager",
    tag: "ANALYTICS",
    description:
      "Executive dashboard: audit logs, fleet reports, incident handling, and master data.",
    route: "/manager",
    image:
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80",
  },
  {
    key: "admin",
    name: "Admin",
    tag: "SYSTEM CORE",
    description:
      "System governance: configure branches, warehouses, fleet vehicles, and service offerings.",
    route: "/admin/masterdata",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
  },
];

export default function RolePickerPage() {
  const handleSelectRole = (roleKey) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("smartfm.role", roleKey);
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-[#f2f0ef] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full mx-auto mb-10 border-b-2 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="bg-black text-white text-xs font-bold px-2.5 py-1 uppercase tracking-widest inline-block mb-3">
              Logistics Portal
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-secondary tracking-tight">
              SmartFM
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-600 max-w-sm">
            Select your operational role below to enter the B2B supermarket
            replenishment &amp; fleet control network.
          </p>
        </div>

        <div className="max-w-6xl w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Link
                key={role.key}
                href={role.route}
                onClick={() => handleSelectRole(role.key)}
                className="group flex flex-col bg-white overflow-hidden transition-all duration-300 border-white border-2 hover:shadow-lg hover:border-2 hover:border-primary"
              >
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  <img
                    src={role.image}
                    alt={role.name}
                    className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-accent text-white rounded-full text-[10px] font-bold px-2.5 py-1 tracking-wider uppercase">
                      {role.tag}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-heading font-bold text-black group-hover:text-primary transition-colors">
                        {role.name}
                      </h2>
                      <span className="text-lg font-bold transition-transform duration-200 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[11px] font-bold text-gray-400 group-hover:text-black transition-colors">
                    <span>ENTER WORKSPACE</span>
                    <span>SMARTFM • V1.0</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full mx-auto mt-12 text-center">
        <AppFooter />
      </div>
    </div>
  );
}
