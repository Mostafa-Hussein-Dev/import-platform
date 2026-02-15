"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession, requireValidUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { shipmentFormSchema, shipmentFilterSchema, recordShipmentPaymentSchema } from "@/lib/validations/shipment";
import type { RecordShipmentPaymentData } from "@/lib/validations/shipment";
import { processShipmentDelivery } from "@/lib/actions/inventory";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

export type ShipmentActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function calculateShippingCost(params: {
  shippingCompanyId: string;
  method: string;
  totalWeight?: number;
  totalVolume?: number;
}): Promise<ShipmentActionResult<{ cost: number; breakdown: string }>> {
  try {
    const company = await prisma.shippingCompany.findUnique({
      where: { id: params.shippingCompanyId },
    });

    if (!company) {
      return { success: false, error: "Shipping company not found" };
    }

    let cost = 0;
    const breakdown: string[] = [];

    if (params.method === "sea") {
      if (params.totalVolume && company.ratePerCBM) {
        const calculated = params.totalVolume * Number(company.ratePerCBM);
        cost = calculated;
        breakdown.push(`${params.totalVolume} CBM × $${Number(company.ratePerCBM)}/CBM = $${calculated.toFixed(2)}`);
      }
    } else {
      if (params.totalWeight && company.ratePerKg) {
        const calculated = params.totalWeight * Number(company.ratePerKg);
        cost = calculated;
        breakdown.push(`${params.totalWeight} kg × $${Number(company.ratePerKg)}/kg = $${calculated.toFixed(2)}`);
      }
    }

    if (company.minCharge && cost < Number(company.minCharge)) {
      breakdown.push(`Minimum charge applied: $${Number(company.minCharge)}`);
      cost = Number(company.minCharge);
    }

    if (breakdown.length === 0) {
      return { success: false, error: "Could not calculate shipping cost. Please enter manually." };
    }

    return { success: true, data: { cost, breakdown: breakdown.join("\n") } };
  } catch (error) {
    console.error("Error calculating shipping cost:", error);
    return { success: false, error: "Failed to calculate shipping cost" };
  }
}

export async function getShipments(filters?: any): Promise<ShipmentActionResult<{
  shipments: Array<{
    id: string;
    shipmentNumber: string;
    purchaseOrder: { id: string; poNumber: string; supplier: { id: string; companyName: string } };
    shippingCompany: { id: string; name: string };
    method: string;
    departureDate: Date | null;
    estimatedArrival: Date | null;
    status: string;
    totalCost: number;
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

    const validatedFilters = shipmentFilterSchema.parse(filters || {});
    const { search, shippingCompanyId, status, dateFrom, dateTo, page, pageSize, sortBy, sortOrder } = validatedFilters;
    const pageNum = typeof page === "string" ? parseInt(page) : page;
    const pageSizeNum = typeof pageSize === "string" ? parseInt(pageSize) : parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.ShipmentWhereInput = {};

    if (search) {
      where.OR = [
        { shipmentNumber: { contains: search, mode: "insensitive" } },
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (shippingCompanyId) {
      where.shippingCompanyId = shippingCompanyId;
    }

    if (status !== "all") {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.OR = [
        { departureDate: { gte: dateFrom } },
        { estimatedArrival: { lte: dateTo } },
      ];
    }

    const [shipmentsRaw, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          purchaseOrder: {
            include: {
              supplier: { select: { id: true, companyName: true } },
            },
          },
          shippingCompany: { select: { id: true, name: true } },
        },
      }),
      prisma.shipment.count({ where }),
    ]);

    const pages = Math.ceil(total / pageSizeNum);

    const shipments = shipmentsRaw.map((s) => ({
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      purchaseOrder: {
        id: s.purchaseOrderId,
        poNumber: s.purchaseOrder.poNumber,
        supplier: { id: s.purchaseOrder.supplier.id, companyName: s.purchaseOrder.supplier.companyName },
      },
      shippingCompany: { id: s.shippingCompanyId, name: s.shippingCompany.name },
      method: s.method,
      departureDate: s.departureDate,
      estimatedArrival: s.estimatedArrival,
      status: s.status,
      totalCost: Number(s.totalCost),
      createdAt: s.createdAt,
    }));

    return { success: true, data: { shipments, total, pages } };
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return { success: false, error: "Failed to fetch shipments" };
  }
}

