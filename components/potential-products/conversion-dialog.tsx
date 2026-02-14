"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { convertToProduct } from "@/lib/actions/potential-products";
import { toast } from "@/components/ui/use-toast";
import type { PotentialProductStatus } from "@prisma/client";

interface ConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  potentialProduct: {
    id: string;
    name: string;
    estimatedCost: number | null;
    estimatedPrice: number | null;
    category: string | null;
    brand: string | null;
    weightKg: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    supplier: { id: string; companyName: string } | null;
    status: PotentialProductStatus;
  };
}

export function ConversionDialog({
  open,
  onOpenChange,
  potentialProduct,
}: ConversionDialogProps) {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [confirmed, setConfirmed] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [skuError, setSkuError] = useState("");

  useEffect(() => {
    if (potentialProduct.estimatedCost && potentialProduct.estimatedPrice) {
      const midpoint =
        (Number(potentialProduct.estimatedCost) + Number(potentialProduct.estimatedPrice)) / 2;
      setWholesalePrice(midpoint.toFixed(2));
    }
  }, [potentialProduct, open]);

  function generateSku() {
    const timestamp = Date.now().toString(36).toUpperCase();
    setSku(`AUTO-${timestamp}`);
    setSkuError("");
  }

  async function handleConvert() {
    if (!sku.trim()) {
      setSkuError("SKU is required");
      return;
    }

    setIsConverting(true);
    const result = await convertToProduct(potentialProduct.id, {
      sku: sku.trim(),
      wholesalePrice: parseFloat(wholesalePrice),
      warehouseLocation: warehouseLocation.trim() || undefined,
      currentStock: parseInt(currentStock) || 0,
      reorderLevel: parseInt(reorderLevel) || 10,
    });

    setIsConverting(false);

    if (result.success) {
      toast({ title: "Product created successfully!" });
      onOpenChange(false);
      if (result.data?.productId) {
        router.push(`/dashboard/products/${result.data.productId}`);
      }
    } else {
      toast({ title: result.error || "Failed to convert product", variant: "destructive" });
    }
  }

  const totalCost = potentialProduct.estimatedCost || 0;
  const totalProfit = potentialProduct.estimatedPrice
    ? Number(potentialProduct.estimatedPrice) - totalCost
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to Product</DialogTitle>
          <DialogDescription>
            This will create a new product in your catalog based on this potential
            product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="bg-[#F9FAFB] rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Product Name:</span>
              <span className="font-medium">{potentialProduct.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Supplier:</span>
              <span className="font-medium">
                {potentialProduct.supplier?.companyName || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Cost Price:</span>
              <span className="font-medium">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Retail Price:</span>
              <span className="font-medium">
                ${potentialProduct.estimatedPrice?.toFixed(2) || "—"}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-[#6B7280]">Est. Profit per Unit:</span>
              <span className="font-medium text-emerald-600">
                ${totalProfit.toFixed(2)}
              </span>
            </div>
            {(potentialProduct.category || potentialProduct.brand || potentialProduct.weightKg !== null || potentialProduct.lengthCm !== null || potentialProduct.widthCm !== null || potentialProduct.heightCm !== null) && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-sm font-medium text-[#374151] mb-2">Physical Details</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {potentialProduct.category && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Category:</span>
                      <span className="font-medium">{potentialProduct.category}</span>
                    </div>
                  )}
                  {potentialProduct.brand && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Brand:</span>
                      <span className="font-medium">{potentialProduct.brand}</span>
                    </div>
                  )}
                  {potentialProduct.weightKg !== null && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Weight:</span>
                      <span className="font-medium">{potentialProduct.weightKg} kg</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SKU Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sku">SKU *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={generateSku}>
                Auto-generate
              </Button>
            </div>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => {
                setSku(e.target.value);
                setSkuError("");
              }}
              placeholder="Enter unique SKU"
            />
            {skuError && <p className="text-sm text-red-600">{skuError}</p>}
          </div>

          {/* Wholesale Price Input */}
          <div className="space-y-2">
            <Label htmlFor="wholesale">Wholesale Price *</Label>
            <Input
              id="wholesale"
              type="number"
              step="0.01"
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(e.target.value)}
            />
            <p className="text-xs text-[#6B7280]">
              Suggested: Midpoint between cost and retail
            </p>
          </div>

          {/* Warehouse Location Input */}
          <div className="space-y-2">
            <Label htmlFor="warehouseLocation">Warehouse Location</Label>
            <Input
              id="warehouseLocation"
              value={warehouseLocation}
              onChange={(e) => setWarehouseLocation(e.target.value)}
              placeholder="e.g., Aisle 3, Shelf B2"
            />
          </div>

          {/* Stock and Reorder Level */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Initial Stock *</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level *</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <label
              htmlFor="confirm"
              className="text-sm text-[#6B7280] leading-tight cursor-pointer"
            >
              I confirm this data is accurate and want to create this product.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!confirmed || isConverting || !sku.trim()}
          >
            {isConverting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Convert to Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
