"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession, requireValidUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { purchaseOrderFormSchema, purchaseOrderFilterSchema, updatePurchaseOrderStatusSchema, recordPaymentSchema } from "@/lib/validations/purchase-order";
import type { PurchaseOrderFormData, PurchaseOrderFilterData, RecordPaymentData } from "@/lib/validations/purchase-order";
import type { Prisma } from "@prisma/client";

export type PurchaseOrderActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Helper: Generate PO number
async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}`;

  // Find the latest PO number for this year
  const latestPO = await prisma.purchaseOrder.findFirst({
    where: {
      poNumber: { startsWith: prefix },
    },
    orderBy: { poNumber: "desc" },
    select: { poNumber: true },
  });

  if (!latestPO) {
    return `${prefix}-001`;
  }

  // Extract the numeric part and increment
  const numericPart = parseInt(latestPO.poNumber.split("-")[2]);
  const nextNumber = String(numericPart + 1).padStart(3, "0");

  return `${prefix}-${nextNumber}`;
}

export async function getPurchaseOrders(filters?: PurchaseOrderFilterData): Promise<PurchaseOrderActionResult<{
  purchaseOrders: Array<{
    id: string;
    poNumber: string;
    orderDate: Date;
    supplier: { id: string; companyName: string };
    itemsCount: number;
    totalCost: number;
    status: string;
    paymentStatus: string;
    paidAmount: number;
    shipmentId: string | null;
    createdAt: Date;
  }>;
  total: number;
  pages: number;
}>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedFilters = purchaseOrderFilterSchema.parse(filters || {});

    const { search, supplierId, status, paymentStatus, dateFrom, dateTo, page, pageSize, sortBy, sortOrder } = validatedFilters;
    const pageNum = typeof page === "string" ? parseInt(page) : page;
    const pageSizeNum = typeof pageSize === "string" ? parseInt(pageSize) : parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.PurchaseOrderWhereInput = {};

    if (search) {
      where.poNumber = { contains: search, mode: "insensitive" };
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status !== "all") {
      where.status = status;
    }

    if (paymentStatus !== "all") {
      where.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) where.orderDate.gte = dateFrom;
      if (dateTo) where.orderDate.lte = dateTo;
    }

    const [purchaseOrdersRaw, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: { select: { id: true, companyName: true } },
          _count: { select: { items: true } },
          shipment: { select: { id: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    const pages = Math.ceil(total / pageSizeNum);

    const purchaseOrders = purchaseOrdersRaw.map(po => ({
      id: po.id,
      poNumber: po.poNumber,
      orderDate: po.orderDate,
      supplier: po.supplier,
      itemsCount: po._count.items,
      totalCost: Number(po.totalCost),
      status: po.status,
      paymentStatus: po.paymentStatus,
      paidAmount: Number(po.paidAmount),
      shipmentId: po.shipment?.id || null,
      createdAt: po.createdAt,
    }));

    return { success: true, data: { purchaseOrders, total, pages } };
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return { success: false, error: "Failed to fetch purchase orders" };
  }
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrderActionResult<{
  id: string;
  poNumber: string;
  supplier: { id: string; companyName: string; country: string };
  orderDate: Date;
  expectedDate: Date | null;
  status: string;
  paymentStatus: string;
  paidAmount: number;
  subtotal: number;
  shippingEstimate: number | null;
  totalCost: number;
  notes: string | null;
  items: Array<{
    id: string;
    product: { id: string; name: string; sku: string; images: string[] };
    quantity: number;
    unitCost: number;
    totalCost: number;
    receivedQty: number;
  }>;
  shipment: {
    id: string;
    shipmentNumber: string;
    status: string;
    shippingCompany: { id: string; name: string };
  } | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, companyName: true, country: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, images: true } },
          },
        },
        shipment: {
          include: {
            shippingCompany: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!po) {
      return { success: false, error: "Purchase order not found" };
    }

    return {
      success: true,
      data: {
        id: po.id,
        poNumber: po.poNumber,
        supplier: po.supplier,
        orderDate: po.orderDate,
        expectedDate: po.expectedDate,
        status: po.status,
        paymentStatus: po.paymentStatus,
        paidAmount: Number(po.paidAmount),
        subtotal: Number(po.subtotal),
        shippingEstimate: po.shippingEstimate ? Number(po.shippingEstimate) : null,
        totalCost: Number(po.totalCost),
        notes: po.notes,
        items: po.items.map(item => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
          receivedQty: item.receivedQty,
        })),
        shipment: po.shipment ? {
          id: po.shipment.id,
          shipmentNumber: po.shipment.shipmentNumber,
          status: po.shipment.status,
          shippingCompany: po.shipment.shippingCompany,
        } : null,
        createdBy: po.createdBy,
        createdAt: po.createdAt,
        updatedAt: po.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return { success: false, error: "Failed to fetch purchase order" };
  }
}

export async function createPurchaseOrder(data: PurchaseOrderFormData): Promise<PurchaseOrderActionResult<{ id: string; poNumber: string }>> {
  try {
    const session = await getServerSession();
    const user = await requireValidUser(session);

    if (!user) {
      return { success: false, error: "User not found. Please sign out and sign in again." };
    }

    const validatedData = purchaseOrderFormSchema.parse(data);

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: validatedData.supplierId },
    });

    if (!supplier) {
      return { success: false, error: "Supplier not found" };
    }

    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitCost);
    }, 0);

    const shippingEstimate = validatedData.shippingEstimate || 0;
    const totalCost = subtotal + shippingEstimate;

    // Generate PO number
    const poNumber = await generatePONumber();

    // Create purchase order with items
    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: validatedData.supplierId,
        expectedDate: validatedData.expectedDate,
        shippingEstimate: validatedData.shippingEstimate,
        subtotal,
        totalCost,
        notes: validatedData.notes,
        createdBy: user.id,
        items: {
          create: validatedData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost,
          })),
        },
      },
    });

    revalidatePath("/dashboard/purchase-orders");

    return { success: true, data: { id: po.id, poNumber: po.poNumber } };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return { success: false, error: "Invalid supplier or product selected" };
    }
    return { success: false, error: "Failed to create purchase order" };
  }
}

export async function updatePurchaseOrder(
  id: string,
  data: Partial<PurchaseOrderFormData>
): Promise<PurchaseOrderActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Purchase order not found" };
    }

    if (existing.status === "received") {
      return { success: false, error: "Cannot update a received purchase order" };
    }

    if (existing.status !== "draft") {
      return { success: false, error: "Can only update draft purchase orders" };
    }

    const updates: any = {};

    if (data.supplierId !== undefined) updates.supplierId = data.supplierId;
    if (data.expectedDate !== undefined) updates.expectedDate = data.expectedDate;
    if (data.shippingEstimate !== undefined) updates.shippingEstimate = data.shippingEstimate ? Number(data.shippingEstimate) : null;
    if (data.notes !== undefined) updates.notes = data.notes;

    // If items are provided, recalculate
    if (data.items) {
      const subtotal = data.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitCost);
      }, 0);

      const shippingEstimate = data.shippingEstimate !== undefined ? data.shippingEstimate : existing.shippingEstimate;
      const totalCost = subtotal + (shippingEstimate ? Number(shippingEstimate) : 0);

      updates.subtotal = subtotal;
      updates.totalCost = totalCost;

      // Delete existing items and create new ones
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });

      await prisma.purchaseOrder.update({
        where: { id },
        data: {
          ...updates,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.quantity * item.unitCost,
            })),
          },
        },
      });
    } else {
      await prisma.purchaseOrder.update({
        where: { id },
        data: updates,
      });
    }

    revalidatePath("/dashboard/purchase-orders");
    revalidatePath(`/dashboard/purchase-orders/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return { success: false, error: "Failed to update purchase order" };
  }
}

