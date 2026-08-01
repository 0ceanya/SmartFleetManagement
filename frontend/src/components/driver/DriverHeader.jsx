"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DriverHeader({ driverId, driverInfo, onSignOut }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Assignments", href: "/driver/assignments" },
    { label: "Delivery", href: "/driver/confirm" },
    { label: "Profile", href: "/driver/profile" },
  ];

  return (
    <header className="bg-primary border-b border-black text-white px-6 py-3.5 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Portal Branding */}
        <Link href="/driver/assignments" className="flex items-center gap-3">
          <span className="font-heading text-xl font-bold tracking-tight text-white">
            SmartFM <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-amber-300 ml-1">Driver Portal</span>
          </span>
        </Link>

        {/* Navigation Bar */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/driver/assignments" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-xs font-heading font-bold transition-all ${
                  isActive
                    ? "bg-secondary text-white shadow-xs border-b-2 border-amber-400"
                    : "text-slate-200 hover:bg-secondary/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Account Session Actions */}
        <div className="flex items-center gap-3">
          {driverInfo ? (
            <div className="hidden md:flex flex-col text-right text-[11px]">
              <span className="font-bold text-amber-300 truncate max-w-[150px]">
                {driverInfo.name || driverInfo.email}
              </span>
              <span className="font-mono text-slate-300 text-[10px]">
                ID: {driverId?.substring(0, 8)}...
              </span>
            </div>
          ) : null}

          {driverId && onSignOut && (
            <button
              onClick={onSignOut}
              className="text-xs font-heading font-semibold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 border border-rose-700 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          )}

          <Link
            href="/"
            className="text-xs font-heading font-semibold bg-white text-secondary hover:bg-slate-100 px-3 py-1.5 border border-slate-300 transition-colors"
          >
            Switch Role
          </Link>
        </div>
      </div>
    </header>
  );
}
