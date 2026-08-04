import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import ManagerSidebar from "@/components/manager/ManagerSidebar";

export const metadata = {
  title: "SmartFM - Manager Portal",
};

export default function ManagerLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <AppHeader portalLabel="Manager" homeHref="/manager" />
      <div className="flex-1 flex w-full">
        <ManagerSidebar />
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
      <AppFooter />
    </div>
  );
}
