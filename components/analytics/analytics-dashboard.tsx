"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalyticsStatsCards } from "@/components/analytics/analytics-stats-cards";
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { SalesByTypeChart } from "@/components/analytics/sales-by-type-chart";
import { ProductPerformanceGrid } from "@/components/analytics/product-performance-table";
import { SupplierPerformanceTable } from "@/components/analytics/supplier-performance-table";
import { getAnalyticsOverview, getProductPerformance, getSupplierPerformance, getRevenueByPeriod } from "@/lib/actions/analytics";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, formatCurrencyForExport } from "@/lib/utils/export";

const periodOptions = [
  { value: "1d", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "thisYear", label: "This Year" },
  { value: "allTime", label: "All Time" },
];

type PeriodType = "1d" | "7d" | "30d" | "90d" | "thisYear" | "allTime";

interface AnalyticsDashboardProps {
  initialOverview: any;
  initialProducts: any;
  initialSuppliers: any[];
  initialRevenueData: any[];
}

export function AnalyticsDashboard({
  initialOverview,
  initialProducts,
  initialSuppliers,
  initialRevenueData,
}: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<PeriodType>("30d");
  const [chartPeriod, setChartPeriod] = useState<"day" | "week" | "month">("day");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(initialOverview);
  const [products, setProducts] = useState<any>(initialProducts);
  const [suppliers, setSuppliers] = useState<any[]>(initialSuppliers);
  const [revenueData, setRevenueData] = useState<any[]>(initialRevenueData);

  // Only re-fetch when period changes from the default
  useEffect(() => {
    if (period === "30d") return; // Already have initial data
    fetchAnalytics();
  }, [period]);

  useEffect(() => {
    if (chartPeriod === "day") return; // Already have initial data
    fetchRevenueData();
  }, [chartPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewResult, productsResult, suppliersResult] = await Promise.all([
        getAnalyticsOverview(period),
        getProductPerformance(10),
        getSupplierPerformance(),
      ]);

      if (overviewResult.success && overviewResult.data) {
        setOverview(overviewResult.data);
      }

      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data);
      }

      if (suppliersResult.success && suppliersResult.data) {
        setSuppliers(suppliersResult.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const result = await getRevenueByPeriod(chartPeriod);
      if (result.success && result.data) {
        setRevenueData(result.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      if (!overview) {
        toast.error("No data to export");
        return;
      }

      const date = new Date().toISOString().split('T')[0];
      const filename = `analytics-report-${date}.csv`;

      const exportData: any[] = [];

      if (revenueData.length > 0) {
        revenueData.forEach((item) => {
          exportData.push({
            category: 'Revenue',
            date: item.date,
            revenue: formatCurrencyForExport(item.revenue),
            orders: item.orders,
          });
        });
      }

      if (overview.salesByType) {
        exportData.push({
          category: 'Sales by Type',
          type: 'Online',
          revenue: formatCurrencyForExport(overview.salesByType.online.revenue),
          count: overview.salesByType.online.count,
          percentage: overview.salesByType.online.percentage.toFixed(1) + '%',
        });
        exportData.push({
          category: 'Sales by Type',
          type: 'Wholesale',
          revenue: formatCurrencyForExport(overview.salesByType.wholesale.revenue),
          count: overview.salesByType.wholesale.count,
          percentage: overview.salesByType.wholesale.percentage.toFixed(1) + '%',
        });
        exportData.push({
          category: 'Sales by Type',
          type: 'Retail',
          revenue: formatCurrencyForExport(overview.salesByType.retail.revenue),
          count: overview.salesByType.retail.count,
          percentage: overview.salesByType.retail.percentage.toFixed(1) + '%',
        });
      }

      if (products?.bestSellers) {
        products.bestSellers.forEach((product: any, index: number) => {
          exportData.push({
            category: 'Product Performance',
            rank: index + 1,
            metric: 'Best Sellers',
            product: product.productName,
            sku: product.productSku,
            units_sold: product.unitsSold,
            revenue: formatCurrencyForExport(product.revenue),
            profit: formatCurrencyForExport(product.profit),
          });
        });
      }

      if (products?.topRevenue) {
        products.topRevenue.forEach((product: any, index: number) => {
          exportData.push({
            category: 'Product Performance',
            rank: index + 1,
            metric: 'Top Revenue',
            product: product.productName,
            sku: product.productSku,
            units_sold: product.unitsSold,
            revenue: formatCurrencyForExport(product.revenue),
            avg_price: formatCurrencyForExport(product.avgPrice || 0),
          });
        });
      }

      suppliers.forEach((supplier, index) => {
        exportData.push({
          category: 'Supplier Performance',
          rank: index + 1,
          supplier: supplier.supplierName,
          total_spent: formatCurrencyForExport(supplier.totalSpent),
          revenue_generated: formatCurrencyForExport(supplier.revenueGenerated),
          products_count: supplier.productsCount,
          orders_count: supplier.ordersCount,
          roi: ((supplier.revenueGenerated - supplier.totalSpent) / supplier.totalSpent * 100).toFixed(1) + '%',
        });
      });

      await exportToCSV(
        exportData,
        filename,
        ['category', 'date', 'type', 'rank', 'metric', 'product', 'sku', 'supplier', 'units_sold', 'revenue', 'profit', 'avg_price', 'orders', 'count', 'percentage', 'products_count', 'total_spent', 'revenue_generated', 'roi']
      );

      toast.success(`Exported ${filename}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export data");
    }
  };

  const periodLabel = periodOptions.find((p) => p.value === period)?.label || period;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your sales, revenue, and business performance
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {overview && (
        <AnalyticsStatsCards
          revenue={overview.revenue}
          profit={overview.profit}
          inventoryValue={overview.inventoryValue}
          lowStockCount={overview.lowStockCount}
          periodLabel={period === "allTime" ? "All Time" : periodLabel.replace("Last ", "")}
        />
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Revenue Over Time</h3>
              <Select value={chartPeriod} onValueChange={(value: any) => setChartPeriod(value)}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RevenueChart data={revenueData} period={chartPeriod} />
          </CardContent>
        </Card>

        {/* Sales by Type */}
        {overview?.salesByType && (
          <SalesByTypeChart data={overview.salesByType} />
        )}
      </div>

      {/* Product Performance */}
      {products && (
        <>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">Product Performance</h2>
            <ProductPerformanceGrid
              bestSellers={products.bestSellers}
              topRevenue={products.topRevenue}
              topProfit={products.topProfit}
            />
          </div>

          {/* Slow Moving Products */}
          {products.slowMovers && products.slowMovers.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Slow Moving Products (Last 30 Days)</h3>
                <div className="space-y-2">
                  {products.slowMovers.slice(0, 5).map((product: any) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">SKU: {product.productSku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{product.stockLevel} in stock</p>
                        <p className="text-sm text-muted-foreground">
                          ${product.revenue30Days.toFixed(2)} revenue
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Supplier Performance */}
      {suppliers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Supplier Performance</h2>
          <SupplierPerformanceTable suppliers={suppliers} />
        </div>
      )}
    </div>
  );
}
