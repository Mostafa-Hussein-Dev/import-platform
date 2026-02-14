"use client";

import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Purchase Orders",
    href: "/dashboard/purchase-orders",
    icon: ShoppingCart,
  },
  {
    title: "Shipments",
    href: "/dashboard/shipments",
    icon: Truck,
  },
  {
    title: "Shipping Companies",
    href: "/dashboard/shipping-companies",
    icon: Building,
  },
  {
    title: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Potential Products",
    href: "/dashboard/potential-products",
    icon: Search,
  },
  {
    title: "Suppliers",
    href: "/dashboard/suppliers",
    icon: Factory,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
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
          className="bg-white shadow-md hover:bg-gray-50"
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
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-100 shadow-[2px_0_8px_rgba(0,0,0,0.04)] transition-transform",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#212861] flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-[#212861]">Import Platform</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
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
                      : "text-[#6B7280] hover:bg-gray-50 hover:text-[#212861]"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-[#3A9FE1]" : "text-[#9CA3AF]")} />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="text-xs text-[#9CA3AF] text-center">
              &copy; 2026 Import Platform
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
