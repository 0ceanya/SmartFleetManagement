"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const DRIVER_NAV_ITEMS = [
  { label: "My Assignment", href: "/driver/assignments" },
  { label: "My Order", href: "/driver/orders" },
];

export default function DriverNavMenu({ driverId, driverInfo, onSignOut, onNavigate }) {
  const pathname = usePathname();

  const activeHref = DRIVER_NAV_ITEMS.map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className="flex flex-col gap-4 text-sm">
      {driverInfo && (
        <div className="border-b border-white/20 pb-3">
          <p className="font-bold text-white truncate">{driverInfo.name || driverInfo.email}</p>
          <p className="font-mono text-white/70 text-[11px]">ID: {driverId?.substring(0, 8)}...</p>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {DRIVER_NAV_ITEMS.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`px-3 py-2 font-heading font-bold transition-colors ${
                isActive ? "bg-primary text-white" : "text-white/80 hover:bg-primary/60 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-white/20 pt-3">
        {driverId && onSignOut && (
          <button
            onClick={onSignOut}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 font-heading font-bold transition-colors cursor-pointer text-left"
          >
            Sign Out
          </button>
        )}
        <Link
          href="/"
          onClick={onNavigate}
          className="bg-white text-secondary px-3 py-2 font-bold hover:bg-gray-100 transition-colors text-left"
        >
          Switch Role
        </Link>
      </div>
    </div>
  );
}
