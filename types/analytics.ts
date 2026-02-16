export interface RevenueMetrics {
  totalRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  ordersCount: number;
  avgOrderValue: number;
  growthRate: number; // percentage
}

export interface ProfitMetrics {
  totalProfit: number;
  monthProfit: number;
  lastMonthProfit: number;
  profitMargin: number; // percentage
  cogsSold: number; // Cost of Goods Sold
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  productSku: string;
  productImage?: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  avgPrice: number;
}

export interface ProductPerformanceData {
  bestSellers: ProductPerformance[];
  topRevenue: ProductPerformance[];
  topProfit: ProductPerformance[];
  slowMovers: Array<{
    productId: string;
    productName: string;
    productSku: string;
    stockLevel: number;
    lastSaleDate: Date | null;
    revenue30Days: number;
  }>;
}

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalSpent: number; // From purchase orders
  revenueGenerated: number; // From products sold
  productsCount: number;
  ordersCount: number;
  avgProductCost: number;
}

export interface RevenueByPeriod {
  date: string;
  revenue: number;
  orders: number;
}

export interface SalesByType {
  online: {
    revenue: number;
    count: number;
    percentage: number;
  };
  wholesale: {
    revenue: number;
    count: number;
    percentage: number;
  };
  retail: {
    revenue: number;
    count: number;
    percentage: number;
  };
}

export interface AnalyticsOverview {
  revenue: RevenueMetrics;
  profit: ProfitMetrics;
  salesByType: SalesByType;
  inventoryValue: number;
  lowStockCount: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PeriodFilter {
  period: "1d" | "7d" | "30d" | "90d" | "thisYear" | "allTime";
  startDate?: Date;
  endDate?: Date;
}

export interface ExportData {
  revenue: RevenueByPeriod[];
  orders: OrderExportData[];
  products: ProductPerformance[];
  suppliers: SupplierPerformance[];
}

export interface OrderExportData {
  orderNumber: string;
  date: string;
  customer: string;
  type: string;
  status: string;
  paymentStatus: string;
  itemsCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
}
