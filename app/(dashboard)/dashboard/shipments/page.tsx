import { getShipments, getShipmentCount } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import { Truck, Plus, Ship, Package, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; status?: string; };
}) {
  const page = parseInt(searchParams.page || "1");

  const [shipmentsResult, countResult] = await Promise.all([
    getShipments({
      page,
      pageSize: "25",
      search: searchParams.search,
      status: (searchParams.status as any) || "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    }),
    getShipmentCount(),
  ]);

  if (!shipmentsResult.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">{shipmentsResult.error}</p>
      </div>
    );
  }

  const totalCount = countResult.success ? countResult.data || 0 : 0;
  const inTransitCount = countResult.success ? (await getShipmentCount({ status: "in_transit" })).data || 0 : 0;
  const atCustomsCount = countResult.success ? (await getShipmentCount({ status: "customs" })).data || 0 : 0;

  const statusColors: Record<string, string> = {
    pending: "bg-[#F3F4F6] text-[#374151] hover:bg-[#F3F4F6]",
    in_transit: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    customs: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    delivered: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  };

  const statusIcons: Record<string, any> = {
    pending: Clock,
    in_transit: Ship,
    customs: Package,
    delivered: CheckCircle,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212861]">Shipments</h1>
          <p className="text-[#6B7280]">Track your logistics from China to Lebanon</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/shipments/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Shipment
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Total Shipments
            </CardTitle>
            <Truck className="h-4 w-4 text-[#6B7280]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#212861]">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              In Transit
            </CardTitle>
            <Ship className="h-4 w-4 text-[#3A9FE1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#212861]">{inTransitCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              At Customs
            </CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#212861]">{atCustomsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#212861]">
              {countResult.success ? countResult.data || 0 : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          {shipmentsResult.data && shipmentsResult.data.shipments.length > 0 ? (
            <div className="space-y-4">
              {shipmentsResult.data.shipments.map((shipment) => {
                const StatusIcon = statusIcons[shipment.status];
                return (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between border-b border-[#F3F4F6] pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/dashboard/shipments/${shipment.id}`}
                        className="font-semibold text-[#212861] hover:text-[#3A9FE1]"
                      >
                        {shipment.shipmentNumber}
                      </Link>
                      <p className="text-sm text-[#6B7280] mt-1">
                        {shipment.purchaseOrder.poNumber} · {shipment.purchaseOrder.supplier.companyName}
                      </p>
                      <p className="text-sm text-[#6B7280]">
                        {shipment.shippingCompany.name} · {shipment.method}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[#6B7280]">
                        {shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toLocaleDateString() : "TBD"}
                      </span>
                      <Badge className={`text-xs px-2 py-1 ${statusColors[shipment.status]}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {shipment.status}
                      </Badge>
                      <span className="font-medium text-[#212861]">
                        {formatCurrency(shipment.totalCost)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-[#9CA3AF] mb-4" />
              <p className="text-[#6B7280]">No shipments found</p>
              <p className="text-sm text-[#9CA3AF] mt-2">
                Create shipments when your orders are ready to ship
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
