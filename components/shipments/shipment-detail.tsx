"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Ship, Package, Calendar, DollarSign, CheckCircle, Factory } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { updateShipmentStatus, recordShipmentPayment } from "@/lib/actions/shipments";

type ShipmentData = {
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
};

const nextStatusMap: Record<string, { status: string; label: string }> = {
  pending: { status: "in_transit", label: "Mark In Transit" },
  in_transit: { status: "customs", label: "Mark In Customs" },
  customs: { status: "delivered", label: "Mark Delivered" },
};

const statusDescriptions: Record<string, string> = {
  in_transit: "This will mark the shipment as departed and in transit.",
  customs: "This will mark the shipment as arrived at customs.",
  delivered: "This will mark the shipment as cleared and delivered. The linked purchase order will also be marked as received.",
};

export default function ShipmentDetail({ shipment }: { shipment: ShipmentData }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");

  const remainingBalance = shipment.totalCost - shipment.paidAmount;

  const methodColors: Record<string, string> = {
    sea: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    air: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    courier: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  };

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-red-100 text-red-700 hover:bg-red-100",
    partial: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    paid: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-muted text-foreground/80 hover:bg-muted",
    in_transit: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    customs: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    delivered: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  };

  const statusIcons: Record<string, any> = {
    pending: Package,
    in_transit: Ship,
    customs: Calendar,
    delivered: CheckCircle,
  };

  const StatusIcon = statusIcons[shipment.status];
  const nextStatus = nextStatusMap[shipment.status];

  async function handleStatusUpdate() {
    if (!nextStatus) return;
    setUpdating(true);
    const result = await updateShipmentStatus(shipment.id, nextStatus.status);
    setUpdating(false);
    setConfirmOpen(false);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to update status");
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentSubmitting(true);
    const result = await recordShipmentPayment(shipment.id, {
      amount: parseFloat(paymentAmount),
      date: paymentDate,
      notes: paymentNotes || undefined,
    });
    setPaymentSubmitting(false);
    if (result.success) {
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
      router.refresh();
    } else {
      alert(result.error || "Failed to record payment");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/shipments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{shipment.shipmentNumber}</h1>
            <p className="text-muted-foreground">Shipment Details</p>
          </div>
        </div>
      </div>

      {/* Status Badge + Next Status Button */}
      <div className="flex items-center gap-4">
        <Badge className={`text-base px-4 py-2 ${statusColors[shipment.status]}`}>
          <StatusIcon className="h-4 w-4 mr-2" />
          {shipment.status.toUpperCase()}
        </Badge>
        <Badge className={`text-base px-4 py-2 ${paymentStatusColors[shipment.paymentStatus]}`}>
          <DollarSign className="h-4 w-4 mr-2" />
          {shipment.paymentStatus === "paid" ? "PAID" : shipment.paymentStatus.toUpperCase()}
        </Badge>
        <Badge className={`text-base px-4 py-2 ${methodColors[shipment.method]}`}>
          {shipment.method.toUpperCase()}
        </Badge>
        {nextStatus && (
          <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
            {nextStatus.label}
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              {nextStatus && statusDescriptions[nextStatus.status]}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to change the status of{" "}
            <span className="font-semibold">{shipment.shipmentNumber}</span> from{" "}
            <Badge className={statusColors[shipment.status]}>{shipment.status.toUpperCase()}</Badge>{" "}
            to{" "}
            <Badge className={nextStatus ? statusColors[nextStatus.status] : ""}>
              {nextStatus?.status.toUpperCase()}
            </Badge>
            ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={updating}>
              {updating ? "Updating..." : nextStatus?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Purchase Order */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Purchase Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">PO Number</p>
              <Link
                href={`/dashboard/purchase-orders/${shipment.purchaseOrder.id}`}
                className="font-medium text-[#3A9FE1] hover:underline"
              >
                {shipment.purchaseOrder.poNumber}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <Link
                href={`/dashboard/suppliers/${shipment.purchaseOrder.supplier.id}`}
                className="font-medium text-[#3A9FE1] hover:underline"
              >
                {shipment.purchaseOrder.supplier.companyName}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="font-medium text-foreground">{shipment.purchaseOrder.items.length} products</p>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Shipping Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Shipping Company</p>
              <Link
                href={`/dashboard/shipping-companies/${shipment.shippingCompany.id}`}
                className="font-medium text-[#3A9FE1] hover:underline"
              >
                {shipment.shippingCompany.name}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Method</p>
              <Badge className={methodColors[shipment.method]}>
                {shipment.method.toUpperCase()}
              </Badge>
            </div>
            {shipment.departureDate && (
              <div>
                <p className="text-sm text-muted-foreground">Departure Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/70" />
                  <p className="font-medium text-foreground">
                    {new Date(shipment.departureDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {shipment.estimatedArrival && (
              <div>
                <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/70" />
                  <p className="font-medium text-foreground">
                    {new Date(shipment.estimatedArrival).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {shipment.trackingNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Tracking Number</p>
                <p className="font-medium text-foreground">{shipment.trackingNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cargo Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Cargo Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shipment.totalWeight && (
              <div>
                <p className="text-sm text-muted-foreground">Total Weight</p>
                <p className="font-medium text-foreground">{shipment.totalWeight} kg</p>
              </div>
            )}
            {shipment.totalVolume && (
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="font-medium text-foreground">{shipment.totalVolume} CBM</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping Cost</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(shipment.shippingCost)}
              </span>
            </div>
            {shipment.customsDuty && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customs Duty</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(shipment.customsDuty)}
                </span>
              </div>
            )}
            {shipment.otherFees && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Other Fees</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(shipment.otherFees)}
                </span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-foreground">Total Cost</span>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(shipment.totalCost)}
                </span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(shipment.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remaining Balance</span>
                <span className={`font-semibold ${remainingBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Payment Status</span>
                <Badge className={paymentStatusColors[shipment.paymentStatus]}>
                  {shipment.paymentStatus.toUpperCase()}
                </Badge>
              </div>
              {shipment.paymentStatus !== "paid" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold text-sm">Product</th>
                  <th className="text-right py-2 px-3 font-semibold text-sm">Units</th>
                  <th className="text-right py-2 px-3 font-semibold text-sm">Unit Cost</th>
                  <th className="text-right py-2 px-3 font-semibold text-sm">Allocated Shipping</th>
                  <th className="text-right py-2 px-3 font-semibold text-sm">Allocated Customs</th>
                  <th className="text-right py-2 px-3 font-semibold text-sm">Allocated Fees</th>
                  <th className="text-right py-2 px-3 font-semibold text-sm">Landed Cost</th>
                  <th className="text-right py-2 px-3 font-semibold text-sm">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Calculate landed costs
                  const items = shipment.purchaseOrder.items;
                  const shippingCost = shipment.shippingCost;
                  const customsDuty = shipment.customsDuty || 0;
                  const otherFees = shipment.otherFees || 0;

                  // Try weight-based allocation first
                  const itemsWithWeight = items.filter(item => item.product.weightKg !== null);
                  const totalWeight = itemsWithWeight.reduce((sum, item) =>
                    sum + (item.product.weightKg! * item.quantity), 0);

                  const useWeightAllocation = itemsWithWeight.length === items.length && totalWeight > 0;

                  let totalUnits = 0;
                  let totalValue = 0;

                  return items.map((item) => {
                    const productTotal = item.unitCost * item.quantity;
                    let allocatedShipping = 0;
                    let allocatedCustoms = 0;
                    let allocatedFees = 0;

                    if (useWeightAllocation && item.product.weightKg) {
                      // Weight-based allocation
                      const productWeight = item.product.weightKg * item.quantity;
                      const weightRatio = productWeight / totalWeight;
                      allocatedShipping = shippingCost * weightRatio;
                      allocatedCustoms = customsDuty * weightRatio;
                      allocatedFees = otherFees * weightRatio;
                    } else if (productTotal > 0) {
                      // Value-based allocation (fallback)
                      const totalProductValue = items.reduce((sum, i) =>
                        sum + (i.unitCost * i.quantity), 0);
                      const valueRatio = productTotal / totalProductValue;
                      allocatedShipping = shippingCost * valueRatio;
                      allocatedCustoms = customsDuty * valueRatio;
                      allocatedFees = otherFees * valueRatio;
                    } else {
                      // Equal distribution
                      allocatedShipping = shippingCost / items.length;
                      allocatedCustoms = customsDuty / items.length;
                      allocatedFees = otherFees / items.length;
                    }

                    const landedCost = item.unitCost +
                      (allocatedShipping + allocatedCustoms + allocatedFees) / item.quantity;
                    const totalItemValue = landedCost * item.quantity;

                    totalUnits += item.quantity;
                    totalValue += totalItemValue;

                    return (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-3">
                          <div className="font-medium text-sm">{item.product.name}</div>
                          <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                        </td>
                        <td className="text-right py-3 px-3 text-sm">{item.quantity}</td>
                        <td className="text-right py-3 px-3 text-sm">{formatCurrency(item.unitCost)}</td>
                        <td className="text-right py-3 px-3 text-sm">{formatCurrency(allocatedShipping)}</td>
                        <td className="text-right py-3 px-3 text-sm">{formatCurrency(allocatedCustoms)}</td>
                        <td className="text-right py-3 px-3 text-sm">{formatCurrency(allocatedFees)}</td>
                        <td className="text-right py-3 px-3 font-semibold">{formatCurrency(landedCost)}</td>
                        <td className="text-right py-3 px-3 font-semibold">{formatCurrency(totalItemValue)}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50">
                  <td className="py-3 px-3 font-semibold">Total</td>
                  <td className="text-right py-3 px-3 font-bold">{shipment.purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td colSpan={5}></td>
                  <td className="text-right py-3 px-3 font-bold text-lg">{formatCurrency(shipment.purchaseOrder.items.reduce((sum, item) => {
                    const shippingCost = shipment.shippingCost;
                    const customsDuty = shipment.customsDuty || 0;
                    const otherFees = shipment.otherFees || 0;
                    const items = shipment.purchaseOrder.items;
                    const itemsWithWeight = items.filter(i => i.product.weightKg !== null);
                    const totalWeight = itemsWithWeight.reduce((s, i) => s + (i.product.weightKg! * i.quantity), 0);
                    const useWeightAllocation = itemsWithWeight.length === items.length && totalWeight > 0;

                    let allocatedShipping = 0;
                    let allocatedCustoms = 0;
                    let allocatedFees = 0;

                    if (useWeightAllocation && item.product.weightKg) {
                      const productWeight = item.product.weightKg * item.quantity;
                      const weightRatio = productWeight / totalWeight;
                      allocatedShipping = shippingCost * weightRatio;
                      allocatedCustoms = customsDuty * weightRatio;
                      allocatedFees = otherFees * weightRatio;
                    } else {
                      const totalProductValue = items.reduce((s, i) => s + (i.unitCost * i.quantity), 0);
                      const valueRatio = (item.unitCost * item.quantity) / totalProductValue;
                      allocatedShipping = shippingCost * valueRatio;
                      allocatedCustoms = customsDuty * valueRatio;
                      allocatedFees = otherFees * valueRatio;
                    }

                    const landedCost = item.unitCost +
                      (allocatedShipping + allocatedCustoms + allocatedFees) / item.quantity;
                    return sum + (landedCost * item.quantity);
                  }, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {shipment.shipmentNumber}. Remaining balance: {formatCurrency(remainingBalance)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <input
                type="number"
                min="0.01"
                max={remainingBalance}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Payment details..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={paymentSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={paymentSubmitting}>
                {paymentSubmitting ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notes */}
      {shipment.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 whitespace-pre-wrap">{shipment.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
