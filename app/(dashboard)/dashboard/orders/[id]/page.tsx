"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusTimeline } from "@/components/orders/status-timeline";
import { PaymentDialog } from "@/components/orders/payment-dialog";
import { getOrder } from "@/lib/actions/orders";
import { orderStatusInfo, paymentStatusInfo, orderTypeInfo, type OrderWithItems } from "@/types/order";
import { ArrowLeft, Edit, X, Check, Package, Truck, Box, CheckCircle, FileText, Loader2, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { generateInvoicePDF, downloadInvoicePDF } from "@/lib/utils/invoice";

const statusActions = {
  pending: {
    label: "Confirm Order",
    icon: Check,
    nextStatus: "confirmed",
    description: "Confirming will deduct stock. Make sure you have enough inventory.",
    confirm: true,
  },
  confirmed: {
    label: "Mark as Packed",
    icon: Package,
    nextStatus: "packed",
    description: "Mark this order as packed and ready for shipping.",
    confirm: false,
  },
  packed: {
    label: "Mark as Shipped",
    icon: Truck,
    nextStatus: "shipped",
    description: "Mark this order as shipped to the customer.",
    confirm: false,
  },
  shipped: {
    label: "Mark as Delivered",
    icon: CheckCircle,
    nextStatus: "delivered",
    description: "Mark this order as delivered to the customer.",
    confirm: false,
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { confirm, ConfirmDialog } = useConfirm();

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const result = await getOrder(orderId);
      if (result.success && result.data) {
        setOrder(result.data);
      } else {
        toast.error(result.error || "Failed to fetch order");
        router.push("/dashboard/orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    const action = statusActions[order!.status as keyof typeof statusActions];
    if (action?.confirm) {
      const confirmed = await confirm({
        title: `Confirm ${action.label}?`,
        description: action.description,
      });
      if (!confirmed) return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      const result = await response.json();
      if (result.success) {
        toast.success("Order status updated");
        fetchOrder();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    const confirmed = await confirm({
      title: "Cancel this order?",
      description: "Cancelling will reverse any stock deductions. This action cannot be undone.",
    });

    if (!confirmed) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel order");
      }

      const result = await response.json();
      if (result.success) {
        toast.success("Order cancelled");
        fetchOrder();
      } else {
        toast.error(result.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel order");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!order) return;

    try {
      generateInvoicePDF({
        orderNumber: order.orderNumber,
        type: order.type,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        companyName: order.companyName,
        shippingAddress: order.shippingAddress,
        city: order.city,
        createdAt: new Date(order.createdAt),
        items: order.items.map((item) => ({
          productName: item.product.name,
          productSku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shippingFee),
        discount: order.discount ? Number(order.discount) : null,
        total: Number(order.total),
        paidAmount: Number(order.paidAmount),
        notes: order.notes,
      });
      toast.success("Invoice sent to printer");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;

    try {
      downloadInvoicePDF({
        orderNumber: order.orderNumber,
        type: order.type,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        companyName: order.companyName,
        shippingAddress: order.shippingAddress,
        city: order.city,
        createdAt: new Date(order.createdAt),
        items: order.items.map((item) => ({
          productName: item.product.name,
          productSku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
        subtotal: Number(order.subtotal),
        shippingFee: Number(order.shippingFee),
        discount: order.discount ? Number(order.discount) : null,
        total: Number(order.total),
        paidAmount: Number(order.paidAmount),
        notes: order.notes,
      });
      toast.success("Invoice downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download invoice");
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  const statusInfo = orderStatusInfo[order.status];
  const paymentInfo = paymentStatusInfo[order.paymentStatus];
  const typeInfo = orderTypeInfo[order.type];
  const balanceDue = Number(order.total) - Number(order.paidAmount);

  const currentAction = statusActions[order.status as keyof typeof statusActions];

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
              <Badge variant="outline" className="text-base px-3">
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Created on {format(new Date(order.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrintInvoice} title="Print Invoice">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDownloadInvoice} title="Download Invoice">
            <Download className="h-4 w-4" />
          </Button>
          {order.status === "pending" && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/orders/${orderId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {order.status !== "cancelled" && order.status !== "delivered" && (
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={updating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardContent className="pt-6">
          <StatusTimeline currentStatus={order.status} />
        </CardContent>
      </Card>

      {/* Status Actions */}
      {currentAction && order.status !== "cancelled" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{currentAction.label}</h3>
                <p className="text-sm text-muted-foreground">{currentAction.description}</p>
              </div>
              <Button
                onClick={() => handleStatusUpdate(currentAction.nextStatus)}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <currentAction.icon className="h-4 w-4 mr-2" />
                )}
                {currentAction.label}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              {order.customerPhone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
              )}
              {order.customerEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
              )}
              {order.isWholesale && order.companyName && (
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{order.companyName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Order Type</p>
                <Badge className="mt-1">{typeInfo.label}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Details */}
          {order.type !== "retail" && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.shippingAddress ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping Address</p>
                    <p className="font-medium whitespace-pre-line">{order.shippingAddress}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No shipping address provided</p>
                )}
                {order.city && (
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{order.city}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    {item.product.images[0] ? (
                      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.quantity} × ${Number(item.unitPrice).toFixed(2)}</p>
                      <p className="font-semibold">${Number(item.totalPrice).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${Number(order.shippingFee).toFixed(2)}</span>
                </div>
                {order.discount && Number(order.discount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${Number(order.discount).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge variant="outline" className="text-lg px-4 py-2 mb-4">
                  {paymentInfo.label}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">${Number(order.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold text-green-600">${Number(order.paidAmount).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Balance Due</span>
                  <span className={`font-bold ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>
                    ${balanceDue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Show payment recording button only for active orders (not cancelled) */}
              {balanceDue > 0 && order.status !== "cancelled" && (
                <PaymentDialog
                  orderId={order.id}
                  balanceDue={balanceDue}
                  onPaymentComplete={fetchOrder}
                />
              )}

              {/* Show refund message for cancelled orders with payments */}
              {order.status === "cancelled" && Number(order.paidAmount) > 0 && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-800">Order Cancelled</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        ${Number(order.paidAmount).toFixed(2)} was paid on this order. Please process a refund to the customer.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stock Impact */}
          {(order.status === "confirmed" || order.status === "packed" || order.status === "shipped" || order.status === "delivered") && (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Stock was deducted when order was confirmed.
                </p>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="truncate flex-1">{item.product.name}</span>
                    <span className="font-medium ml-2">-{item.quantity}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>

    {/* Confirmation Dialog */}
    <ConfirmDialog />
    </>
  );
}
