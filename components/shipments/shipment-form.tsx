"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shipmentFormSchema, type ShipmentFormData } from "@/lib/validations/shipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: { companyName: string };
  itemsCount: number;
  totalCost: number;
}

interface ShippingCompany {
  id: string;
  name: string;
  type: string;
  ratePerKg: number | null;
  ratePerCBM: number | null;
}

interface ShipmentFormProps {
  purchaseOrders: PurchaseOrder[];
  shippingCompanies: ShippingCompany[];
  initialData?: Partial<ShipmentFormData>;
  onSubmit: (data: ShipmentFormData) => Promise<void>;
}

export function ShipmentForm({
  purchaseOrders,
  shippingCompanies,
  initialData,
  onSubmit,
}: ShipmentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<ShippingCompany | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues: {
      purchaseOrderId: initialData?.purchaseOrderId || "",
      shippingCompanyId: initialData?.shippingCompanyId || "",
      method: initialData?.method || "sea",
      departureDate: initialData?.departureDate
        ? new Date(initialData.departureDate).toISOString().split("T")[0]
        : "",
      estimatedArrival: initialData?.estimatedArrival
        ? new Date(initialData.estimatedArrival).toISOString().split("T")[0]
        : "",
      trackingNumber: initialData?.trackingNumber || "",
      totalWeight: initialData?.totalWeight ? String(initialData.totalWeight) : "",
      totalVolume: initialData?.totalVolume ? String(initialData.totalVolume) : "",
      shippingCost: initialData?.shippingCost ? String(initialData.shippingCost) : "",
      customsDuty: initialData?.customsDuty ? String(initialData.customsDuty) : "",
      otherFees: initialData?.otherFees ? String(initialData.otherFees) : "",
      notes: initialData?.notes || "",
    },
  });

  const shippingCost = parseFloat(form.watch("shippingCost") || "0");
  const customsDuty = parseFloat(form.watch("customsDuty") || "0");
  const otherFees = parseFloat(form.watch("otherFees") || "0");
  const totalCost = shippingCost + customsDuty + otherFees;

  const handleSubmit = async (data: ShipmentFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shipment");
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Section 1: Purchase Order */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="purchaseOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Purchase Order *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const po = purchaseOrders.find(p => p.id === value);
                      setSelectedPO(po || null);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purchase order" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {purchaseOrders.length === 0 ? (
                        <div className="p-4 text-sm text-[#9CA3AF]">
                          No eligible purchase orders. Only POs in "Producing" or "Confirmed" status can have shipments.
                        </div>
                      ) : (
                        purchaseOrders.map((po) => (
                          <SelectItem key={po.id} value={po.id}>
                            <div className="flex flex-col gap-1">
                              <div className="font-medium">{po.poNumber}</div>
                              <div className="text-xs text-[#9CA3AF]">
                                {po.supplier.companyName} · {po.itemsCount} items · {formatCurrency(po.totalCost)}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPO && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">{selectedPO.poNumber}</h3>
                  <Badge variant="outline" className="bg-white">
                    {selectedPO.itemsCount} items
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Supplier</span>
                    <span className="font-medium text-[#212861]">{selectedPO.supplier.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Total Value</span>
                    <span className="font-semibold text-[#212861]">{formatCurrency(selectedPO.totalCost)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    asChild
                  >
                    <Link
                      href={`/dashboard/purchase-orders/${selectedPO.id}`}
                      target="_blank"
                    >
                      View Full PO Details
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Shipping Details */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="shippingCompanyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Company *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const company = shippingCompanies.find(c => c.id === value);
                      setSelectedCompany(company || null);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shipping company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shippingCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} ({company.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Method *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sea">Sea Freight</SelectItem>
                      <SelectItem value="air">Air Freight</SelectItem>
                      <SelectItem value="courier">Courier</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedArrival"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Arrival</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="trackingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional tracking number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 3: Cargo Information */}
        <Card>
          <CardHeader>
            <CardTitle>Cargo Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="totalWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Weight (kg)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalVolume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Volume (CBM)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Costs */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="shippingCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Cost *</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customsDuty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customs Duty</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherFees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Fees</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-[#212861]">Total Cost</span>
                <span className="text-2xl font-bold text-[#212861]">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Additional */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Additional notes about this shipment..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Shipment"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
