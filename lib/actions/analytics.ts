"use server";

import { prisma } from "@/lib";
import { Prisma } from "@prisma/client";

export type AnalyticsActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get revenue metrics
 */
export async function getRevenueMetrics(
  period: "all" | "month" | "lastMonth" = "all"
): Promise<AnalyticsActionResult<{
  totalRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  ordersCount: number;
  avgOrderValue: number;
  growthRate: number;
}>> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalResult, monthResult, lastMonthResult, countResult] = await Promise.all([
      // All time revenue
      prisma.order.aggregate({
        where: { status: { not: "cancelled" } },
        _sum: { total: true },
      }),
      // This month revenue
      prisma.order.aggregate({
        where: {
          status: { not: "cancelled" },
          createdAt: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      // Last month revenue
      prisma.order.aggregate({
        where: {
          status: { not: "cancelled" },
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { total: true },
      }),
      // Total orders count
      prisma.order.count({
        where: { status: { not: "cancelled" } },
      }),
    ]);

    const totalRevenue = Number(totalResult._sum.total || 0);
    const monthRevenue = Number(monthResult._sum.total || 0);
    const lastMonthRevenue = Number(lastMonthResult._sum.total || 0);
    const ordersCount = countResult;

    // Calculate growth rate
    let growthRate = 0;
    if (lastMonthRevenue > 0) {
      growthRate = ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    }

    // Average order value
    const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

    return {
      success: true,
      data: {
        totalRevenue,
        monthRevenue,
        lastMonthRevenue,
        ordersCount,
        avgOrderValue,
        growthRate,
      },
    };
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    return { success: false, error: "Failed to fetch revenue metrics" };
  }
}

/**
 * Get profit metrics
 */
export async function getProfitMetrics(
  period: "all" | "month" | "lastMonth" = "all"
): Promise<AnalyticsActionResult<{
  totalProfit: number;
  monthProfit: number;
  lastMonthProfit: number;
  profitMargin: number;
  cogsSold: number;
}>> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Single query: fetch all order items (no date filter) and classify in memory
    const allItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { not: "cancelled" },
        },
      },
      select: {
        totalPrice: true,
        quantity: true,
        product: {
          select: { landedCost: true },
        },
        order: {
          select: { createdAt: true },
        },
      },
    });

    let totalRevenue = 0;
    let totalCogs = 0;
    let monthRevenue = 0;
    let monthCogs = 0;
    let lastMonthRevenue = 0;
    let lastMonthCogs = 0;

    for (const item of allItems) {
      const revenue = Number(item.totalPrice);
      const landedCost = item.product.landedCost ? Number(item.product.landedCost) : 0;
      const cogs = landedCost * item.quantity;
      const orderDate = item.order.createdAt;

      totalRevenue += revenue;
      totalCogs += cogs;

      if (orderDate >= startOfMonth) {
        monthRevenue += revenue;
        monthCogs += cogs;
      } else if (orderDate >= startOfLastMonth && orderDate <= endOfLastMonth) {
        lastMonthRevenue += revenue;
        lastMonthCogs += cogs;
      }
    }

    const totalProfit = totalRevenue - totalCogs;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      success: true,
      data: {
        totalProfit,
        monthProfit: monthRevenue - monthCogs,
        lastMonthProfit: lastMonthRevenue - lastMonthCogs,
        profitMargin,
        cogsSold: totalCogs,
      },
    };
  } catch (error) {
    console.error("Error fetching profit metrics:", error);
    return { success: false, error: "Failed to fetch profit metrics" };
  }
}

/**
 * Get product performance data
 */
