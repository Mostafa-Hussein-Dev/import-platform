import { Sidebar } from "@/components/dashboard/sidebar";
import { Toaster } from "sonner";

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bcfi-gradient-bg bcfi-wave-pattern">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="p-6 relative z-10">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
