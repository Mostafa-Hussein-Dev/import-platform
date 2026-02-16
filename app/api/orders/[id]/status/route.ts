import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib";
import { revalidatePath } from "next/cache";
import { isValidStatusTransition } from "@/lib/validations/order";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { status, userId } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    // Get current order with items and products
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate status transition
    if (!isValidStatusTransition(order.status as any, status as any)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot change status from ${order.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // If confirming order, check stock availability
    if (status === "confirmed") {
      for (const item of order.items) {
        if (item.product.currentStock < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for ${item.product.name}. Only ${item.product.currentStock} units available.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Update order in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
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
                  landedCost: true,
                  currentStock: true,
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
              referenceId: orderId,
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
              referenceId: orderId,
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

    // Serialize the order data
    const serializedOrder = {
      ...updatedOrder,
      subtotal: Number(updatedOrder.subtotal),
      shippingFee: Number(updatedOrder.shippingFee),
      discount: updatedOrder.discount ? Number(updatedOrder.discount) : 0,
      total: Number(updatedOrder.total),
      paidAmount: Number(updatedOrder.paidAmount),
      items: updatedOrder.items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        product: {
          ...item.product,
          currentStock: Number(item.product.currentStock),
          landedCost: item.product.landedCost ? Number(item.product.landedCost) : null,
        },
      })),
    };

    // Revalidate paths
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/analytics");

    return NextResponse.json({ success: true, data: serializedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update order status" },
      { status: 500 }
    );
  }
}
