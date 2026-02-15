"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Minus, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { adjustStock } from "@/lib/actions/stock-movements";
import { toast } from "@/components/ui/use-toast";

const adjustmentReasons = [
  { value: "damage", label: "Damage", color: "text-red-600" },
  { value: "loss", label: "Loss/Theft", color: "text-red-600" },
  { value: "found", label: "Found", color: "text-green-600" },
  { value: "correction", label: "Correction", color: "text-yellow-600" },
  { value: "return", label: "Customer Return", color: "text-blue-600" },
  { value: "other", label: "Other", color: "text-gray-600" },
];

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  images?: string[];
}

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

const formSchema = z.object({
  quantity: z.number().int().refine((val) => val !== 0, {
    message: "Quantity cannot be zero",
  }),
  reason: z.enum(["damage", "loss", "found", "correction", "return", "other"], {
    required_error: "Please select a reason",
  }),
  notes: z.string().min(5, "Please provide a reason (at least 5 characters)").max(1000),
});

type FormValues = z.infer<typeof formSchema>;

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  product,
}: StockAdjustmentDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      quantity: 1,
      reason: "correction",
      notes: "",
    },
  });

  const currentStock = product?.currentStock ?? 0;
  const reorderLevel = product?.reorderLevel ?? 10;
  const quantity = form.watch("quantity");
  const newStock = currentStock + (adjustmentType === "add" ? quantity : -quantity);

  const stockLevelStatus =
    newStock === 0
      ? "danger"
      : newStock < reorderLevel
        ? "warning"
        : "healthy";

  const onSubmit = (values: FormValues) => {
    if (!product) return;

    const adjustedQuantity = adjustmentType === "add" ? values.quantity : -values.quantity;

    startTransition(async () => {
      const result = await adjustStock({
        productId: product.id,
        quantity: adjustedQuantity,
        reason: values.reason,
        notes: values.notes,
      });

      if (result.success) {
        toast({
          title: "Stock adjusted successfully",
          description: `${product.name} stock updated from ${currentStock} to ${result.data?.stockAfter}`,
        });
        onOpenChange(false);
        form.reset();
        router.refresh();
      } else {
        toast({
          title: "Failed to adjust stock",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      setAdjustmentType("add");
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock Level</DialogTitle>
          <DialogDescription>
            {product
              ? `Manually adjust stock for ${product.name}`
              : "Adjust stock levels for a product"}
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Product</span>
              <span className="font-medium">{product.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">SKU</span>
              <span className="font-mono text-sm">{product.sku}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Current Stock</span>
              <span className="font-bold text-lg">{currentStock} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#6B7280]">Reorder Level</span>
              <span className="text-sm">{reorderLevel} units</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant={adjustmentType === "add" ? "default" : "outline"}
            className={`flex-1 ${adjustmentType === "add" ? "bg-green-600 hover:bg-green-700" : ""}`}
            onClick={() => setAdjustmentType("add")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
          <Button
            type="button"
            variant={adjustmentType === "remove" ? "default" : "outline"}
            className={`flex-1 ${adjustmentType === "remove" ? "bg-red-600 hover:bg-red-700" : ""}`}
            onClick={() => setAdjustmentType("remove")}
          >
            <Minus className="h-4 w-4 mr-2" />
            Remove Stock
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className="text-lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adjustmentReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          <span className={reason.color}>{reason.label}</span>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain the reason for this adjustment..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-3 border-2 border-dashed border-[#E5E7EB]">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                Adjustment Preview
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Current Stock</span>
                <span className="font-medium">{currentStock}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Adjustment</span>
                <span
                  className={`font-medium ${adjustmentType === "add" ? "text-green-600" : "text-red-600"}`}
                >
                  {adjustmentType === "add" ? "+" : "-"}{quantity}
                </span>
              </div>
              <div className="border-t border-[#E5E7EB] pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">New Stock</span>
                  <span
                    className={`font-bold text-lg ${
                      stockLevelStatus === "danger"
                        ? "text-red-600"
                        : stockLevelStatus === "warning"
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {newStock}
                    {stockLevelStatus === "danger" && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Out of Stock
                      </Badge>
                    )}
                    {stockLevelStatus === "warning" && (
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                        Low Stock
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
              {newStock < 0 && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Cannot reduce stock below zero</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || newStock < 0 || !form.formState.isValid}
              >
                {isPending ? "Processing..." : "Confirm Adjustment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
