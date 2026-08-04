"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getActiveHref } from "@/lib/navActive";

export default function AppHeader({ portalLabel, homeHref = "/", navItems = [] }) {
  const [role, setRole] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    setRole(sessionStorage.getItem("smartfm.role"));
  }, []);

  return (
    <header className="border-b border-gray-300 bg-secondary px-4 py-3 text-white sm:px-6 lg:px-8 lg:py-4">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={homeHref} className="font-heading text-lg font-bold tracking-tight text-white hover:opacity-90 sm:text-2xl">
            SmartFM
          </Link>
          <span className="bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white sm:px-2.5 sm:text-xs">
            {portalLabel}
          </span>
        </div>

        {navItems.length > 0 && (
          <nav className="flex flex-wrap items-center gap-1">
            {(() => {
              const activeHref = getActiveHref(pathname, navItems.map((item) => item.href));
              return navItems.map((item) => {
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
              });
            })()}
          </nav>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs sm:gap-4 sm:text-sm">
          <span>Role: <strong>{role || "Not Selected"}</strong></span>
          <Link href="/" className="bg-white text-secondary px-3 py-1.5 font-bold hover:bg-gray-100 transition-colors">
            Switch Role
          </Link>
        </div>
      </div>
    </header>
  );
}
