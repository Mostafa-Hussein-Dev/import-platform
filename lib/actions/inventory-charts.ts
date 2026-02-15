"use server";

import { prisma } from "@/lib";

export type InventoryChartsActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get stock value breakdown by category
 */
export async function getStockValueByCategory(): Promise<InventoryChartsActionResult<Array<{
  category: string;
  value: number;
}>>> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        currentStock: { gt: 0 },
        landedCost: { not: null },
      },
      select: {
        category: true,
        currentStock: true,
        landedCost: true,
      },
    });

    const categoryMap = new Map<string, number>();

    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      const value = Number(product.landedCost!) * product.currentStock;
      categoryMap.set(category, (categoryMap.get(category) || 0) + value);
    });

    const data = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value: Math.round(value * 100) / 100,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching stock value by category:", error);
    return { success: false, error: "Failed to fetch stock value by category" };
  }
}

/**
 * Get stock movements trend for the last 30 days
 */
export async function getStockMovementsTrend(
  days: number = 30
): Promise<InventoryChartsActionResult<Array<{
  date: string;
  in: number;
  out: number;
}>>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await prisma.stockMovement.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        type: true,
        quantity: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const trendByDate: Record<string, { in: number; out: number }> = {};

    movements.forEach((m) => {
      const dateKey = m.createdAt.toISOString().split("T")[0];
      if (!trendByDate[dateKey]) {
        trendByDate[dateKey] = { in: 0, out: 0 };
      }

      if (m.type === "in" || m.type === "adjustment") {
        if (m.quantity > 0) {
          trendByDate[dateKey].in += m.quantity;
        } else {
          trendByDate[dateKey].out += Math.abs(m.quantity);
        }
      } else if (m.type === "out") {
        trendByDate[dateKey].out += Math.abs(m.quantity);
      }
    });

    // Fill in missing dates
    const result: Array<{ date: string; in: number; out: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const dateKey = date.toISOString().split("T")[0];

      const data = trendByDate[dateKey] || { in: 0, out: 0 };
      result.push({
        date: dateKey,
        in: data.in,
        out: data.out,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching stock movements trend:", error);
    return { success: false, error: "Failed to fetch stock movements trend" };
  }
}

/**
 * Get top products by inventory value
 */
export async function getTopProductsByValue(
  limit: number = 10
): Promise<InventoryChartsActionResult<Array<{
  productId: string;
  name: string;
  sku: string;
  value: number;
}>>> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        currentStock: { gt: 0 },
        landedCost: { not: null },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        landedCost: true,
      },
    });

    // Calculate value and sort
    const productsWithValue = products
      .map((product) => ({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        value: Number(product.landedCost!) * product.currentStock,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit)
      .map((p) => ({
        ...p,
        value: Math.round(p.value * 100) / 100,
      }));

    return { success: true, data: productsWithValue };
  } catch (error) {
    console.error("Error fetching top products by value:", error);
    return { success: false, error: "Failed to fetch top products by value" };
  }
}
