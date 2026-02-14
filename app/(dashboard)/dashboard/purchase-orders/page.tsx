import { getPurchaseOrders, getTotalPurchaseOrderValue, getPurchaseOrderCount } from "@/lib/actions/purchase-orders";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, FileText, TrendingUp, Package, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string; supplierId?: string; };
}) {
  const page = parseInt(searchParams.page || "1");

  const [ordersResult, totalValueResult, countResult] = await Promise.all([
    getPurchaseOrders({
      page,
      pageSize: "25",
      search: searchParams.search,
      status: (searchParams.status as any) || "all",
      paymentStatus: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    getTotalPurchaseOrderValue(),
    getPurchaseOrderCount(),
  ]);

  if (!ordersResult.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">{ordersResult.error}</p>
      </div>
    );
  }

  const totalValue = totalValueResult.success ? totalValueResult.data || 0 : 0;
  const totalCount = countResult.success ? countResult.data || 0 : 0;
  const draftCount = countResult.success ? (await getPurchaseOrderCount({ status: "draft" })).data || 0 : 0;

  const statusColors: Record<string, string> = {
    draft: "bg-[#F3F4F6] text-[#374151] hover:bg-[#F3F4F6]",
    sent: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    confirmed: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
    producing: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    shipped: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    received: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  };

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-red-100 text-red-700 hover:bg-red-100",
    partial: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    paid: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212861]">Purchase Orders</h1>
          <p className="text-[#6B7280]">Manage your supplier orders</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchase-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Total POs
            </CardTitle>
            <FileText className="h-4 w-4 text-[#6B7280]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#212861]">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Draft POs
            </CardTitle>
            <Package className="h-4 w-4 text-[#6B7280]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#212861]">{draftCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              In Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#212861]">
              {totalCount - draftCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Total Value
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#212861]">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersResult.data && ordersResult.data.purchaseOrders.length > 0 ? (
            <div className="space-y-4">
              {ordersResult.data.purchaseOrders.map((po) => (
                <div
                  key={po.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/purchase-orders/${po.id}`}
                      className="font-semibold text-[#212861] hover:text-blue-600"
                    >
                      {po.poNumber}
                    </Link>
                    <p className="text-sm text-[#6B7280] mt-1">
                      {po.supplier.companyName} · {new Date(po.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[#6B7280]">{po.itemsCount} items</span>
                    <span className="font-medium text-[#212861]">
                      {formatCurrency(po.totalCost)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[po.status]}`}>
                      {po.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${paymentStatusColors[po.paymentStatus]}`}>
                      {po.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-[#9CA3AF] mb-4" />
              <p className="text-[#6B7280]">No purchase orders found</p>
              <p className="text-sm text-[#9CA3AF] mt-2">
                Create your first purchase order to start tracking procurement
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
