"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader({
  portalLabel,
  homeHref = "/",
  navItems = [],
}) {
  const [role] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return sessionStorage.getItem("smartfm.role");
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const activeHref = navItems
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <header className="border-b border-gray-300 bg-secondary px-4 py-3 text-white sm:px-6 lg:px-8 lg:py-4">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center justify-between gap-3 md:items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href={homeHref}
              className="font-heading text-lg font-bold tracking-tight text-white hover:opacity-90 sm:text-2xl"
            >
              SmartFM
            </Link>
            <span className="bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white sm:px-2.5 sm:text-xs">
              {portalLabel}
            </span>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10 md:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="flex w-5 flex-col gap-1.5">
              <span
                className={`h-0.5 w-full rounded-full bg-white transition-transform ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-white transition-opacity ${isMenuOpen ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`h-0.5 w-full rounded-full bg-white transition-transform ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </div>
          </button>
        </div>

        <div
          className={`${isMenuOpen ? "mt-3 flex" : "hidden"} flex-col gap-3 md:mt-0 md:flex md:flex-row md:items-center md:justify-between md:gap-4`}
        >
          {navItems.length > 0 && (
            <nav className="flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center">
              {navItems.map((item) => {
                const isActive = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`rounded-sm px-3 py-2 text-sm font-heading font-bold transition-colors md:shrink-0 md:px-3 md:py-1.5 md:text-xs ${
                      isActive ?
                        "bg-primary text-white"
                      : "text-white/80 hover:bg-primary/60 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs sm:gap-4 sm:text-sm md:justify-end">
            <span>
              Role: <strong>{role || "Not Selected"}</strong>
            </span>
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="bg-white px-3 py-1.5 font-bold text-secondary transition-colors hover:bg-gray-100"
            >
              Switch Role
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
