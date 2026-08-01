import React from "react";
import AppHeader from "./AppHeader";

const navItems = [
  { label: "Place Order", href: "/orders" },
  { label: "My Orders", href: "/orders/mine" },
];

export default function Header() {
  return <AppHeader portalLabel="Customer" homeHref="/orders" navItems={navItems} />;
}
