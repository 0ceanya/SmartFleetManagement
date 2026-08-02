"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DriverNavMenu, { DRIVER_NAV_ITEMS } from "./DriverNavMenu";

export default function DriverHeader({ driverId, driverInfo, onSignOut }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeHref = DRIVER_NAV_ITEMS.map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-300 bg-secondary text-white shadow-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
        <Link href="/driver/assignments" className="flex items-center gap-3 sm:gap-4">
          <span className="font-heading text-lg font-bold tracking-tight text-white hover:opacity-90 sm:text-2xl">
            SmartFM
          </span>
          <span className="bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white sm:px-2.5 sm:text-xs">
            Driver Portal
          </span>
        </Link>

        <nav className="hidden md:flex flex-wrap items-center gap-1">
          {DRIVER_NAV_ITEMS.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 px-3 py-1.5 text-xs font-heading font-bold transition-colors ${
                  isActive ? "bg-primary text-white" : "text-white/80 hover:bg-primary/60 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
          {driverInfo ? (
            <div className="flex flex-col text-right text-[11px] leading-tight">
              <span className="font-bold text-white truncate max-w-[150px]">
                {driverInfo.name || driverInfo.email}
              </span>
              <span className="font-mono text-white/70 text-[10px]">
                ID: {driverId?.substring(0, 8)}...
              </span>
            </div>
          ) : null}

          {driverId && onSignOut && (
            <button
              onClick={onSignOut}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 font-heading font-bold transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          )}

          <Link href="/" className="bg-white text-secondary px-3 py-1.5 font-bold hover:bg-gray-100 transition-colors">
            Switch Role
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="md:hidden flex flex-col items-center justify-center gap-1.5 w-9 h-9 shrink-0 cursor-pointer"
        >
          <span className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-6 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/20 bg-secondary px-4 py-4 sm:px-6">
          <DriverNavMenu
            driverId={driverId}
            driverInfo={driverInfo}
            onSignOut={onSignOut}
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      )}
    </header>
  );
}
