"use client";

import React, { useState } from "react";
import Link from "next/link";
import DriverNavMenu from "./DriverNavMenu";

export default function DriverFloatingNav({ backHref = "/driver/assignments", driverId, driverInfo, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="fixed top-4 inset-x-4 z-30 flex items-start justify-between pointer-events-none">
      <Link
        href={backHref}
        aria-label="Back"
        className="pointer-events-auto flex items-center justify-center w-10 h-10 bg-secondary text-white shadow-lg cursor-pointer"
      >
        &larr;
      </Link>

      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="flex flex-col items-center justify-center gap-1.5 w-10 h-10 bg-secondary shadow-lg cursor-pointer"
        >
          <span className={`block h-0.5 w-5 bg-white transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-white transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>

        {menuOpen && (
          <div className="w-56 bg-secondary p-4 shadow-xl">
            <DriverNavMenu
              driverId={driverId}
              driverInfo={driverInfo}
              onSignOut={onSignOut}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
