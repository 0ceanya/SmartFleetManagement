"use client";

import React, { useState } from "react";
import Link from "next/link";
import Button from "./ui/Button";

export default function Header() {
  const [activeTab, setActiveTab] = useState("place-order");

  const navItems = [
    { id: "place-order", label: "Place Order", href: "/order" },
    { id: "order-management", label: "Order Management", href: "/orders" },
  ];

  return (
    <header className="sticky top-0 z-50 border-black bg-primary px-8 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div>
            <span className="font-heading text-xl font-bold tracking-tight text-white block leading-none">
              SmartFM
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  isActive ?
                    "bg-secondary text-white"
                  : "text-white hover:bg-secondary"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Button onClick={() => setActiveTab("account")}>My Account</Button>
        </div>
      </div>
    </header>
  );
}
