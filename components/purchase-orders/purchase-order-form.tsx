"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { purchaseOrderFormSchema, type PurchaseOrderFormData } from "@/lib/validations/purchase-order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, ImageOff } from "lucide-react";
import Image from "next/image";

interface Supplier {
  id: string;
  companyName: string;
  country: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  images: string[];
  costPrice: number;
}

interface OrderItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  products: Product[];
  initialData?: Partial<PurchaseOrderFormData>;
  onSubmit: (data: PurchaseOrderFormData, status: "draft" | "sent") => Promise<void>;
  submitLabel?: string;
}

export function PurchaseOrderForm({
  suppliers,
  products,
  initialData,
  onSubmit,
}: PurchaseOrderFormProps) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      supplierId: initialData?.supplierId || "",
      expectedDate: initialData?.expectedDate?.toISOString().split("T")[0] || "",
      items: initialData?.items || [],
      shippingEstimate: initialData?.shippingEstimate?.toString() || "",
      notes: initialData?.notes || "",
    },
  });

  // Initialize items from initialData when editing
  useEffect(() => {
    if (initialData?.items && initialData.items.length > 0) {
      setItems(initialData.items);
    }
  }, [initialData?.items]);

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const shippingEstimate = form.watch("shippingEstimate") ? parseFloat(form.watch("shippingEstimate") || "0") : 0;
  const totalCost = subtotal + shippingEstimate;

  const handleAddItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = items.find(i => i.productId === productId);
    if (existingItem) {
      setError("This product is already in the order");
      return;
    }

    setItems([
      ...items,
      {
        productId,
        quantity: 1,
        unitCost: product.costPrice,
      },
    ]);
    setError(null);
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const handleUpdateItem = (productId: string, field: "quantity" | "unitCost", value: number) => {
    setItems(items.map(item =>
      item.productId === productId
        ? { ...item, [field]: value }
        : item
    ));
  };

  const handleSubmit = async (status: "draft" | "sent") => {
    setError(null);
    if (items.length === 0) {
      setError("Please add at least one product");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        ...form.getValues(),
        items,
      };
      await onSubmit(data, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create purchase order");
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Section 1: Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.companyName} ({supplier.country})
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
              name="expectedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Delivery Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" min={new Date().toISOString().split("T")[0]} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Additional notes for this order..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2: Add Products */}
        <Card>
          <CardHeader>
            <CardTitle>Add Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={handleAddItem}>
              <SelectTrigger>
                <SelectValue placeholder="Search and select products..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center gap-2">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={24}
                          height={24}
                          className="rounded object-cover"
                        />
                      ) : (
                        <ImageOff className="h-6 w-6 text-[#9CA3AF]" />
                      )}
                      <span>{product.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {product.sku}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Products */}
            {items.length > 0 && (
              <div className="space-y-3 mt-4">
                {items.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;

                  return (
                    <div key={item.productId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-[#212861]">{product.name}</p>
                          <p className="text-sm text-[#6B7280]">{product.sku}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.productId, "quantity", parseInt(e.target.value) || 1)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Unit Cost ($)</Label>
                          <Input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={item.unitCost}
                            onChange={(e) => handleUpdateItem(item.productId, "unitCost", parseFloat(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Total</Label>
                          <p className="font-semibold text-[#212861] mt-1">
                            {formatCurrency(item.quantity * item.unitCost)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Cost Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Subtotal</span>
              <span className="font-semibold text-[#212861]">{formatCurrency(subtotal)}</span>
            </div>

            <FormField
              control={form.control}
              name="shippingEstimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Estimate</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min="0" placeholder="0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-[#212861]">Total Cost</span>
                <span className="text-lg font-bold text-[#212861]">{formatCurrency(totalCost)}</span>
              </div>
            </div>
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
            type="button"
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit("sent")}
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? "Creating..." : "Create & Send"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