export async function getShipment(id: string): Promise<ShipmentActionResult<{
  id: string;
    shipmentNumber: string;
    purchaseOrder: {
    id: string;
    poNumber: string;
    supplier: { id: string; companyName: string };
    items: Array<{
      id: string;
      quantity: number;
      unitCost: number;
      receivedQty: number;
      product: {
        id: string;
        name: string;
        sku: string;
        weightKg: number | null;
      };
    }>;
  };
  shippingCompany: {
    id: string;
    name: string;
  };
    method: string;
    departureDate: Date | null;
    estimatedArrival: Date | null;
    actualArrival: Date | null;
    trackingNumber: string | null;
    status: string;
    totalWeight: number | null;
    totalVolume: number | null;
    shippingCost: number;
    customsDuty: number | null;
    otherFees: number | null;
    totalCost: number;
    paymentStatus: string;
    paidAmount: number;
    notes: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: { select: { id: true, companyName: true } },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    weightKg: true,
                  },
                },
              },
            },
          },
        },
        shippingCompany: true,
      },
    });

    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }

    return {
      success: true,
      data: {
        id: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
        purchaseOrder: {
          id: shipment.purchaseOrderId,
          poNumber: shipment.purchaseOrder.poNumber,
          supplier: { id: shipment.purchaseOrder.supplier.id, companyName: shipment.purchaseOrder.supplier.companyName },
          items: shipment.purchaseOrder.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unitCost: Number(item.unitCost),
            receivedQty: item.receivedQty,
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              weightKg: item.product.weightKg ? Number(item.product.weightKg) : null,
            },
          })),
        },
        shippingCompany: {
          id: shipment.shippingCompany.id,
          name: shipment.shippingCompany.name,
        },
        method: shipment.method,
        departureDate: shipment.departureDate,
        estimatedArrival: shipment.estimatedArrival,
        actualArrival: shipment.actualArrival,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        totalWeight: shipment.totalWeight ? Number(shipment.totalWeight) : null,
        totalVolume: shipment.totalVolume ? Number(shipment.totalVolume) : null,
        shippingCost: Number(shipment.shippingCost),
        customsDuty: shipment.customsDuty ? Number(shipment.customsDuty) : null,
        otherFees: shipment.otherFees ? Number(shipment.otherFees) : null,
        totalCost: Number(shipment.totalCost),
        paymentStatus: shipment.paymentStatus,
        paidAmount: Number(shipment.paidAmount),
        notes: shipment.notes,
        createdBy: shipment.createdBy,
        createdAt: shipment.createdAt,
        updatedAt: shipment.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error fetching shipment:", error);
    return { success: false, error: "Failed to fetch shipment" };
  }
}

