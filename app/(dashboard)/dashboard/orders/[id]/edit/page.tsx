"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getOrder, updateOrder } from "@/lib/actions/orders";
import { OrderForm } from "@/components/orders/order-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const result = await getOrder(orderId);
      if (result.success && result.data) {
        if (result.data.status !== "pending") {
          setError("Only pending orders can be edited. This order has already been confirmed.");
        }
        setOrder(result.data);
      } else {
        setError(result.error || "Failed to fetch order");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setUpdating(true);
    try {
      const result = await updateOrder(orderId, data);
      if (result.success) {
        toast.success("Order updated successfully");
        router.push(`/dashboard/orders/${orderId}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Cannot Edit Order</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
            <Button onClick={() => router.push(`/dashboard/orders/${orderId}`)}>
              View Order
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  const initialData = {
    type: order.type,
    customerName: order.customerName,
    customerPhone: order.customerPhone || undefined,
    customerEmail: order.customerEmail || undefined,
    isWholesale: order.isWholesale,
    companyName: order.companyName || undefined,
    shippingAddress: order.shippingAddress || undefined,
    city: order.city || undefined,
    items: order.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      productImage: item.product.images[0] || null,
      availableStock: Number(item.product.currentStock), // Actual available stock (not deducted for pending orders)
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    shippingFee: Number(order.shippingFee),
    discount: Number(order.discount || 0),
    notes: order.notes || undefined,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
          <p className="text-muted-foreground mt-1">
            Update order {order.orderNumber}
          </p>
        </div>
      </div>

      {updating && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Updating order...</p>
          </div>
        </div>
      )}

      {!updating && (
        <OrderForm
          initialData={initialData}
          orderId={orderId}
          onSubmit={handleSubmit}
          submitLabel="Update Order"
          isEditing={true}
        />
      )}
    </div>
  );
}
