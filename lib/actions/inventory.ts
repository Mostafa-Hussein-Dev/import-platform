"use server";

import { prisma } from "@/lib";
import { revalidatePath } from "next/cache";
import { createBulkStockMovements } from "./stock-movements";
import { Prisma } from "@prisma/client";

export type InventoryActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get products where current stock is at or below reorder level
 */
export async function getLowStockProducts(): Promise<InventoryActionResult<Array<{
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  stockNeeded: number;
  moq: number | null;
  images: string[];
  supplier: {
    id: string;
    companyName: string;
  };
  lastOrderDate?: Date;
}>>> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        currentStock: {
          lte: prisma.product.fields.reorderLevel,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        reorderLevel: true,
        moq: true,
        images: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
        purchaseOrderItems: {
          select: {
            purchaseOrder: {
              select: { orderDate: true },
            },
          },
          orderBy: { purchaseOrder: { orderDate: "desc" } },
          take: 1,
        },
      },
      orderBy: [{ currentStock: "asc" }],
    });

    const productsWithOrderDate = products.map((product) => {
      const { purchaseOrderItems, ...rest } = product;
      return {
        ...rest,
        stockNeeded: product.reorderLevel - product.currentStock,
        lastOrderDate: purchaseOrderItems[0]?.purchaseOrder.orderDate,
      };
    });

    return { success: true, data: productsWithOrderDate };
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return { success: false, error: "Failed to fetch low stock products" };
  }
}

/**
 * Get products that are completely out of stock
 */
export async function getOutOfStockProducts(): Promise<InventoryActionResult<Array<{
  id: string;
  name: string;
  sku: string;
  reorderLevel: number;
  images: string[];
  supplier: {
    id: string;
    companyName: string;
  };
}>>> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        currentStock: 0,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        reorderLevel: true,
        images: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching out of stock products:", error);
    return { success: false, error: "Failed to fetch out of stock products" };
  }
}

/**
 * Calculate total inventory value
 */
export async function getInventoryValue(): Promise<InventoryActionResult<{
  totalValue: number;
  breakdown: Array<{
    category: string | null;
    value: number;
    count: number;
  }>;
  supplierBreakdown: Array<{
    supplierId: string;
    supplierName: string;
    value: number;
    count: number;
  }>;
}>> {
  try {
    // Get all products with stock
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        currentStock: { gt: 0 },
        landedCost: { not: null },
      },
      select: {
        id: true,
        name: true,
        category: true,
        currentStock: true,
        landedCost: true,
        supplierId: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    // Calculate total value and breakdown by category
    const categoryBreakdown: Record<string, { value: number; count: number }> = {};
    const supplierBreakdown: Record<string, { value: number; count: number; name: string }> = {};
    let totalValue = 0;

    products.forEach((product) => {
      const value = Number(product.landedCost!) * product.currentStock;
      totalValue += value;

      // Category breakdown
      const category = product.category || "Uncategorized";
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { value: 0, count: 0 };
      }
      categoryBreakdown[category].value += value;
      categoryBreakdown[category].count += 1;

      // Supplier breakdown
      if (!supplierBreakdown[product.supplierId]) {
        supplierBreakdown[product.supplierId] = {
          value: 0,
          count: 0,
          name: product.supplier.companyName,
        };
      }
      supplierBreakdown[product.supplierId].value += value;
      supplierBreakdown[product.supplierId].count += 1;
    });

    return {
      success: true,
      data: {
        totalValue,
        breakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
          category,
          value: data.value,
          count: data.count,
        })),
        supplierBreakdown: Object.entries(supplierBreakdown).map(([supplierId, data]) => ({
          supplierId,
          supplierName: data.name,
          value: data.value,
          count: data.count,
        })),
      },
    };
  } catch (error) {
    console.error("Error calculating inventory value:", error);
    return { success: false, error: "Failed to calculate inventory value" };
  }
}

/**
 * Get low stock and out of stock counts
 */
export async function getStockAlertCounts(): Promise<InventoryActionResult<{
  lowStock: number;
  outOfStock: number;
}>> {
  try {
    const [lowStock, outOfStock] = await Promise.all([
      prisma.product.count({
        where: {
          status: "ACTIVE",
          currentStock: {
            gt: 0,
            lte: prisma.product.fields.reorderLevel,
          },
        },
      }),
      prisma.product.count({
        where: {
          status: "ACTIVE",
          currentStock: 0,
        },
      }),
    ]);

    return {
      success: true,
      data: { lowStock, outOfStock },
    };
  } catch (error) {
    console.error("Error fetching stock alert counts:", error);
    return { success: false, error: "Failed to fetch stock alert counts" };
  }
}

