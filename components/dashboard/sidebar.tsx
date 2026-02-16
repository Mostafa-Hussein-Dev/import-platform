"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Factory,
  Settings,
  Menu,
  Search,
  ShoppingCart,
  Truck,
  Building,
  X,
  Warehouse,
  Receipt,
  BarChart3,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signOut } from "next-auth/react";

type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type NavSection = {
  label?: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Sourcing",
    items: [
      { title: "Suppliers", href: "/dashboard/suppliers", icon: Factory },
      { title: "Products", href: "/dashboard/products", icon: Package },
      { title: "Potential Products", href: "/dashboard/potential-products", icon: Search },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      { title: "Purchase Orders", href: "/dashboard/purchase-orders", icon: ShoppingCart },
      { title: "Shipments", href: "/dashboard/shipments", icon: Truck },
      { title: "Shipping Companies", href: "/dashboard/shipping-companies", icon: Building },
    ],
  },
  {
    label: "Sales & Inventory",
    items: [
      { title: "Orders", href: "/dashboard/orders", icon: Receipt },
      { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    items: [
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-md hover:bg-[#F9FAFB]"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-[#F3F4F6] shadow-[2px_0_8px_rgba(0,0,0,0.04)] transition-transform",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center px-5 mt-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/white.png"
                alt="Stock Pilot"
                width={200}
                height={48}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            {navSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.label && (
                  <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                    {section.label}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-[#E8F4FB] text-[#3A9FE1]"
                            : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#212861]"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", isActive ? "text-[#3A9FE1]" : "text-[#9CA3AF]")} />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-[#F3F4F6]">
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all duration-150"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
