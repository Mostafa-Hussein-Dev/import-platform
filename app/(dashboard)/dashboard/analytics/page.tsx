import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getAnalyticsOverview, getProductPerformance, getSupplierPerformance, getRevenueByPeriod } from "@/lib/actions/analytics";

export default async function AnalyticsPage() {
  // Fetch all initial data server-side in parallel
  const [overviewResult, productsResult, suppliersResult, revenueResult] = await Promise.all([
    getAnalyticsOverview("30d"),
    getProductPerformance(10),
    getSupplierPerformance(),
    getRevenueByPeriod("day"),
  ]);

  return (
    <AnalyticsDashboard
      initialOverview={overviewResult.success ? overviewResult.data : null}
      initialProducts={productsResult.success ? productsResult.data : null}
      initialSuppliers={suppliersResult.success && suppliersResult.data ? suppliersResult.data : []}
      initialRevenueData={revenueResult.success && revenueResult.data ? revenueResult.data : []}
    />
  );
}
