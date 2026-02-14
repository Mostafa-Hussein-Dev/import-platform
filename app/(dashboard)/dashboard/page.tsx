import { getSupplierCount, getRecentSuppliers } from "@/lib/actions/suppliers";
import { getProductCount, getActiveProductCount, getLowStockProductCount, getRecentProducts } from "@/lib/actions/products";
import { getPotentialProductsCount, getApprovedPotentialProducts } from "@/lib/actions/potential-products";
import {
  getPurchaseOrderCount,
  getRecentPurchaseOrders,
  getTotalPurchaseOrderValue,
} from "@/lib/actions/purchase-orders";
import { getShipmentCount, getRecentShipments } from "@/lib/actions/shipments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Factory, Package, TrendingUp, AlertTriangle, Search, ShoppingCart, Truck, FileText } from "lucide-react";
import Link from "next/link";
import { MarginDisplay } from "@/components/potential-products/margin-display";
import { formatCurrency } from "@/lib/utils";

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
  ]);

  const potentialProductsCount = potentialProductsCountResult.success ? potentialProductsCountResult.data : null;

  const activePOs = (sentPOResult.success ? sentPOResult.data || 0 : 0) +
    (confirmedPOResult.success ? confirmedPOResult.data || 0 : 0);
  const inTransitShipments = inTransitShipmentsResult.success ? inTransitShipmentsResult.data || 0 : 0;
  const atCustomsShipments = customsShipmentsResult.success ? customsShipmentsResult.data || 0 : 0;
  const thisMonthPOValue = thisMonthPOValueResult.success ? thisMonthPOValueResult.data || 0 : 0;

  const stats = [
    {
      title: "Active POs",
      value: activePOs,
      icon: ShoppingCart,
      href: "/dashboard/purchase-orders",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "In Transit",
      value: inTransitShipments,
      icon: Truck,
      href: "/dashboard/shipments",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "At Customs",
      value: atCustomsShipments,
      icon: FileText,
      href: "/dashboard/shipments",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "This Month PO Value",
      value: formatCurrency(thisMonthPOValue),
      icon: TrendingUp,
      href: "/dashboard/purchase-orders",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#212861]">Welcome back!</h2>
        <p className="text-[#6B7280]">Here's an overview of your import platform.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#6B7280]">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#212861]">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Purchase Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Purchase Orders</CardTitle>
            <Link
              href="/dashboard/purchase-orders"
              className="text-sm text-blue-600 hover:underline"
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
              className="text-sm text-blue-600 hover:underline"
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
              className="text-sm text-blue-600 hover:underline"
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
      </div>
    </div>
  );
}
