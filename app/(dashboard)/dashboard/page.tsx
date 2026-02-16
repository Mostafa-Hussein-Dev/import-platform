import { Suspense } from "react";
import { getSupplierCount, getRecentSuppliers } from "@/lib/actions/suppliers";
import { getProductCount, getActiveProductCount, getLowStockProductCount, getRecentProducts } from "@/lib/actions/products";
import { getPotentialProductsCount, getApprovedPotentialProducts } from "@/lib/actions/potential-products";
import {
  getPurchaseOrderCount,
  getRecentPurchaseOrders,
  getTotalPurchaseOrderValue,
} from "@/lib/actions/purchase-orders";
import { getShipmentCount, getRecentShipments } from "@/lib/actions/shipments";
import { getInventoryStats } from "@/lib/actions/inventory";
import { getRecentStockMovements } from "@/lib/actions/stock-movements";
import { getOrderStats, getRecentOrders } from "@/lib/actions/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Factory, Package, TrendingUp, AlertTriangle, Search, ShoppingCart, Truck, FileText, Warehouse, Receipt, DollarSign } from "lucide-react";
import Link from "next/link";
import { MarginDisplay } from "@/components/potential-products/margin-display";
import { formatCurrency } from "@/lib/utils";
import { RecentMovementsWidget } from "@/components/dashboard/recent-movements-widget";

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [
    suppliersResult,
    productsResult,
    activeProductsResult,
    lowStockResult,
    recentSuppliersResult,
    recentProductsResult,
    potentialProductsCountResult,
    approvedPotentialProductsResult,
    sentPOResult,
    confirmedPOResult,
    inTransitShipmentsResult,
    customsShipmentsResult,
    recentPOsResult,
    recentShipmentsResult,
    thisMonthPOValueResult,
    inventoryStatsResult,
    recentMovementsResult,
    orderStatsResult,
    recentOrdersResult,
  ] = await Promise.all([
    getSupplierCount(),
    getProductCount(),
    getActiveProductCount(),
    getLowStockProductCount(),
    getRecentSuppliers(5),
    getRecentProducts(5),
    getPotentialProductsCount(),
    getApprovedPotentialProducts(5),
    getPurchaseOrderCount({ status: "sent" }),
    getPurchaseOrderCount({ status: "confirmed" }),
    getShipmentCount({ status: "in_transit" }),
    getShipmentCount({ status: "customs" }),
    getRecentPurchaseOrders(5),
    getRecentShipments(5),
    getTotalPurchaseOrderValue({
      dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    }),
    getInventoryStats(),
    getRecentStockMovements(5),
    getOrderStats(),
    getRecentOrders(5),
  ]);

  const potentialProductsCount = potentialProductsCountResult.success ? potentialProductsCountResult.data : null;

  const activePOs = (sentPOResult.success ? sentPOResult.data || 0 : 0) +
    (confirmedPOResult.success ? confirmedPOResult.data || 0 : 0);
  const inTransitShipments = inTransitShipmentsResult.success ? inTransitShipmentsResult.data || 0 : 0;
  const atCustomsShipments = customsShipmentsResult.success ? customsShipmentsResult.data || 0 : 0;
  const thisMonthPOValue = thisMonthPOValueResult.success ? thisMonthPOValueResult.data || 0 : 0;

  const inventoryValue = inventoryStatsResult.success ? inventoryStatsResult.data?.totalInventoryValue ?? 0 : 0;

  const recentMovements = recentMovementsResult.success ? recentMovementsResult.data ?? [] : [];

  const orderStats = orderStatsResult.success ? orderStatsResult.data : null;
  const recentOrders = recentOrdersResult.success ? recentOrdersResult.data ?? [] : [];

  const stats = [
    {
      title: "Active POs",
      value: activePOs,
      icon: ShoppingCart,
      href: "/dashboard/purchase-orders",
      color: "text-[#3A9FE1]",
      bgColor: "bg-[#E8F4FB]",
    },
    {
      title: "In Transit",
      value: inTransitShipments,
      icon: Truck,
      href: "/dashboard/shipments",
      color: "text-[#8B5CF6]",
      bgColor: "bg-[#EDE9FE]",
    },
    {
      title: "At Customs",
      value: atCustomsShipments,
      icon: FileText,
      href: "/dashboard/shipments",
      color: "text-[#F59E0B]",
      bgColor: "bg-[#FEF3C7]",
    },
    {
      title: "Inventory Value",
      value: formatCurrency(inventoryValue),
      icon: Warehouse,
      href: "/dashboard/inventory",
      color: "text-[#10B981]",
      bgColor: "bg-[#D1FAE5]",
    },
    {
      title: "This Month PO Value",
      value: formatCurrency(thisMonthPOValue),
      icon: TrendingUp,
      href: "/dashboard/purchase-orders",
      color: "text-[#212861]",
      bgColor: "bg-[#E8F4FB]",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-[#6B7280] mt-1">Here's an overview of your platform.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="stat-large text-[#212861]">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Stock Movements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Stock Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentMovementsWidget movements={recentMovements} />
          </CardContent>
        </Card>

        {/* Recent Purchase Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Purchase Orders</CardTitle>
            <Link
              href="/dashboard/purchase-orders"
              className="text-sm font-semibold text-[#3A9FE1] hover:text-[#2E8FD1] transition-colors"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {recentPOsResult.success && recentPOsResult.data && recentPOsResult.data.length > 0 ? (
              <div className="space-y-4">
                {recentPOsResult.data.map((po) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#212861]">{po.poNumber}</p>
                      <p className="text-sm text-[#6B7280]">
                        {po.supplier.companyName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#212861]">
                        {formatCurrency(po.totalCost)}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {new Date(po.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF] text-center py-4">
                No purchase orders yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active Shipments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Shipments</CardTitle>
            <Link
              href="/dashboard/shipments"
              className="text-sm font-semibold text-[#3A9FE1] hover:text-[#2E8FD1] transition-colors"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {recentShipmentsResult.success && recentShipmentsResult.data && recentShipmentsResult.data.length > 0 ? (
              <div className="space-y-4">
                {recentShipmentsResult.data.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-[#212861]">{shipment.shipmentNumber}</p>
                      <p className="text-sm text-[#6B7280]">
                        {shipment.shippingCompany.name}
                      </p>
                    </div>
                    <p className="text-xs text-[#9CA3AF]">
                      {shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toLocaleDateString() : "TBD"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF] text-center py-4">
                No shipments yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Potential Products Awaiting Approval */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ready to Convert</CardTitle>
            <Link
              href="/dashboard/potential-products?status=APPROVED"
              className="text-sm font-semibold text-[#3A9FE1] hover:text-[#2E8FD1] transition-colors"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {approvedPotentialProductsResult.success && approvedPotentialProductsResult.data && approvedPotentialProductsResult.data.length > 0 ? (
              <div className="space-y-4">
                {approvedPotentialProductsResult.data.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#212861] truncate">{product.name}</p>
                      <p className="text-sm text-[#6B7280] truncate">
                        {product.supplier?.companyName || "No supplier"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-[#6B7280]">Est. Margin</p>
                        <MarginDisplay
                          cost={product.estimatedCost}
                          price={product.estimatedPrice}
                        />
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/potential-products/${product.id}`}>
                          Convert
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF] text-center py-4">
                No potential products awaiting approval
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders - NEW */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link
              href="/dashboard/orders"
              className="text-sm font-semibold text-[#3A9FE1] hover:text-[#2E8FD1] transition-colors"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[#212861]">{order.orderNumber}</p>
                      <p className="text-sm text-[#6B7280]">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#212861]">
                        {formatCurrency(Number(order.total))}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF] text-center py-4">
                No orders yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Stats Section - NEW */}
      {orderStats && (
        <div>
          <h2 className="text-xl font-bold tracking-tight mb-4">Sales Overview (This Month)</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Orders This Month</CardTitle>
                <div className="p-2 rounded-lg bg-[#E8F4FB]">
                  <Receipt className="h-4 w-4 text-[#3A9FE1]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.monthOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue This Month</CardTitle>
                <div className="p-2 rounded-lg bg-[#D1FAE5]">
                  <DollarSign className="h-4 w-4 text-[#10B981]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(orderStats.monthRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
                <div className="p-2 rounded-lg bg-[#FEF3C7]">
                  <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.pendingPaymentOrders}</div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(orderStats.pendingPaymentValue)} pending
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
