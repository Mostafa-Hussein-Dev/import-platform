"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, SlidersHorizontal, X, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrderStatsCards } from "@/components/orders/order-stats-cards";
import { toast } from "sonner";
import { getOrders, getOrderStats } from "@/lib/actions/orders";
import { getOrdersExportData } from "@/lib/actions/analytics";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/lib/utils/export";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await getOrders({
        search: search || undefined,
        type: typeFilter,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        page: 1,
        pageSize: 50,
      });

      if (result.success && result.data) {
        setOrders(result.data.orders);
      } else {
        toast.error(result.error || "Failed to fetch orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await getOrderStats();
      if (result.success && result.data) {
        setStats({
          totalOrders: result.data.totalOrders,
          totalRevenue: result.data.totalRevenue,
          pendingOrders: result.data.pendingPaymentOrders,
          averageOrderValue: result.data.totalOrders > 0
            ? result.data.totalRevenue / result.data.totalOrders
            : 0,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [typeFilter, statusFilter, paymentStatusFilter]);

  const handleSearch = () => {
    fetchOrders();
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
  };

  const handleExport = async () => {
    try {
      const result = await getOrdersExportData();
      if (!result.success || !result.data) {
        toast.error("Failed to fetch orders for export");
        return;
      }

      const date = new Date().toISOString().split('T')[0];
      const filename = `orders-report-${date}.csv`;

      await exportToCSV(
        result.data,
        filename,
        ['orderNumber', 'date', 'customer', 'type', 'status', 'paymentStatus', 'itemsCount', 'subtotal', 'shipping', 'discount', 'total', 'paid', 'balance']
      );

      toast.success(`Exported ${filename}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export orders");
    }
  };

  const hasActiveFilters =
    search || typeFilter !== "all" || statusFilter !== "all" || paymentStatusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage your sales orders and track payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push("/dashboard/orders/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <OrderStatsCards
        totalOrders={stats.totalOrders}
        totalRevenue={stats.totalRevenue}
        pendingOrders={stats.pendingOrders}
        averageOrderValue={stats.averageOrderValue}
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="wholesale">Wholesale</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="packed">Packed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mt-4">No orders found</h3>
            <p className="text-muted-foreground mt-2">
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : "Get started by creating your first sales order."}
            </p>
            {!hasActiveFilters && (
              <Button className="mt-4" onClick={() => router.push("/dashboard/orders/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <OrdersTable orders={orders} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
