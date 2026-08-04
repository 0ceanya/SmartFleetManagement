"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getActiveHref } from "@/lib/navActive";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/manager" },
  { label: "Vehicles", href: "/manager/vehicles" },
  { label: "Drivers", href: "/manager/drivers" },
  { label: "Staff", href: "/manager/staff" },
  { label: "Notifications", href: "/manager/notifications" },
  { label: "Orders", href: "/manager/orders" },
  { label: "Assignments", href: "/manager/assignments" },
  { label: "Reports", href: "/manager/reports" },
];

export default function ManagerSidebar() {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname, NAV_ITEMS.map((item) => item.href));

  return (
    <aside className="w-48 shrink-0 border-r border-gray-300 bg-white">
      <nav className="flex flex-col py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2.5 text-sm font-heading font-bold transition-colors border-l-4 ${
                isActive
                  ? "border-primary bg-tertiary text-secondary"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-secondary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
