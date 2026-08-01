import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      <AppHeader portalLabel="Admin" homeHref="/admin/masterdata" />
      <div className="flex-1 flex flex-col w-full">{children}</div>
      <AppFooter />
    </div>
  );
}
