import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

const navItems = [
  { label: "Place Order", href: "/orders" },
  { label: "My Orders", href: "/orders/mine" },
];

export default function OrdersLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader portalLabel="Customer" homeHref="/orders" navItems={navItems} />
      <div className="flex-1 flex flex-col w-full">{children}</div>
      <AppFooter />
    </div>
  );
}