export async function deletePurchaseOrder(id: string): Promise<PurchaseOrderActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) {
      return { success: false, error: "Purchase order not found" };
    }

    if (po.status !== "draft") {
      return { success: false, error: "Can only delete draft purchase orders" };
    }

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    revalidatePath("/dashboard/purchase-orders");

    return { success: true };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, error: "Failed to delete purchase order" };
  }
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: string
): Promise<PurchaseOrderActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { shipment: true },
    });

    if (!po) {
      return { success: false, error: "Purchase order not found" };
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["sent"],
      sent: ["confirmed", "draft"],
      confirmed: ["producing", "sent"],
      producing: ["shipped", "confirmed"],
      shipped: ["received"],
      received: [], // Cannot change from received
    };

    if (!validTransitions[po.status]?.includes(status)) {
      return { success: false, error: `Cannot change status from ${po.status} to ${status}` };
    }

    // Special check for "shipped" status
    if (status === "shipped" && !po.shipment) {
      return { success: false, error: "Cannot mark as shipped without a shipment" };
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/dashboard/purchase-orders");
    revalidatePath(`/dashboard/purchase-orders/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    return { success: false, error: "Failed to update purchase order status" };
  }
}

export async function recordPayment(
  id: string,
  data: RecordPaymentData
): Promise<PurchaseOrderActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) {
      return { success: false, error: "Purchase order not found" };
    }

    const validatedData = recordPaymentSchema.parse(data);

    const newPaidAmount = Number(po.paidAmount) + validatedData.amount;

    if (newPaidAmount > Number(po.totalCost)) {
      return { success: false, error: "Payment amount exceeds total cost" };
    }

    let paymentStatus: string = po.paymentStatus;
    if (newPaidAmount >= Number(po.totalCost)) {
      paymentStatus = "paid";
    } else if (newPaidAmount > 0) {
      paymentStatus = "partial";
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
      },
    });

    revalidatePath("/dashboard/purchase-orders");
    revalidatePath(`/dashboard/purchase-orders/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

export async function getPurchaseOrderCount(filters?: { status?: string }): Promise<PurchaseOrderActionResult<number>> {
  try {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const count = await prisma.purchaseOrder.count({ where });
    return { success: true, data: count };
  } catch (error) {
    console.error("Error getting purchase order count:", error);
    return { success: false, error: "Failed to get purchase order count" };
  }
}

export async function getRecentPurchaseOrders(limit: number = 5): Promise<PurchaseOrderActionResult<Array<{
  id: string;
  poNumber: string;
  supplier: { companyName: string };
  orderDate: Date;
  totalCost: number;
  status: string;
}>>> {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      take: limit,
      orderBy: { orderDate: "desc" },
      include: {
        supplier: { select: { companyName: true } },
      },
    });

    const data = orders.map(order => ({
      id: order.id,
      poNumber: order.poNumber,
      supplier: { companyName: order.supplier.companyName },
      orderDate: order.orderDate,
      totalCost: Number(order.totalCost),
      status: order.status,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error getting recent purchase orders:", error);
    return { success: false, error: "Failed to get recent purchase orders" };
  }
}

export async function getTotalPurchaseOrderValue(filters?: { dateFrom?: Date; dateTo?: Date }): Promise<PurchaseOrderActionResult<number>> {
  try {
    const where: any = {};
    if (filters?.dateFrom || filters?.dateTo) {
      where.orderDate = {};
      if (filters.dateFrom) where.orderDate.gte = filters.dateFrom;
      if (filters.dateTo) where.orderDate.lte = filters.dateTo;
    }

    const result = await prisma.purchaseOrder.aggregate({
      where,
      _sum: { totalCost: true },
    });

    return { success: true, data: Number(result._sum.totalCost || 0) };
  } catch (error) {
    console.error("Error getting total PO value:", error);
    return { success: false, error: "Failed to get total PO value" };
  }
}
