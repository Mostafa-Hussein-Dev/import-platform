"use server";

import { prisma } from "@/lib";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { orderFormSchema, orderFilterSchema, isValidStatusTransition } from "@/lib/validations/order";
import type { OrderStatus, OrderWithItems, OrderListItem } from "@/types/order";
import { Prisma } from "@prisma/client";

export type OrderActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Convert Decimal fields to numbers for client serialization
 */
function serializeOrder(order: any): any {
  return {
    ...order,
    subtotal: order.subtotal ? Number(order.subtotal) : 0,
    shippingFee: order.shippingFee ? Number(order.shippingFee) : 0,
    discount: order.discount ? Number(order.discount) : 0,
    total: order.total ? Number(order.total) : 0,
    paidAmount: order.paidAmount ? Number(order.paidAmount) : 0,
    items: order.items?.map((item: any) => ({
      ...item,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
      totalPrice: item.totalPrice ? Number(item.totalPrice) : 0,
      product: item.product ? {
        ...item.product,
        currentStock: item.product.currentStock ? Number(item.product.currentStock) : 0,
        landedCost: item.product.landedCost ? Number(item.product.landedCost) : null,
      } : null,
    })) || [],
  };
}

/**
 * Generate unique order number: ORD-YYYY-###
 */
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();

  // Find the last order number for this year
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: `ORD-${year}`,
      },
    },
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  if (lastOrder) {
    // Extract the sequence number and increment
    const lastSeq = parseInt(lastOrder.orderNumber.split("-")[2] || "0");
    const newSeq = lastSeq + 1;
    return `ORD-${year}-${newSeq.toString().padStart(3, "0")}`;
  }

  return `ORD-${year}-001`;
}

/**
 * Get all orders with filters and pagination
 */
export async function getOrders(
  filters: {
    search?: string;
    type?: string;
    status?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}
): Promise<OrderActionResult<{
  orders: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}>> {
  try {
    const {
      search,
      type = "all",
      status = "all",
      paymentStatus = "all",
      startDate,
      endDate,
      page = 1,
      pageSize = 25,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const pageSizeNum = typeof pageSize === "string" ? parseInt(pageSize) : pageSize;

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type !== "all") {
      where.type = type;
    }

    if (status !== "all") {
      where.status = status;
    }

    if (paymentStatus !== "all") {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        type: true,
        customerName: true,
        status: true,
        paymentStatus: true,
        total: true,
        createdAt: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      skip: (page - 1) * pageSizeNum,
      take: pageSizeNum,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    return {
      success: true,
      data: {
        orders: orders.map((order) => serializeOrder({
          ...order,
          itemCount: order._count.items,
        })) as OrderListItem[],
        total,
        page,
        pageSize: pageSizeNum,
      },
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { success: false, error: "Failed to fetch orders" };
  }
}

/**
 * Get single order by ID with full details
 */
export async function getOrder(id: string): Promise<OrderActionResult<OrderWithItems>> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                currentStock: true,
                landedCost: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    return { success: true, data: serializeOrder(order) as OrderWithItems };
  } catch (error) {
    console.error("Error fetching order:", error);
    return { success: false, error: "Failed to fetch order" };
  }
}

/**
 * Create a new order
 */
