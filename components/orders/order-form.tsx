"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderFormSchema, type OrderFormData } from "@/lib/validations/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderItemsTable } from "./order-items-table";
import { ProductSelectorDialog } from "./product-selector-dialog";
import { Loader2, Globe, Building2, Store } from "lucide-react";
import { toast } from "sonner";
import { OrderType } from "@/types/order";

interface OrderFormProps {
  initialData?: {
    type?: OrderType;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    isWholesale?: boolean;
    companyName?: string;
    shippingAddress?: string;
    city?: string;
    items?: Array<{
      id?: string;
      productId: string;
      productName: string;
      productSku: string;
      productImage: string | null;
      availableStock: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    shippingFee?: number;
    discount?: number;
    notes?: string;
  };
  orderId?: string;
  onSubmit: (data: any, confirm?: boolean) => Promise<void>;
  submitLabel?: string;
  isEditing?: boolean;
}

const orderTypes = [
  { value: "online" as const, label: "Online", icon: Globe, description: "Website or social media order" },
  { value: "wholesale" as const, label: "Wholesale", icon: Building2, description: "Bulk order for retail client" },
  { value: "retail" as const, label: "Retail", icon: Store, description: "Walk-in customer, in-person sale" },
];

export function OrderForm({
  initialData,
  orderId,
  onSubmit,
  submitLabel = "Create Order",
  isEditing = false,
}: OrderFormProps) {
  const router = useRouter();
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType>(
    initialData?.type || "retail"
  );
  const [isWholesale, setIsWholesale] = useState(initialData?.isWholesale || false);
  const [items, setItems] = useState<
    Array<{
      id?: string;
      productId: string;
      productName: string;
      productSku: string;
      productImage: string | null;
      availableStock: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>
  >(initialData?.items || []);
  const [loading, setLoading] = useState<"confirm" | "save" | false>(false);
  const [confirming, setConfirming] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      type: initialData?.type || "retail",
      customerName: initialData?.customerName || "",
      customerPhone: initialData?.customerPhone || "",
      customerEmail: initialData?.customerEmail || "",
      isWholesale: initialData?.isWholesale ?? false,
      companyName: initialData?.companyName || "",
      shippingAddress: initialData?.shippingAddress || "",
      city: initialData?.city || "",
      shippingFee: initialData?.shippingFee ?? 0,
      discount: initialData?.discount ?? 0,
      notes: initialData?.notes || "",
      items: initialData?.items?.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })) || [],
    } as Partial<OrderFormData>,
  });

  const watchedItems = watch("items");
  const watchedShippingFee = watch("shippingFee") || 0;
  const watchedDiscount = watch("discount") || 0;

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + watchedShippingFee - watchedDiscount;

  const handleProductSelect = (product: any) => {
    const existingIndex = items.findIndex((item) => item.productId === product.id);

    if (existingIndex !== -1) {
      const updatedItems = [...items];
      const existing = updatedItems[existingIndex];
      existing.quantity += 1;
      existing.totalPrice = existing.unitPrice * existing.quantity;
      setItems(updatedItems);
      setValue(
        "items",
        updatedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );
      return;
    }

    const price = selectedOrderType === "wholesale" ? product.wholesalePrice : product.retailPrice;

    const newItem = {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      productImage: product.images[0] || null,
      availableStock: product.currentStock,
      quantity: 1,
      unitPrice: price,
      totalPrice: price,
    };

    setItems([...items, newItem]);
    setValue("items", [...watchedItems, { productId: product.id, quantity: 1, unitPrice: price }]);
  };

  const handleItemsChange = (newItems: typeof items) => {
    setItems(newItems);
    setValue(
      "items",
      newItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    );
  };

  const handleOrderTypeChange = (type: OrderType) => {
    setSelectedOrderType(type);
    setValue("type", type);

    if (type === "wholesale") {
      setIsWholesale(true);
      setValue("isWholesale", true);
    } else {
      setIsWholesale(false);
      setValue("isWholesale", false);
      if (type === "retail") {
        setValue("shippingAddress", "");
        setValue("city", "");
      }
    }

    // Update item prices based on new order type
    const updatedItems = items.map((item) => {
      const newPrice = type === "wholesale" ? item.unitPrice * 0.7 : item.unitPrice / 0.7;
      return {
        ...item,
        unitPrice: Math.round(newPrice * 100) / 100,
        totalPrice: Math.round(newPrice * 100) / 100 * item.quantity,
      };
    });
    setItems(updatedItems);
  };

  const onFormSubmit = async (data: OrderFormData, confirm: boolean = false) => {
    if (items.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    const submitData = {
      ...data,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      status: confirm ? "confirmed" : "pending",
    };

    setLoading(confirm ? "confirm" : "save");

    try {
      await onSubmit(submitData);
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* Order Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Order Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {orderTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleOrderTypeChange(type.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedOrderType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <h3 className="font-semibold">{type.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="John Doe"
                {...register("customerName")}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                placeholder="+1 234 567 8900"
                {...register("customerPhone")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="john@example.com"
              {...register("customerEmail")}
            />
            {errors.customerEmail && (
              <p className="text-sm text-destructive">{errors.customerEmail.message}</p>
            )}
          </div>

          {/* Wholesale pricing checkbox - only for online orders */}
          {selectedOrderType === "online" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isWholesale"
                checked={isWholesale}
                onCheckedChange={(checked) => {
                  setIsWholesale(checked as boolean);
                  setValue("isWholesale", checked as boolean);
                }}
              />
              <Label htmlFor="isWholesale" className="cursor-pointer">
                Apply wholesale pricing
              </Label>
            </div>
          )}

          {(isWholesale || selectedOrderType === "wholesale") && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Acme Corporation"
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Details */}
      {selectedOrderType !== "retail" && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                placeholder="123 Main Street, Apt 4B"
                rows={2}
                {...register("shippingAddress")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="New York" {...register("city")} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OrderItemsTable
            items={items}
            onChange={handleItemsChange}
            orderType={selectedOrderType}
          />

          {/* Add Product Button */}
          <div className="flex justify-center pt-4">
            <ProductSelectorDialog
              onProductSelect={handleProductSelect}
              orderType={selectedOrderType}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Subtotal</Label>
              <div className="text-2xl font-bold">${subtotal.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Auto-calculated</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingFee">Shipping Fee</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="shippingFee"
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-7"
                  {...register("shippingFee", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-7"
                  {...register("discount", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Label className="text-lg">Total</Label>
            <div className="text-3xl font-bold">${total.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Internal notes about this order..."
            rows={3}
            {...register("notes")}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={!!loading}
        >
          Cancel
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => {
              handleSubmit((data) => onFormSubmit(data, false))();
            }}
            disabled={loading === "confirm"}
          >
            {loading === "save" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Pending"
            )}
          </Button>

          {!isEditing && (
            <Button
              type="button"
              variant="default"
              onClick={() => {
                handleSubmit((data) => onFormSubmit(data, true))();
              }}
              disabled={loading === "save"}
            >
              {loading === "confirm" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Create & Confirm"
              )}
            </Button>
          )}

          {isEditing && (
            <Button
              type="button"
              variant="default"
              onClick={() => {
                handleSubmit((data) => onFormSubmit(data, false))();
              }}
              disabled={!!loading}
            >
              {loading === "save" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Order"
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
