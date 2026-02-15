import { Suspense } from "react";
import { getInventoryStats, getLowStockProducts, getOutOfStockProducts } from "@/lib/actions/inventory";
import { getRecentStockMovements } from "@/lib/actions/stock-movements";
import { getStockValueByCategory, getStockMovementsTrend, getTopProductsByValue } from "@/lib/actions/inventory-charts";
import { InventoryStatsCards } from "@/components/inventory/inventory-stats-cards";
import { LowStockTable } from "@/components/inventory/low-stock-table";
import { StockMovementsTable } from "@/components/inventory/stock-movements-table";
import { CurrentStockContent } from "@/components/inventory/current-stock-content";
import { StockCharts } from "@/components/inventory/stock-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Warehouse, History, AlertTriangle, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

async function InventoryStats() {
  const statsResult = await getInventoryStats();
  const stats = statsResult.success ? statsResult.data ?? {
    totalProducts: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStockUnits: 0,
  } : {
    totalProducts: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStockUnits: 0,
  };

  return <InventoryStatsCards stats={stats} />;
}

async function LowStockContent() {
  const lowStockResult = await getLowStockProducts();
  const lowStock = lowStockResult.success ? lowStockResult.data ?? [] : [];

  return <LowStockTable data={lowStock} />;
}

async function RecentMovementsContent() {
  const movementsResult = await getRecentStockMovements(10);
  const movements = movementsResult.success ? movementsResult.data ?? [] : [];

  return <StockMovementsTable data={movements} />;
}

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-4 h-full">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="flex-1">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

async function InventoryCharts() {
  const [categoryResult, trendResult, topProductsResult] = await Promise.all([
    getStockValueByCategory(),
    getStockMovementsTrend(30),
    getTopProductsByValue(10),
  ]);

  const stockValueByCategory = categoryResult.success ? categoryResult.data ?? [] : [];
  const stockMovementsTrend = trendResult.success ? trendResult.data ?? [] : [];
  const topProductsByValue = topProductsResult.success ? topProductsResult.data ?? [] : [];

  return (
    <StockCharts
      stockValueByCategory={stockValueByCategory}
      stockMovementsTrend={stockMovementsTrend}
      topProductsByValue={topProductsByValue}
    />
  );
}

export default async function InventoryPage() {
  const lowStockResult = await getLowStockProducts();
  const lowStockCount = lowStockResult.success ? lowStockResult.data?.length ?? 0 : 0;

  const outOfStockResult = await getOutOfStockProducts();
  const outOfStockCount = outOfStockResult.success ? outOfStockResult.data?.length ?? 0 : 0;

  const totalAlerts = lowStockCount + outOfStockCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212861]">Inventory Management</h1>
          <p className="text-[#6B7280] mt-1">Monitor stock levels, track movements, and manage inventory</p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="current" className="gap-2">
            <Warehouse className="h-4 w-4" />
            Current Stock
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <History className="h-4 w-4" />
            Recent Movements
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stock Alerts
            {totalAlerts > 0 && (
              <Badge variant="secondary" className="ml-1">{totalAlerts}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="py-12 text-center text-[#6B7280]">Loading...</div>}>
                <LowStockContent />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <CurrentStockContent />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Recent Stock Movements</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/inventory/movements">View All</a>
              </Button>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="py-12 text-center text-[#6B7280]">Loading...</div>}>
                <RecentMovementsContent />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <Suspense fallback={<ChartsSkeleton />}>
              <InventoryCharts />
            </Suspense>
            <Suspense fallback={<StatsSkeleton />}>
              <InventoryStats />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