export async function createOrder(
  data: {
    type: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    isWholesale?: boolean;
    companyName?: string;
    shippingAddress?: string;
    city?: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    shippingFee?: number;
    discount?: number;
    notes?: string;
    status?: string;
  },
  userId?: string
): Promise<OrderActionResult<OrderWithItems>> {
  try {
    // Validate input
    const validated = orderFormSchema.parse(data);

    // Check stock availability for each item
    const products = await prisma.product.findMany({
      where: {
        id: { in: validated.items.map((item) => item.productId) },
      },
      select: {
        id: true,
        currentStock: true,
        name: true,
      },
    });

    for (const item of validated.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return { success: false, error: `Product not found` };
      }
      if (data.status === "confirmed" && product.currentStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Only ${product.currentStock} units available.`,
        };
      }
    }

    // Calculate totals
    const subtotal = validated.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const total = subtotal + (validated.shippingFee || 0) - (validated.discount || 0);

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order with items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          type: validated.type,
          customerName: validated.customerName,
          customerPhone: validated.customerPhone || null,
          customerEmail: validated.customerEmail || null,
          isWholesale: validated.isWholesale || false,
          companyName: validated.companyName || null,
          shippingAddress: validated.shippingAddress || null,
          city: validated.city || null,
          status: (data.status as any) || "pending",
          paymentStatus: "pending",
          subtotal: new Prisma.Decimal(subtotal),
          shippingFee: new Prisma.Decimal(validated.shippingFee || 0),
          discount: validated.discount ? new Prisma.Decimal(validated.discount) : new Prisma.Decimal(0),
          total: new Prisma.Decimal(total),
          paidAmount: new Prisma.Decimal(0),
          notes: validated.notes || null,
          createdBy: userId,
          items: {
            create: validated.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: true,
                  currentStock: true,
                  landedCost: true,
                },
              },
            },
          },
        },
      });

      // If status is confirmed, create stock movements
      if (order.status === "confirmed") {
        for (const item of validated.items) {
          const product = products.find((p) => p.id === item.productId)!;
          const stockBefore = product.currentStock;
          const stockAfter = stockBefore - item.quantity;

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "out",
              reason: "sale",
              quantity: -item.quantity,
              referenceType: "Order",
              referenceId: order.id,
              stockBefore,
              stockAfter,
              notes: `Order ${orderNumber}`,
              createdBy: userId,
            },
          });

          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: stockAfter },
          });
        }
      }

      return order;
    });

    // Revalidate
    revalidateTag("orders", {});
    revalidateTag("dashboard", {});
    revalidateTag("analytics", {});
    revalidatePath("/dashboard/orders");

    return { success: true, data: serializeOrder(result) as OrderWithItems };
  } catch (error) {
    console.error("Error creating order:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create order" };
  }
}

/**
 * Update an existing order
 */
export async function updateOrder(
  id: string,
  data: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    companyName?: string;
    shippingAddress?: string;
    city?: string;
    items?: Array<{ id?: string; productId: string; quantity: number; unitPrice: number }>;
    shippingFee?: number;
    discount?: number;
    notes?: string;
  },
  userId?: string
): Promise<OrderActionResult<OrderWithItems>> {
  try {
    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found" };
    }

    if (existingOrder.status === "delivered") {
      return { success: false, error: "Cannot update delivered order" };
    }

    if (existingOrder.status === "cancelled") {
      return { success: false, error: "Cannot update cancelled order" };
    }

    // If updating items and order is confirmed, we need to handle stock adjustments
    if (data.items && existingOrder.status === "confirmed") {
      return { success: false, error: "Cannot modify items of confirmed order. Cancel it first." };
    }

    // Calculate new totals if items provided
    let subtotal = Number(existingOrder.subtotal);
    let total = Number(existingOrder.total);

    if (data.items) {
      // Check stock for new items
      const products = await prisma.product.findMany({
        where: { id: { in: data.items.map((i) => i.productId) } },
        select: { id: true, currentStock: true, name: true },
      });

      for (const item of data.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          return { success: false, error: "Product not found" };
        }
        if (existingOrder.status === "pending" && product.currentStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${product.name}`,
          };
        }
      }

      subtotal = data.items.reduce((sum: number, item) => sum + item.quantity * item.unitPrice, 0);
    }

    const shippingFee = data.shippingFee !== undefined ? data.shippingFee : Number(existingOrder.shippingFee);
    const discount = data.discount !== undefined ? data.discount : Number(existingOrder.discount || 0);
    total = subtotal + shippingFee - discount;

    // Update order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order fields
      const order = await tx.order.update({
        where: { id },
        data: {
          ...(data.customerName && { customerName: data.customerName }),
          ...(data.customerPhone !== undefined && { customerPhone: data.customerPhone || null }),
          ...(data.customerEmail !== undefined && { customerEmail: data.customerEmail || null }),
          ...(data.companyName !== undefined && { companyName: data.companyName || null }),
          ...(data.shippingAddress !== undefined && { shippingAddress: data.shippingAddress || null }),
          ...(data.city !== undefined && { city: data.city || null }),
          ...(data.notes !== undefined && { notes: data.notes || null }),
          subtotal: new Prisma.Decimal(subtotal),
          shippingFee: new Prisma.Decimal(shippingFee),
          discount: new Prisma.Decimal(discount),
          total: new Prisma.Decimal(total),
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: true,
                  currentStock: true,
                  landedCost: true,
                },
              },
            },
          },
        },
      });

      // Update items if provided
      if (data.items) {
        // Delete existing items
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        // Create new items
        await tx.orderItem.createMany({
          data: data.items.map((item) => ({
            orderId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
          })),
        });

        // Fetch updated order with items
        const orderWithItems = await tx.order.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    images: true,
                    currentStock: true,
                    landedCost: true,
                  },
                },
              },
            },
          },
        });

        return orderWithItems;
      }

      return order;
    });

    revalidateTag("orders", {});
    revalidateTag("dashboard", {});
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);

    return { success: true, data: serializeOrder(updatedOrder) as OrderWithItems };
  } catch (error) {
    console.error("Error updating order:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update order" };
  }
}

