"use server";

import { prisma } from "@/lib";
import { revalidatePath } from "next/cache";
import {
  stockMovementSchema,
  stockAdjustmentSchema,
  stockMovementFilterSchema,
  type StockMovementInput,
  type StockAdjustmentInput,
  type StockMovementFilterData,
} from "@/lib/validations/stock-movement";
import type { Prisma } from "@prisma/client";

export type StockMovementActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get stock movements with pagination and filtering
 */
export async function getStockMovements(
  filters?: StockMovementFilterData
): Promise<StockMovementActionResult<{
  movements: Array<{
    id: string;
    type: string;
    reason: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    landedCost: number | null;
    unitCost: number | null;
    notes: string | null;
    createdAt: Date;
    product: {
      id: string;
      name: string;
      sku: string;
      images: string[];
    };
  }>;
  total: number;
  pages: number;
}>> {
  try {
    const validatedFilters = stockMovementFilterSchema.parse(filters || {});

    const {
      search,
      productId,
      type,
      reason,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = validatedFilters;
    const pageNum = typeof page === "number" ? page : parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.StockMovementWhereInput = {};

    // Search by product name or SKU
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Filter by product
    if (productId) {
      where.productId = productId;
    }

    // Filter by type
    if (type !== "all") {
      where.type = type;
    }

    // Filter by reason
    if (reason) {
      where.reason = reason;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [movementsRaw, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          type: true,
          reason: true,
          quantity: true,
          stockBefore: true,
          stockAfter: true,
          landedCost: true,
          unitCost: true,
          referenceType: true,
          referenceId: true,
          notes: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
            },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    const pages = Math.ceil(total / pageSizeNum);

    // Convert Decimal to Number for serialization
    const movements = movementsRaw.map((m) => ({
      ...m,
      landedCost: m.landedCost ? Number(m.landedCost) : null,
      unitCost: m.unitCost ? Number(m.unitCost) : null,
    }));

    return { success: true, data: { movements, total, pages } };
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return { success: false, error: "Failed to fetch stock movements" };
  }
}

/**
 * Get stock movements for a specific product
 */
export async function getProductStockMovements(
  productId: string,
  limit: number = 10
): Promise<StockMovementActionResult<Array<{
  id: string;
  type: string;
  reason: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  landedCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date;
}>>> {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal to Number for serialization
    const serializedMovements = movements.map((m) => ({
      ...m,
      landedCost: m.landedCost ? Number(m.landedCost) : null,
      unitCost: m.unitCost ? Number(m.unitCost) : null,
    }));

    return { success: true, data: serializedMovements };
  } catch (error) {
    console.error("Error fetching product stock movements:", error);
    return { success: false, error: "Failed to fetch stock movements" };
  }
}

/**
 * Create a single stock movement
 */
export async function createStockMovement(
  data: StockMovementInput & { createdBy?: string }
): Promise<StockMovementActionResult<{ id: string; stockAfter: number }>> {
  try {
    const validatedData = stockMovementSchema.parse(data);

    // Get current stock
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      select: { currentStock: true, name: true },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const stockBefore = product.currentStock;
    const stockAfter = stockBefore + validatedData.quantity;

    // Validate stock won't go negative
    if (stockAfter < 0) {
      return {
        success: false,
        error: `Insufficient stock. Current stock: ${stockBefore}, attempting to remove: ${Math.abs(validatedData.quantity)}`,
      };
    }

    // Create movement and update product in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId: validatedData.productId,
          type: validatedData.type,
          reason: validatedData.reason,
          quantity: validatedData.quantity,
          stockBefore,
          stockAfter,
          referenceType: validatedData.referenceType,
          referenceId: validatedData.referenceId,
          landedCost: validatedData.landedCost,
          unitCost: validatedData.unitCost,
          notes: validatedData.notes,
          createdBy: data.createdBy,
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: validatedData.productId },
        data: { currentStock: stockAfter },
      });

      return movement;
    });

    // Revalidate paths
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${validatedData.productId}`);

    return {
      success: true,
      data: { id: result.id, stockAfter },
    };
  } catch (error) {
    console.error("Error creating stock movement:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create stock movement" };
  }
}

/**
 * Create bulk stock movements (for shipment delivery)
 */
export async function createBulkStockMovements(
  movements: Array<{
    productId: string;
    quantity: number;
    landedCost: number;
    unitCost: number;
    referenceType: string;
    referenceId: string;
  }>,
  createdBy?: string
): Promise<StockMovementActionResult<{ count: number; productsUpdated: string[] }>> {
  try {
    const productsUpdated: string[] = [];

    // Process all movements in a transaction
    await prisma.$transaction(async (tx) => {
      for (const movement of movements) {
        // Get current stock and landed cost
        const product = await tx.product.findUnique({
          where: { id: movement.productId },
          select: { currentStock: true, landedCost: true },
        });

        if (!product) {
          throw new Error(`Product ${movement.productId} not found`);
        }

        const stockBefore = product.currentStock;
        const stockAfter = stockBefore + movement.quantity;
        const oldLandedCost = product.landedCost ? Number(product.landedCost) : movement.landedCost; // Use new cost if this is first stock
        const newLandedCost = movement.landedCost;

        // Calculate weighted average cost
        // Formula: ((Old Quantity × Old Cost) + (New Quantity × New Cost)) / Total Quantity
        const weightedAverageCost = (
          (stockBefore * oldLandedCost) + (movement.quantity * newLandedCost)
        ) / stockAfter;

        // Round to 2 decimal places
        const roundedLandedCost = Math.round(weightedAverageCost * 100) / 100;

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: movement.productId,
            type: "in",
            reason: "shipment_received",
            quantity: movement.quantity,
            stockBefore,
            stockAfter,
            referenceType: movement.referenceType,
            referenceId: movement.referenceId,
            landedCost: movement.landedCost,
            unitCost: movement.unitCost,
            createdBy,
          },
        });

        // Update product stock and landed cost (using weighted average)
        await tx.product.update({
          where: { id: movement.productId },
          data: {
            currentStock: stockAfter,
            landedCost: roundedLandedCost,
          },
        });

        productsUpdated.push(movement.productId);
      }
    });

    // Revalidate paths
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/products");
    productsUpdated.forEach((id) => {
      revalidatePath(`/dashboard/products/${id}`);
    });

    return {
      success: true,
      data: { count: movements.length, productsUpdated },
    };
  } catch (error) {
    console.error("Error creating bulk stock movements:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to process stock movements" };
  }
}

/**
 * Manual stock adjustment
 */
export async function adjustStock(
  data: StockAdjustmentInput & { createdBy?: string }
): Promise<StockMovementActionResult<{ stockAfter: number }>> {
  try {
    const validatedData = stockAdjustmentSchema.parse(data);

    // Get current stock
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      select: { currentStock: true, name: true },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const stockBefore = product.currentStock;
    const stockAfter = stockBefore + validatedData.quantity;

    // Validate stock won't go negative
    if (stockAfter < 0) {
      return {
        success: false,
        error: `Cannot reduce stock below zero. Current stock: ${stockBefore}, attempting to remove: ${Math.abs(validatedData.quantity)}`,
      };
    }

    // Determine movement type based on quantity
    const type = validatedData.quantity > 0 ? "in" : "out";

    // Create movement and update product in transaction
    await prisma.$transaction(async (tx) => {
      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: validatedData.productId,
          type,
          reason: validatedData.reason,
          quantity: validatedData.quantity,
          stockBefore,
          stockAfter,
          referenceType: "Manual",
          notes: validatedData.notes,
          createdBy: data.createdBy,
        },
      });

      // Update product stock
      await tx.product.update({
        where: { id: validatedData.productId },
        data: { currentStock: stockAfter },
      });
    });

    // Revalidate paths
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${validatedData.productId}`);

    return {
      success: true,
      data: { stockAfter },
    };
  } catch (error) {
    console.error("Error adjusting stock:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to adjust stock" };
  }
}

