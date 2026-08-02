import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export const metadata = {
  title: "SmartFM - Staff Portal",
};

const navItems = [
  { label: "Orders", href: "/staff/orders" },
  { label: "Assignments", href: "/staff/assignments" },
  { label: "Incidents", href: "/staff/incidents" },
  { label: "Billing", href: "/staff/billing" },
];

export default function StaffLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <AppHeader portalLabel="Staff" homeHref="/staff/orders" navItems={navItems} />
      <div className="flex-1 flex flex-col w-full">{children}</div>
      <AppFooter />
    </div>
  );
}
