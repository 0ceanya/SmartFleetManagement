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

  const handleMobileNavClick = () => setIsMenuOpen(false);

  return (
    <header className="border-b border-gray-300 bg-secondary text-white shadow-sm">
      <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-xs sm:block sm:text-sm">
              <span>
                Role: <strong>{role || "Not Selected"}</strong>
              </span>
            </div>

            <Link
              href="/"
              onClick={handleMobileNavClick}
              className="hidden bg-white px-3 py-1.5 text-xs font-bold text-secondary transition-colors hover:bg-gray-100 sm:inline-flex sm:text-sm"
            >
              Switch Role
            </Link>

            {navItems.length > 0 && (
              <button
                type="button"
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/5 transition-colors hover:bg-white/10 md:hidden"
              >
                <span className="flex flex-col gap-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-white" />
                  <span className="block h-0.5 w-5 rounded-full bg-white" />
                  <span className="block h-0.5 w-5 rounded-full bg-white" />
                </span>
              </button>
            )}
          </div>
        </div>

        {navItems.length > 0 && (
          <nav className="hidden items-center gap-1 pt-3 md:flex md:pt-0">
            {navItems.map((item) => {
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 px-3 py-1.5 text-xs font-heading font-bold transition-colors ${
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

        {navItems.length > 0 && isMenuOpen && (
          <nav className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 md:hidden">
            {navItems.map((item) => {
              const isActive = item.href === activeHref;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleMobileNavClick}
                  className={`rounded-md px-3 py-2 text-sm font-heading font-bold transition-colors ${
                    isActive ?
                      "bg-primary text-white"
                    : "text-white/80 hover:bg-primary/60 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="flex flex-col gap-2 border-t border-white/10 pt-3 text-xs text-white/90">
              <span>
                Role: <strong>{role || "Not Selected"}</strong>
              </span>
              <Link
                href="/"
                onClick={handleMobileNavClick}
                className="bg-white px-3 py-2 text-center font-bold text-secondary transition-colors hover:bg-gray-100"
              >
                Switch Role
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