/**
 * Get stock history for analytics
 */
export async function getStockHistory(
  startDate?: Date,
  endDate?: Date
): Promise<StockMovementActionResult<{
  totalIn: number;
  totalOut: number;
  netChange: number;
  totalAdjustments: number;
  byType: Record<string, number>;
  byReason: Record<string, number>;
}>> {
  try {
    const where: Prisma.StockMovementWhereInput = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      select: {
        type: true,
        reason: true,
        quantity: true,
      },
    });

    const totalIn = movements
      .filter((m) => m.type === "in")
      .reduce((sum, m) => sum + m.quantity, 0);

    const totalOut = Math.abs(
      movements
        .filter((m) => m.type === "out")
        .reduce((sum, m) => sum + m.quantity, 0)
    );

    const totalAdjustments = movements.filter(
      (m) => m.type === "adjustment"
    ).length;

    const byType: Record<string, number> = {};
    const byReason: Record<string, number> = {};

    movements.forEach((m) => {
      byType[m.type] = (byType[m.type] || 0) + Math.abs(m.quantity);
      byReason[m.reason] = (byReason[m.reason] || 0) + Math.abs(m.quantity);
    });

    return {
      success: true,
      data: {
        totalIn,
        totalOut,
        netChange: totalIn - totalOut,
        totalAdjustments,
        byType,
        byReason,
      },
    };
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return { success: false, error: "Failed to fetch stock history" };
  }
}

/**
 * Get recent stock movements across all products
 */
export async function getRecentStockMovements(
  limit: number = 5
): Promise<StockMovementActionResult<Array<{
  id: string;
  type: string;
  reason: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  landedCost: number | null;
  unitCost: number | null;
  notes: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    sku: string;
    images: string[];
  };
}>>> {
  try {
    const movementsRaw = await prisma.stockMovement.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
          },
        },
      },
    });

    // Convert Decimal to Number for serialization
    const movements = movementsRaw.map((m) => ({
      ...m,
      landedCost: m.landedCost ? Number(m.landedCost) : null,
      unitCost: m.unitCost ? Number(m.unitCost) : null,
    }));

    return { success: true, data: movements };
  } catch (error) {
    console.error("Error fetching recent stock movements:", error);
    return { success: false, error: "Failed to fetch recent movements" };
  }
}

/**
 * Delete a stock movement (admin only - use with caution)
 */
export async function deleteStockMovement(
  id: string
): Promise<StockMovementActionResult> {
  try {
    const movement = await prisma.stockMovement.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!movement) {
      return { success: false, error: "Stock movement not found" };
    }

    // Reverse the stock change
    const reversedStock = movement.product.currentStock - movement.quantity;

    if (reversedStock < 0) {
      return {
        success: false,
        error: "Cannot delete movement: would result in negative stock",
      };
    }

    await prisma.$transaction(async (tx) => {
      // Delete the movement
      await tx.stockMovement.delete({
        where: { id },
      });

      // Update product stock
      await tx.product.update({
        where: { id: movement.productId },
        data: { currentStock: reversedStock },
      });
    });

    // Revalidate paths
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${movement.productId}`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting stock movement:", error);
    return { success: false, error: "Failed to delete stock movement" };
  }
}
