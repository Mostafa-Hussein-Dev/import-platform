"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPurchaseOrder, updatePurchaseOrderStatus, recordPayment } from "@/lib/actions/purchase-orders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, FileText, Calendar, User, Package, DollarSign, CheckCircle, Factory } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Save as draft - work in progress",
    sent: "Sent to supplier - awaiting confirmation",
    confirmed: "Confirmed by supplier - ready for production",
    producing: "In production - supplier is manufacturing",
    shipped: "Shipped - goods in transit",
    received: "Received - goods delivered",
  };
  return labels[status] || status;
}

function getNextStatuses(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    draft: ["sent"],
    sent: ["confirmed"],
    confirmed: ["producing"],
    producing: ["shipped"],
  };
  return transitions[currentStatus] || [];
}

export default function PurchaseOrderViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [po, setPo] = useState<any>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return;
      const result = await getPurchaseOrder(id);
      if (result.success && result.data) {
        setPo(result.data);
      } else {
        router.push("/dashboard/purchase-orders");
      }
      setLoading(false);
    }
    fetchOrder();
  }, [id, router]);

  async function handleStatusChange(newStatus: string) {
    if (!id) return;
    const result = await updatePurchaseOrderStatus(id, newStatus);
    if (result.success) {
      // Refetch to get updated data
      const refetchResult = await getPurchaseOrder(id);
      if (refetchResult.success && refetchResult.data) {
        setPo(refetchResult.data);
      }
    } else {
      alert(result.error || "Failed to update status");
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setPaymentSubmitting(true);
    const result = await recordPayment(id, {
      amount: parseFloat(paymentAmount),
      date: paymentDate,
      notes: paymentNotes || undefined,
    });
    setPaymentSubmitting(false);
    if (result.success) {
      setShowPaymentDialog(false);
      setPaymentAmount("");
      setPaymentNotes("");
      // Refetch PO data
      const refetchResult = await getPurchaseOrder(id);
      if (refetchResult.success && refetchResult.data) {
        setPo(refetchResult.data);
      }
    } else {
      alert(result.error || "Failed to record payment");
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!po) {
    return null;
  }

  const remainingBalance: number = Number(po.totalCost) - Number(po.paidAmount);
  const paymentPercentage: number = (Number(po.paidAmount) / Number(po.totalCost)) * 100;

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-foreground/80 hover:bg-muted",
    sent: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    confirmed: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
    producing: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    shipped: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    received: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  };

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-red-100 text-red-700 hover:bg-red-100",
    partial: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    paid: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  };

  const statusIcons: Record<string, any> = {
    draft: FileText,
    sent: Calendar,
    confirmed: Factory,
    producing: Package,
    shipped: Package,
    received: CheckCircle,
  };

  const StatusIcon = statusIcons[po.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{po.poNumber}</h1>
            <p className="text-muted-foreground">Purchase Order Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {po.status !== "draft" && po.status !== "sent" && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/purchase-orders/${po.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <Badge className={`text-base px-4 py-2 ${statusColors[po.status]}`}>
          {po.status.toUpperCase()}
        </Badge>
        <Badge className={`text-base px-4 py-2 ${paymentStatusColors[po.paymentStatus]}`}>
          Payment: {po.paymentStatus.toUpperCase()}
        </Badge>
        {/* Status Change Button */}
        {po.status !== "received" && po.status !== "shipped" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusDialog(true)}
          >
            Change Status
          </Button>
        )}
      </div>

      {/* Status Change Dialog */}
      {showStatusDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-border">
            <h3 className="text-lg font-semibold mb-4">Change Purchase Order Status</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Current: <Badge className={statusColors[po.status]}>{po.status.toUpperCase()}</Badge>
              <br />
              {getNextStatuses(po.status).length > 0 ? "Select new status:" : "This is the final status"}
            </p>
            {getNextStatuses(po.status).length > 0 && (
              <div className="space-y-2">
                {getNextStatuses(po.status).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      handleStatusChange(status);
                      setShowStatusDialog(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {React.createElement(statusIcons[status] || Package, { className: "h-4 w-4" })}
                      <div className="text-left">
                        <div className="font-medium">{status.toUpperCase()}</div>
                        <div className="text-xs text-muted-foreground">{getStatusLabel(status)}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <Link
                href={`/dashboard/suppliers/${po.supplier.id}`}
                className="font-medium text-[#3A9FE1] hover:underline"
              >
                {po.supplier.companyName}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium text-foreground">{new Date(po.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Delivery</p>
              <p className="font-medium text-foreground">
                {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={`text-base px-4 py-2 ${statusColors[po.status]}`}>
                {po.status.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Items ({po.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {po.items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No items</p>
            ) : (
              <div className="space-y-3">
                {po.items.map((item: any, index: number) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <div>
                        <p className="font-medium text-foreground">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">{item.product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        <p className="text-sm text-muted-foreground">Unit Cost: {formatCurrency(item.unitCost)}</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(item.quantity * item.unitCost)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Tracking */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Paid: {formatCurrency(po.paidAmount)}</span>
                <span className="text-sm text-muted-foreground">Total: {formatCurrency(po.totalCost)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-[#3A9FE1] h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">{paymentPercentage.toFixed(1)}% paid</span>
                <span className="text-xs font-medium text-foreground">
                  Remaining: {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>
            {po.paymentStatus !== "paid" && (
              <Button variant="outline" size="sm" onClick={() => setShowPaymentDialog(true)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Record Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for {po.poNumber}. Remaining balance: {formatCurrency(remainingBalance)}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingBalance}
                  required
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-date">Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-notes">Notes (optional)</Label>
                <Textarea
                  id="payment-notes"
                  placeholder="Payment notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  maxLength={500}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={paymentSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={paymentSubmitting}>
                  {paymentSubmitting ? "Recording..." : "Record Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Shipment Info */}
        {po.shipment && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Linked Shipment</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/dashboard/shipments/${po.shipment.id}`}
                className="font-medium text-[#3A9FE1] hover:underline"
              >
                {po.shipment.shipmentNumber}
              </Link>
              <span className="text-muted-foreground mx-2">·</span>
              <span className="text-muted-foreground">{po.shipment.shippingCompany.name}</span>
              <span className="text-muted-foreground mx-2">·</span>
              <Badge className={`ml-2 ${statusColors[po.shipment.status]}`}>
                {po.shipment.status}
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {po.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 whitespace-pre-wrap">{po.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