export async function getProductPerformance(
  limit: number = 10
): Promise<AnalyticsActionResult<{
  bestSellers: Array<{
    productId: string;
    productName: string;
    productSku: string;
    productImage: string | null;
    unitsSold: number;
    revenue: number;
    profit: number;
  }>;
  topRevenue: Array<{
    productId: string;
    productName: string;
    productSku: string;
    productImage: string | null;
    unitsSold: number;
    revenue: number;
    avgPrice: number;
  }>;
  topProfit: Array<{
    productId: string;
    productName: string;
    productSku: string;
    productImage: string | null;
    unitsSold: number;
    revenue: number;
    profit: number;
  }>;
  slowMovers: Array<{
    productId: string;
    productName: string;
    productSku: string;
    stockLevel: number;
    lastSaleDate: Date | null;
    revenue30Days: number;
  }>;
}>> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Single query for all order items + parallel query for products with stock
    const [allItems, allProductsWithStock] = await Promise.all([
      prisma.orderItem.findMany({
        where: {
          order: {
            status: { not: "cancelled" },
          },
        },
        select: {
          quantity: true,
          totalPrice: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
              landedCost: true,
              currentStock: true,
            },
          },
          order: {
            select: {
              createdAt: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          currentStock: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          currentStock: true,
        },
      }),
    ]);

    // Build all-time stats AND recent stats in a single pass
    const productStats = new Map<
      string,
      {
        productName: string;
        productSku: string;
        productImage: string | null;
        unitsSold: number;
        revenue: number;
        cogs: number;
        revenue30Days: number;
        lastSaleDate: Date | null;
      }
    >();

    for (const item of allItems) {
      const productId = item.product.id;
      const existing = productStats.get(productId);

      const quantity = item.quantity;
      const revenue = Number(item.totalPrice);
      const landedCost = item.product.landedCost ? Number(item.product.landedCost) : 0;
      const cogs = landedCost * quantity;
      const isRecent = item.order.createdAt >= thirtyDaysAgo;

      if (existing) {
        existing.unitsSold += quantity;
        existing.revenue += revenue;
        existing.cogs += cogs;
        if (isRecent) {
          existing.revenue30Days += revenue;
        }
        if (!existing.lastSaleDate || item.order.createdAt > existing.lastSaleDate) {
          existing.lastSaleDate = item.order.createdAt;
        }
      } else {
        productStats.set(productId, {
          productName: item.product.name,
          productSku: item.product.sku,
          productImage: item.product.images[0] || null,
          unitsSold: quantity,
          revenue,
          cogs,
          revenue30Days: isRecent ? revenue : 0,
          lastSaleDate: item.order.createdAt,
        });
      }
    }

    // Convert to array and calculate profit
    const productsArray = Array.from(productStats.entries()).map(([productId, data]) => ({
      productId,
      productName: data.productName,
      productSku: data.productSku,
      productImage: data.productImage,
      unitsSold: data.unitsSold,
      revenue: data.revenue,
      profit: data.revenue - data.cogs,
      avgPrice: data.unitsSold > 0 ? data.revenue / data.unitsSold : 0,
    }));

    // Best sellers (by units sold)
    const bestSellers = [...productsArray]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, limit);

    // Top revenue (by revenue)
    const topRevenue = [...productsArray]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // Top profit (by profit)
    const topProfit = [...productsArray]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);

    // Slow movers: products with stock but low recent sales
    const slowMovers = allProductsWithStock
      .map((product) => {
        const stats = productStats.get(product.id);
        return {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          stockLevel: product.currentStock,
          lastSaleDate: stats?.lastSaleDate || null,
          revenue30Days: stats?.revenue30Days || 0,
        };
      })
      .filter((p) => p.revenue30Days < 100)
      .sort((a, b) => b.stockLevel - a.stockLevel)
      .slice(0, limit);

    return {
      success: true,
      data: {
        bestSellers,
        topRevenue,
        topProfit,
        slowMovers,
      },
    };
  } catch (error) {
    console.error("Error fetching product performance:", error);
    return { success: false, error: "Failed to fetch product performance" };
  }
}

/**
 * Get supplier performance
 */
export async function getSupplierPerformance(): Promise<AnalyticsActionResult<Array<{
  supplierId: string;
  supplierName: string;
  totalSpent: number;
  revenueGenerated: number;
  productsCount: number;
  ordersCount: number;
  avgProductCost: number;
}>>> {
  try {
    // Fetch lightweight supplier data and revenue separately to avoid loading all orderItems
    const [suppliers, revenueBySupplier] = await Promise.all([
      prisma.supplier.findMany({
        where: { isActive: true },
        select: {
          id: true,
          companyName: true,
          products: {
            select: {
              id: true,
              costPrice: true,
            },
          },
          purchaseOrders: {
            select: {
              id: true,
              totalCost: true,
            },
          },
        },
      }),
      // Get revenue per supplier's products in a single query
      prisma.orderItem.findMany({
        where: {
          order: { status: { not: "cancelled" } },
          product: { supplier: { isActive: true } },
        },
        select: {
          totalPrice: true,
          product: {
            select: { supplierId: true },
          },
        },
      }),
    ]);

    // Aggregate revenue by supplier in memory
    const revenueMap = new Map<string, number>();
    for (const item of revenueBySupplier) {
      const supplierId = item.product.supplierId;
      revenueMap.set(supplierId, (revenueMap.get(supplierId) || 0) + Number(item.totalPrice));
    }

    const supplierData = suppliers.map((supplier) => {
      const totalSpent = supplier.purchaseOrders.reduce(
        (sum, po) => sum + Number(po.totalCost),
        0
      );

      const productsCount = supplier.products.length;
      const ordersCount = supplier.purchaseOrders.length;

      const avgProductCost =
        productsCount > 0
          ? supplier.products.reduce((sum, p) => sum + Number(p.costPrice), 0) / productsCount
          : 0;

      return {
        supplierId: supplier.id,
        supplierName: supplier.companyName,
        totalSpent,
        revenueGenerated: revenueMap.get(supplier.id) || 0,
        productsCount,
        ordersCount,
        avgProductCost,
      };
    });

    supplierData.sort((a, b) => b.totalSpent - a.totalSpent);

    return { success: true, data: supplierData };
  } catch (error) {
    console.error("Error fetching supplier performance:", error);
    return { success: false, error: "Failed to fetch supplier performance" };
  }
}