export async function createShipment(data: any): Promise<ShipmentActionResult<{ id: string; shipmentNumber: string }>> {
  try {
    const session = await getServerSession();
    const user = await requireValidUser(session);

    if (!user) {
      return { success: false, error: "User not found. Please sign out and sign in again." };
    }

    const validatedData = shipmentFormSchema.parse(data);

    // Verify PO exists
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: validatedData.purchaseOrderId },
    });

    if (!po) {
      return { success: false, error: "Purchase order not found" };
    }

    // Check PO status
    if (po.status !== "producing" && po.status !== "confirmed") {
      return { success: false, error: "Purchase order must be in 'producing' or 'confirmed' status" };
    }

    // Check if shipment already exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { purchaseOrderId: validatedData.purchaseOrderId },
    });

    if (existingShipment) {
      return { success: false, error: "This purchase order already has a shipment" };
    }

    // Get shipping company
    const shippingCompany = await prisma.shippingCompany.findUnique({
      where: { id: validatedData.shippingCompanyId },
    });

    if (!shippingCompany) {
      return { success: false, error: "Shipping company not found" };
    }

    // Generate shipment number
    const year = new Date().getFullYear();
    const prefix = `SHIP-${year}`;

    const latestShipment = await prisma.shipment.findFirst({
      where: {
        shipmentNumber: { startsWith: prefix },
      },
      orderBy: { shipmentNumber: "desc" },
    });

    const numericPart = latestShipment
      ? parseInt(latestShipment.shipmentNumber.split("-")[2])
      : 0;
    const nextNumber = String(numericPart + 1).padStart(3, "0");
    const shipmentNumber = `${prefix}-${nextNumber}`;

    // Calculate total cost
    let totalCost = 0;
    if (validatedData.shippingCost !== undefined) {
      totalCost += Number(validatedData.shippingCost);
    }
    if (validatedData.customsDuty !== undefined) {
      totalCost += Number(validatedData.customsDuty);
    }
    if (validatedData.otherFees !== undefined) {
      totalCost += Number(validatedData.otherFees);
    }

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        purchaseOrderId: validatedData.purchaseOrderId,
        shippingCompanyId: validatedData.shippingCompanyId,
        method: validatedData.method,
        departureDate: validatedData.departureDate ? new Date(validatedData.departureDate) : null,
        estimatedArrival: validatedData.estimatedArrival ? new Date(validatedData.estimatedArrival) : null,
        trackingNumber: validatedData.trackingNumber || null,
        totalWeight: validatedData.totalWeight ? Number(validatedData.totalWeight) : null,
        totalVolume: validatedData.totalVolume ? Number(validatedData.totalVolume) : null,
        shippingCost: Number(validatedData.shippingCost),
        customsDuty: validatedData.customsDuty ? Number(validatedData.customsDuty) : null,
        otherFees: validatedData.otherFees ? Number(validatedData.otherFees) : null,
        totalCost,
        notes: validatedData.notes || null,
        createdBy: user.id,
      },
    });

    // Update PO status to shipped
    await prisma.purchaseOrder.update({
      where: { id: validatedData.purchaseOrderId },
      data: { status: "shipped" },
    });

    revalidatePath("/dashboard/shipments");
    revalidatePath("/dashboard/purchase-orders");

    return { success: true, data: { id: shipment.id, shipmentNumber: shipment.shipmentNumber } };
  } catch (error) {
    console.error("Error creating shipment:", error);
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return { success: false, error: "Invalid purchase order or shipping company" };
    }
    return { success: false, error: "Failed to create shipment" };
  }
}