/**
 * Process shipment delivery - creates stock movements and updates product stock
 * This is called when a shipment status changes to "delivered"
 */
export async function processShipmentDelivery(
  shipmentId: string,
  userId?: string
): Promise<InventoryActionResult<{
  productsUpdated: number;
  totalUnitsReceived: number;
  totalValueAdded: number;
  landedCosts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    landedCost: number;
    totalValue: number;
  }>;
}>> {
  try {
    // Get shipment with all related data
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        purchaseOrder: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }

    if (shipment.status !== "delivered") {
      return { success: false, error: "Shipment must be marked as delivered first" };
    }

    const poItems = shipment.purchaseOrder.items;
    if (poItems.length === 0) {
      return { success: false, error: "No items in purchase order" };
    }

    // Calculate landed costs for each product
    const landedCosts = calculateLandedCosts(
      poItems,
      shipment.shippingCost,
      shipment.customsDuty || new Prisma.Decimal(0),
      shipment.otherFees || new Prisma.Decimal(0)
    );

    let totalUnitsReceived = 0;
    let totalValueAdded = 0;

    // Prepare stock movements
    const stockMovements = landedCosts.map((lc) => {
      const item = poItems.find((i) => i.productId === lc.productId)!;
      const quantityToReceive = item.quantity - item.receivedQty;

      totalUnitsReceived += quantityToReceive;
      totalValueAdded += lc.landedCost * quantityToReceive;

      return {
        productId: lc.productId,
        quantity: quantityToReceive,
        landedCost: lc.landedCost,
        unitCost: Number(item.unitCost),
        referenceType: "Shipment",
        referenceId: shipmentId,
      };
    });

    // Create bulk stock movements
    const movementResult = await createBulkStockMovements(
      stockMovements,
      userId
    );

    if (!movementResult.success) {
      return { success: false, error: movementResult.error };
    }

    // Update receivedQty in PO items
    await Promise.all(
      poItems.map((item) =>
        prisma.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: item.quantity },
        })
      )
    );

    // Revalidate paths
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/shipments");
    revalidatePath("/dashboard/purchase-orders");
    revalidatePath(`/dashboard/shipments/${shipmentId}`);

    return {
      success: true,
      data: {
        productsUpdated: stockMovements.length,
        totalUnitsReceived,
        totalValueAdded,
        landedCosts: landedCosts.map((lc) => {
          const item = poItems.find((i) => i.productId === lc.productId)!;
          const quantity = item.quantity - item.receivedQty;
          return {
            productId: lc.productId,
            productName: item.product.name,
            quantity,
            landedCost: lc.landedCost,
            totalValue: lc.landedCost * quantity,
          };
        }),
      },
    };
  } catch (error) {
    console.error("Error processing shipment delivery:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to process shipment delivery" };
  }
}

/**
 * Calculate landed costs for products in a shipment
 * Uses weight-based allocation by default, falls back to equal distribution
 */
function calculateLandedCosts(
  poItems: Array<{
    productId: string;
    quantity: number;
    unitCost: Prisma.Decimal;
    product: {
      id: string;
      name: string;
      weightKg: Prisma.Decimal | null;
    };
  }>,
  shippingCost: Prisma.Decimal,
  customsDuty: Prisma.Decimal,
  otherFees: Prisma.Decimal
): Array<{
  productId: string;
  landedCost: number;
}> {
  const shippingCostNum = Number(shippingCost);
  const customsDutyNum = Number(customsDuty);
  const otherFeesNum = Number(otherFees);

  // Calculate total product costs
  const productData = poItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitCost: Number(item.unitCost),
    weight: item.product.weightKg ? Number(item.product.weightKg) : null,
    productCost: Number(item.unitCost) * item.quantity,
  }));

  // Try weight-based allocation first
  const productsWithWeight = productData.filter((p) => p.weight !== null);
  const totalWeight = productsWithWeight.reduce((sum, p) => sum + (p.weight! * p.quantity), 0);

  const useWeightAllocation = productsWithWeight.length === poItems.length && totalWeight > 0;

  return poItems.map((item) => {
    const productInfo = productData.find((p) => p.productId === item.productId)!;
    const productTotal = productInfo.productCost;

    let allocatedShipping = 0;
    let allocatedCustoms = 0;
    let allocatedFees = 0;

    if (useWeightAllocation && productInfo.weight) {
      // Weight-based allocation
      const productWeight = productInfo.weight * productInfo.quantity;
      const weightRatio = productWeight / totalWeight;

      allocatedShipping = shippingCostNum * weightRatio;
      allocatedCustoms = customsDutyNum * weightRatio;
      allocatedFees = otherFeesNum * weightRatio;
    } else if (productTotal > 0) {
      // Value-based allocation (fallback)
      const totalProductValue = productData.reduce((sum, p) => sum + p.productCost, 0);
      const valueRatio = productTotal / totalProductValue;

      allocatedShipping = shippingCostNum * valueRatio;
      allocatedCustoms = customsDutyNum * valueRatio;
      allocatedFees = otherFeesNum * valueRatio;
    } else {
      // Equal distribution (last resort)
      const itemCount = poItems.length;
      allocatedShipping = shippingCostNum / itemCount;
      allocatedCustoms = customsDutyNum / itemCount;
      allocatedFees = otherFeesNum / itemCount;
    }

    // Calculate landed cost per unit
    const totalAdditionalCost = allocatedShipping + allocatedCustoms + allocatedFees;
    const landedCost = (productTotal + totalAdditionalCost) / productInfo.quantity;

    return {
      productId: item.productId,
      landedCost: Math.round(landedCost * 100) / 100, // Round to 2 decimal places
    };
  });
}