/**
 * Delete an order (only pending orders)
 */
export async function deleteOrder(id: string): Promise<OrderActionResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status === "confirmed") {
      return { success: false, error: "Cannot delete confirmed order. Cancel it first." };
    }

    if (order.status === "delivered") {
      return { success: false, error: "Cannot delete delivered order" };
    }

    await prisma.order.delete({
      where: { id },
    });

    revalidateTag("orders", {});
    revalidateTag("dashboard", {});
    revalidateTag("analytics", {});
    revalidatePath("/dashboard/orders");

    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { success: false, error: "Failed to delete order" };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  reason?: string,
  userId?: string
): Promise<OrderActionResult<OrderWithItems>> {
  try {
    // Get current order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                currentStock: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Validate status transition
    if (!isValidStatusTransition(order.status as OrderStatus, status)) {
      return {
        success: false,
        error: `Cannot change status from ${order.status} to ${status}`,
      };
    }

    // If confirming order, check stock availability
    if (status === "confirmed") {
      for (const item of order.items) {
        if (item.product.currentStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${item.product.name}. Only ${item.product.currentStock} units available.`,
          };
        }
      }
    }

    // Update order in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  images: true,
                  currentStock: true,
                  landedCost: true,
                },
              },
            },
          },
        },
      });

      // Handle stock movements
      if (status === "confirmed" && order.status === "pending") {
        // Deduct stock
        for (const item of order.items) {
          const product = item.product;
          const stockBefore = product.currentStock;
          const stockAfter = stockBefore - item.quantity;

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "out",
              reason: "sale",
              quantity: -item.quantity,
              referenceType: "Order",
              referenceId: id,
              stockBefore,
              stockAfter,
              notes: `Order ${order.orderNumber}`,
              createdBy: userId,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: stockAfter },
          });
        }
      } else if (status === "cancelled" && order.status !== "pending") {
        // Reverse stock movements (add stock back)
        for (const item of order.items) {
          const product = item.product;
          const stockBefore = product.currentStock;
          const stockAfter = stockBefore + item.quantity;

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "in",
              reason: "return",
              quantity: item.quantity,
              referenceType: "Order",
              referenceId: id,
              stockBefore,
              stockAfter,
              notes: `Order ${order.orderNumber} cancelled`,
              createdBy: userId,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: stockAfter },
          });
        }
      }

      return updated;
    });

    revalidateTag("orders", {});
    revalidateTag("dashboard", {});
    revalidateTag("inventory", {});
    revalidateTag("analytics", {});
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);

    return { success: true, data: serializeOrder(updatedOrder) as OrderWithItems };
  } catch (error) {
    console.error("Error updating order status:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update order status" };
  }
}

/**
 * Record payment for an order
 */
export async function recordOrderPayment(
  id: string,
  amount: number,
  notes?: string
): Promise<OrderActionResult<OrderWithItems>> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        total: true,
        paidAmount: true,
        status: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status === "cancelled") {
      return { success: false, error: "Cannot record payment for a cancelled order" };
    }

    const currentPaid = Number(order.paidAmount);
    const total = Number(order.total);
    const newPaidAmount = currentPaid + amount;

    if (newPaidAmount > total) {
      return {
        success: false,
        error: `Payment amount exceeds order total. Balance due: $${(total - currentPaid).toFixed(2)}`,
      };
    }

    // Determine payment status
    let paymentStatus: "pending" | "partial" | "paid" = "pending";
    if (newPaidAmount >= total) {
      paymentStatus = "paid";
    } else if (newPaidAmount > 0) {
      paymentStatus = "partial";
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paidAmount: new Prisma.Decimal(newPaidAmount),
        paymentStatus,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                currentStock: true,
                landedCost: true,
              },
            },
          },
        },
      },
    });

    revalidateTag("orders", {});
    revalidateTag("dashboard", {});
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);

    return { success: true, data: serializeOrder(updatedOrder) as OrderWithItems };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

/**
 * Get order statistics for dashboard
 */
export const getOrderStats = unstable_cache(
  async (): Promise<OrderActionResult<{
    totalOrders: number;
    totalRevenue: number;
    monthOrders: number;
    monthRevenue: number;
    pendingPaymentOrders: number;
    pendingPaymentValue: number;
  }>> => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalOrders,
        totalRevenue,
        monthOrders,
        monthRevenue,
        pendingPaymentOrders,
      ] = await Promise.all([
        prisma.order.count({
          where: { status: { not: "cancelled" } },
        }),
        prisma.order.aggregate({
          where: { status: { not: "cancelled" } },
          _sum: { total: true },
        }),
        prisma.order.count({
          where: {
            status: { not: "cancelled" },
            createdAt: { gte: startOfMonth },
          },
        }),
        prisma.order.aggregate({
          where: {
            status: { not: "cancelled" },
            createdAt: { gte: startOfMonth },
          },
          _sum: { total: true },
        }),
        prisma.order.findMany({
          where: {
            status: { not: "cancelled" },
            paymentStatus: { in: ["pending", "partial"] },
          },
          select: { total: true, paidAmount: true },
        }),
      ]);

      const pendingPaymentValue = pendingPaymentOrders.reduce(
        (sum, order) => sum + Number(order.total) - Number(order.paidAmount),
        0
      );

      return {
        success: true,
        data: {
          totalOrders,
          totalRevenue: Number(totalRevenue._sum.total || 0),
          monthOrders,
          monthRevenue: Number(monthRevenue._sum.total || 0),
          pendingPaymentOrders: pendingPaymentOrders.length,
          pendingPaymentValue,
        },
      };
    } catch (error) {
      console.error("Error fetching order stats:", error);
      return { success: false, error: "Failed to fetch order stats" };
    }
  },
  ["order-stats"],
  { revalidate: 30, tags: ["orders"] }
);

/**
 * Get recent orders for dashboard
 */
export const getRecentOrders = unstable_cache(
  async (limit: number = 5): Promise<OrderActionResult<OrderListItem[]>> => {
    try {
      const orders = await prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          type: true,
          customerName: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

      return {
        success: true,
        data: orders.map((order) => serializeOrder({
          ...order,
          itemCount: order._count.items,
        })) as OrderListItem[],
      };
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      return { success: false, error: "Failed to fetch recent orders" };
    }
  },
  ["recent-orders"],
  { revalidate: 30, tags: ["orders"] }
);

/**
 * Get products for order selector
 */
export async function getProductsForOrderSelector(
  search?: string,
  category?: string,
  supplierId?: string
): Promise<OrderActionResult<Array<{
  id: string;
  name: string;
  sku: string;
  images: string[];
  currentStock: number;
  wholesalePrice: number;
  retailPrice: number;
  landedCost: number | null;
  supplier: {
    id: string;
    companyName: string;
  };
}>>> {
  try {
    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        images: true,
        currentStock: true,
        wholesalePrice: true,
        retailPrice: true,
        landedCost: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      take: 50,
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: products.map((p) => ({
        ...p,
        currentStock: Number(p.currentStock),
        wholesalePrice: Number(p.wholesalePrice),
        retailPrice: Number(p.retailPrice),
        landedCost: p.landedCost ? Number(p.landedCost) : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching products for selector:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}
