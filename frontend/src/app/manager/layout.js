import { Container } from "@mui/material";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export const metadata = {
  title: "SmartFM - Manager Portal",
};

const navItems = [
  { label: "Dashboard", href: "/manager" },
  { label: "Reports", href: "/manager/reports" },
  { label: "Audit Log", href: "/manager/audit" },
];

export default function ManagerLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <AppHeader portalLabel="Manager" homeHref="/manager" navItems={navItems} />
      <div className="flex-1 flex flex-col w-full">{children}</div>
      <AppFooter />
    </div>
  );
}