/**
 * Get inventory stats for dashboard
 */
export async function getInventoryStats(): Promise<InventoryActionResult<{
  totalProducts: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockUnits: number;
}>> {
  try {
    const [totalProducts, inventoryValue, lowStock, outOfStock] = await Promise.all([
      prisma.product.count({ where: { status: "ACTIVE" } }),
      (async () => {
        const products = await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            landedCost: { not: null },
          },
          select: {
            currentStock: true,
            landedCost: true,
          },
        });

        return products.reduce(
          (sum, p) => sum + Number(p.landedCost!) * p.currentStock,
          0
        );
      })(),
      prisma.product.count({
        where: {
          status: "ACTIVE",
          currentStock: {
            gt: 0,
            lte: prisma.product.fields.reorderLevel,
          },
        },
      }),
      prisma.product.count({
        where: {
          status: "ACTIVE",
          currentStock: 0,
        },
      }),
    ]);

    const totalStockUnits = await prisma.product.aggregate({
      where: { status: "ACTIVE" },
      _sum: { currentStock: true },
    });

    return {
      success: true,
      data: {
        totalProducts,
        totalInventoryValue: Math.round(inventoryValue * 100) / 100,
        lowStockCount: lowStock,
        outOfStockCount: outOfStock,
        totalStockUnits: totalStockUnits._sum.currentStock || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching inventory stats:", error);
    return { success: false, error: "Failed to fetch inventory stats" };
  }
}

/**
 * Get stock movement trend data for charts
 */
export async function getStockMovementTrend(
  days: number = 30
): Promise<InventoryActionResult<Array<{
  date: string;
  in: number;
  out: number;
  net: number;
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
    const result: Array<{ date: string; in: number; out: number; net: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const dateKey = date.toISOString().split("T")[0];

      const data = trendByDate[dateKey] || { in: 0, out: 0 };
      result.push({
        date: dateKey,
        in: data.in,
        out: data.out,
        net: data.in - data.out,
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching stock movement trend:", error);
    return { success: false, error: "Failed to fetch stock movement trend" };
  }
}

/**
 * Get all products for CSV export
 */
export async function getInventoryExportData(filters?: {
  supplierId?: string;
}): Promise<InventoryActionResult<Array<{
  sku: string;
  name: string;
  supplier: string;
  category: string | null;
  stock: number;
  reorderLevel: number;
  landedCost: number | null;
  totalValue: number;
}>>> {
  try {
    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
    };

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        sku: true,
        name: true,
        supplier: {
          select: {
            companyName: true,
          },
        },
        category: true,
        currentStock: true,
        reorderLevel: true,
        landedCost: true,
      },
      orderBy: { name: "asc" },
    });

    const data = products.map((product) => ({
      sku: product.sku,
      name: product.name,
      supplier: product.supplier.companyName,
      category: product.category,
      stock: product.currentStock,
      reorderLevel: product.reorderLevel,
      landedCost: product.landedCost ? Number(product.landedCost) : null,
      totalValue: product.landedCost
        ? Number(product.landedCost) * product.currentStock
        : 0,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching inventory export data:", error);
    return { success: false, error: "Failed to fetch inventory export data" };
  }
}