/**
 * Get revenue by period for charts
 */
export async function getRevenueByPeriod(
  period: "day" | "week" | "month",
  dateRange?: { start: Date; end: Date }
): Promise<AnalyticsActionResult<Array<{ date: string; revenue: number; orders: number }>>> {
  try {
    const now = new Date();
    let startDate: Date;
    let groupBy: string;

    if (dateRange) {
      startDate = dateRange.start;
    } else {
      // Default ranges based on period
      switch (period) {
        case "day":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 90);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 12);
          break;
      }
    }

    const endDate = dateRange?.end || now;

    // Get orders within date range
    const orders = await prisma.order.findMany({
      where: {
        status: { not: "cancelled" },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by period
    const revenueByPeriod = new Map<string, { revenue: number; orders: number }>();

    for (const order of orders) {
      const date = order.createdAt;
      let key: string;

      if (period === "day") {
        key = date.toISOString().split("T")[0]; // YYYY-MM-DD
      } else if (period === "week") {
        // Get week number
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        // month
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      }

      const existing = revenueByPeriod.get(key);
      if (existing) {
        existing.revenue += Number(order.total);
        existing.orders += 1;
      } else {
        revenueByPeriod.set(key, {
          revenue: Number(order.total),
          orders: 1,
        });
      }
    }

    // Convert to array and sort
    const result = Array.from(revenueByPeriod.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }));

    result.sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching revenue by period:", error);
    return { success: false, error: "Failed to fetch revenue by period" };
  }
}

/**
 * Get sales by order type
 */
export async function getSalesByType(
  dateRange?: { start: Date; end: Date }
): Promise<AnalyticsActionResult<{
  online: { revenue: number; count: number; percentage: number };
  wholesale: { revenue: number; count: number; percentage: number };
  retail: { revenue: number; count: number; percentage: number };
}>> {
  try {
    const where: Prisma.OrderWhereInput = {
      status: { not: "cancelled" },
    };

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        type: true as any,
        total: true,
      },
    });

    let onlineRevenue = 0;
    let onlineCount = 0;
    let wholesaleRevenue = 0;
    let wholesaleCount = 0;
    let retailRevenue = 0;
    let retailCount = 0;

    for (const order of orders) {
      const total = Number(order.total);
      switch (order.type) {
        case "online":
          onlineRevenue += total;
          onlineCount++;
          break;
        case "wholesale":
          wholesaleRevenue += total;
          wholesaleCount++;
          break;
        case "retail":
          retailRevenue += total;
          retailCount++;
          break;
      }
    }

    const totalRevenue = onlineRevenue + wholesaleRevenue + retailRevenue;

    return {
      success: true,
      data: {
        online: {
          revenue: onlineRevenue,
          count: onlineCount,
          percentage: totalRevenue > 0 ? (onlineRevenue / totalRevenue) * 100 : 0,
        },
        wholesale: {
          revenue: wholesaleRevenue,
          count: wholesaleCount,
          percentage: totalRevenue > 0 ? (wholesaleRevenue / totalRevenue) * 100 : 0,
        },
        retail: {
          revenue: retailRevenue,
          count: retailCount,
          percentage: totalRevenue > 0 ? (retailRevenue / totalRevenue) * 100 : 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching sales by type:", error);
    return { success: false, error: "Failed to fetch sales by type" };
  }
}

/**
 * Get orders export data
 */
export async function getOrdersExportData(
  dateRange?: { start: Date; end: Date }
): Promise<AnalyticsActionResult<Array<{
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
}>>> {
  try {
    const where: Prisma.OrderWhereInput = {};

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt.toISOString().split("T")[0],
      customer: order.customerName,
      type: order.type,
      status: order.status,
      paymentStatus: order.paymentStatus,
      itemsCount: order._count.items,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shippingFee),
      discount: Number(order.discount || 0),
      total: Number(order.total),
      paid: Number(order.paidAmount),
      balance: Number(order.total) - Number(order.paidAmount),
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching orders export data:", error);
    return { success: false, error: "Failed to fetch orders export data" };
  }
}