export async function updateShipment(
  id: string,
  data: any
): Promise<ShipmentActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const existing = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Shipment not found" };
    }

    if (existing.status === "delivered") {
      return { success: false, error: "Cannot update a delivered shipment" };
    }

    const updates: any = {};

    if (data.shippingCompanyId !== undefined) {
      updates.shippingCompanyId = data.shippingCompanyId;
    }
    if (data.method !== undefined) {
      updates.method = data.method;
    }
    if (data.departureDate !== undefined) {
      updates.departureDate = data.departureDate ? new Date(data.departureDate) : null;
    }
    if (data.estimatedArrival !== undefined) {
      updates.estimatedArrival = data.estimatedArrival ? new Date(data.estimatedArrival) : null;
    }
    if (data.trackingNumber !== undefined) {
      updates.trackingNumber = data.trackingNumber || null;
    }
    if (data.totalWeight !== undefined) {
      updates.totalWeight = data.totalWeight ? Number(data.totalWeight) : null;
    }
    if (data.totalVolume !== undefined) {
      updates.totalVolume = data.totalVolume ? Number(data.totalVolume) : null;
    }

    // Recalculate total cost if cost fields changed
    if (data.shippingCost !== undefined || data.customsDuty !== undefined || data.otherFees !== undefined) {
      let newTotal = 0;

      if (data.shippingCost !== undefined) {
        newTotal += Number(data.shippingCost);
      }
      if (data.customsDuty !== undefined) {
        newTotal += Number(data.customsDuty);
      }
      if (data.otherFees !== undefined) {
        newTotal += Number(data.otherFees);
      }

      updates.totalCost = newTotal;
    }

    if (data.notes !== undefined) {
      updates.notes = data.notes;
    }

    await prisma.shipment.update({
      where: { id },
      data: updates,
    });

    revalidatePath("/dashboard/shipments");
    revalidatePath(`/dashboard/shipments/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating shipment:", error);
    return { success: false, error: "Failed to update shipment" };
  }
}

export async function updateShipmentStatus(
  id: string,
  status: string
): Promise<ShipmentActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: { select: { companyName: true } },
            },
          },
      },
    });

    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ["in_transit"],
      in_transit: ["customs"],
      customs: ["delivered"],
      delivered: [],
    };

    if (!validTransitions[shipment.status]?.includes(status)) {
      return { success: false, error: `Cannot change status from ${shipment.status} to ${status}` };
    }

    const updates: any = { status };

    // If marking as delivered, set actual arrival date
    if (status === "delivered") {
      updates.actualArrival = new Date();
    }

    await prisma.shipment.update({
      where: { id },
      data: updates,
    });

    // If marking as delivered, update PO status to received and process stock
    if (status === "delivered" && shipment?.purchaseOrder) {
      // First update the PO status
      await prisma.purchaseOrder.update({
        where: { id: shipment.purchaseOrderId },
        data: { status: "received" },
      });

      // Process stock movements and landed costs
      const stockResult = await processShipmentDelivery(id, session.user.id);
      if (!stockResult.success) {
        console.error("Failed to process shipment delivery:", stockResult.error);
        // Don't fail the status update, but log the error
      }
    }

    revalidatePath("/dashboard/shipments");
    revalidatePath("/dashboard/purchase-orders");
    revalidatePath("/dashboard/inventory");

    return { success: true };
  } catch (error) {
    console.error("Error updating shipment status:", error);
    return { success: false, error: "Failed to update shipment status" };
  }
}

export async function recordShipmentPayment(
  id: string,
  data: z.input<typeof recordShipmentPaymentSchema>
): Promise<ShipmentActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return { success: false, error: "Shipment not found" };
    }

    const validatedData = recordShipmentPaymentSchema.parse(data);

    const newPaidAmount = Number(shipment.paidAmount) + validatedData.amount;

    if (newPaidAmount > Number(shipment.totalCost)) {
      return { success: false, error: "Payment amount exceeds total cost" };
    }

    let paymentStatus: string = shipment.paymentStatus;
    if (newPaidAmount >= Number(shipment.totalCost)) {
      paymentStatus = "paid";
    } else if (newPaidAmount > 0) {
      paymentStatus = "partial";
    }

    await prisma.shipment.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
      },
    });

    revalidatePath("/dashboard/shipments");
    revalidatePath(`/dashboard/shipments/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error recording shipment payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

export async function deleteShipment(id: string): Promise<ShipmentActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return { success: false, error: "Milestone not found" };
    }

    if (shipment.status !== "pending") {
      return { success: false, error: "Can only delete pending shipments" };
    }

    // Revert PO status back to producing
    await prisma.purchaseOrder.update({
      where: { id: shipment.purchaseOrderId },
      data: { status: "producing" },
    });

    await prisma.shipment.delete({
      where: { id },
    });

    revalidatePath("/dashboard/shipments");
    revalidatePath("/dashboard/purchase-orders");

    return { success: true };
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return { success: false, error: "Failed to delete shipment" };
  }
}

export async function getShipmentCount(filters?: { status?: string }): Promise<ShipmentActionResult<number>> {
  try {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }

    const count = await prisma.shipment.count({ where });
    return { success: true, data: count };
  } catch (error) {
    console.error("Error getting shipment count:", error);
    return { success: false, error: "Failed to get shipment count" };
  }
}

type RecentShipment = {
  id: string;
  shipmentNumber: string;
  purchaseOrder: { poNumber: string; supplier: { companyName: string }; };
  shippingCompany: { id: string; name: string; };
  estimatedArrival: Date | null;
};

export async function getRecentShipments(limit: number = 5): Promise<ShipmentActionResult<RecentShipment[]>> {
  try {
    const shipments = await prisma.shipment.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        purchaseOrder: {
          include: {
            supplier: { select: { companyName: true } },
          },
        },
        shippingCompany: { select: { id: true, name: true } },
      },
    });

    const data = shipments.map((s) => ({
      id: s.id,
      shipmentNumber: s.shipmentNumber,
      purchaseOrder: {
        poNumber: s.purchaseOrder.poNumber,
        supplier: { companyName: s.purchaseOrder.supplier.companyName },
      },
      shippingCompany: s.shippingCompany,
      estimatedArrival: s.estimatedArrival,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error getting recent shipments:", error);
    return { success: false, error: "Failed to get recent shipments" };
  }
}