/**
 * Get complete analytics overview
 */
export async function getAnalyticsOverview(
  period: "1d" | "7d" | "30d" | "90d" | "thisYear" | "allTime" = "30d"
): Promise<AnalyticsActionResult<{
  revenue: {
    totalRevenue: number;
    periodRevenue: number;
    ordersCount: number;
    avgOrderValue: number;
    growthRate: number;
  };
  profit: {
    totalProfit: number;
    profitMargin: number;
  };
  salesByType: {
    online: { revenue: number; count: number; percentage: number };
    wholesale: { revenue: number; count: number; percentage: number };
    retail: { revenue: number; count: number; percentage: number };
  };
  inventoryValue: number;
  lowStockCount: number;
}>> {
  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    const startOfLastPeriod = new Date();

    switch (period) {
      case "1d":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        startOfLastPeriod.setDate(startOfLastPeriod.getDate() - 1);
        startOfLastPeriod.setHours(0, 0, 0, 0);
        break;
      case "7d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startOfLastPeriod.setDate(startOfLastPeriod.getDate() - 14);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startOfLastPeriod.setDate(startOfLastPeriod.getDate() - 60);
        break;
      case "90d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        startOfLastPeriod.setDate(startOfLastPeriod.getDate() - 180);
        break;
      case "thisYear":
        startDate = new Date(now.getFullYear(), 0, 1);
        startOfLastPeriod.setFullYear(startOfLastPeriod.getFullYear() - 1);
        break;
      case "allTime":
        startDate = new Date(0);
        startOfLastPeriod.setDate(startOfLastPeriod.getDate() - 30);
        break;
    }

    const [revenueData, profitData, salesByTypeData, inventoryData] = await Promise.all([
      // Revenue metrics
      (async () => {
        const [current, last] = await Promise.all([
          prisma.order.aggregate({
            where: {
              status: { not: "cancelled" },
              createdAt: { gte: startDate },
            },
            _sum: { total: true },
            _count: true,
          }),
          prisma.order.aggregate({
            where: {
              status: { not: "cancelled" },
              createdAt: {
                gte: startOfLastPeriod,
                lt: startDate,
              },
            },
            _sum: { total: true },
          }),
        ]);

        const currentRevenue = Number(current._sum.total || 0);
        const lastRevenue = Number(last._sum.total || 0);
        const growthRate = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

        return {
          totalRevenue: currentRevenue,
          periodRevenue: currentRevenue,
          ordersCount: current._count,
          avgOrderValue: current._count > 0 ? currentRevenue / current._count : 0,
          growthRate,
        };
      })(),
      // Profit metrics
      (async () => {
        const orderItems = await prisma.orderItem.findMany({
          where: {
            order: {
              status: { not: "cancelled" },
              createdAt: { gte: startDate },
            },
          },
          include: {
            product: {
              select: { landedCost: true },
            },
          },
        });

        let revenue = 0;
        let cogs = 0;

        for (const item of orderItems) {
          revenue += Number(item.totalPrice);
          const landedCost = item.product.landedCost ? Number(item.product.landedCost) : 0;
          cogs += landedCost * item.quantity;
        }

        const profit = revenue - cogs;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return { totalProfit: profit, profitMargin };
      })(),
      // Sales by type
      getSalesByType({ start: startDate, end: now }),
      // Inventory data
      (async () => {
        const [valueResult, lowStockResult] = await Promise.all([
          prisma.product.aggregate({
            where: {
              status: "ACTIVE",
              landedCost: { not: null },
              currentStock: { gt: 0 },
            },
            _sum: {
              currentStock: true,
            },
          }),
          prisma.product.count({
            where: {
              status: "ACTIVE",
              currentStock: {
                gt: 0,
                lte: prisma.product.fields.reorderLevel,
              },
            },
          }),
        ]);

        // Calculate inventory value
        const products = await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            landedCost: { not: null },
            currentStock: { gt: 0 },
          },
          select: {
            currentStock: true,
            landedCost: true,
          },
        });

        const inventoryValue = products.reduce(
          (sum, p) => sum + Number(p.landedCost!) * p.currentStock,
          0
        );

        return {
          inventoryValue,
          lowStockCount: lowStockResult,
        };
      })(),
    ]);

    if (!salesByTypeData.success || !salesByTypeData.data) {
      throw new Error("Failed to fetch sales by type");
    }

    return {
      success: true,
      data: {
        revenue: revenueData,
        profit: profitData,
        salesByType: salesByTypeData.data,
        inventoryValue: inventoryData.inventoryValue,
        lowStockCount: inventoryData.lowStockCount,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return { success: false, error: "Failed to fetch analytics overview" };
  }
}
