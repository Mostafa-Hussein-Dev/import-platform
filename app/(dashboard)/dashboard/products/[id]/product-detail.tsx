"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, ArrowLeft, ArrowUpDown, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatCurrency, calculateMargin, getMarginColor } from "@/lib/utils";
import { DeleteProductButton } from "./delete-button";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { StockAdjustmentDialog } from "@/components/inventory/stock-adjustment-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StockMovementsTable } from "@/components/inventory/stock-movements-table";
import { adjustStock } from "@/lib/actions/stock-movements";
import { toast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string;
  status: string;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  supplier: { id: string; companyName: string };
  supplierSku: string | null;
  category: string | null;
  brand: string | null;
  description: string | null;
  currentStock: number;
  reorderLevel: number;
  warehouseLocation: string | null;
  landedCost: number | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  moq: number | null;
  images: string[];
}

interface ProductDetailProps {
  product: Product;
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    createdAt: Date;
  }>;
}

export function ProductDetail({ product, movements }: ProductDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [movementsDialogOpen, setMovementsDialogOpen] = useState(false);

  const images = product.images || [];

  // Calculate stock status
  const stockStatus =
    product.currentStock === 0
      ? { label: "Out of Stock", color: "bg-red-100 text-red-800" }
      : product.currentStock <= product.reorderLevel
        ? { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" }
        : { label: "In Stock", color: "bg-green-100 text-green-800" };

  const stockNeeded = Math.max(0, product.reorderLevel - product.currentStock);
  const totalInventoryValue = product.landedCost
    ? Number(product.landedCost) * product.currentStock
    : null;

  const wholesaleMargin = calculateMargin(
    Number(product.costPrice),
    Number(product.wholesalePrice)
  );
  const retailMargin = calculateMargin(
    Number(product.costPrice),
    Number(product.retailPrice)
  );

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/products">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold text-[#212861]">Product Details</h1>
          </div>
          <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Adjust Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adjust Stock</DialogTitle>
                <DialogDescription>Modify stock levels for {product.name}</DialogDescription>
              </DialogHeader>
              <StockAdjustmentDialog
                open={adjustDialogOpen}
                onOpenChange={setAdjustDialogOpen}
                product={{
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  currentStock: product.currentStock,
                  reorderLevel: product.reorderLevel,
                  images: product.images,
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Two-panel layout */}
        <div className="grid gap-6 md:grid-cols-[320px_1fr] items-stretch">
          {/* Left panel */}
          <Card>
            <CardContent className="pt-6 space-y-5 h-full flex flex-col">
              {/* Image + Name + status */}
              <ProductImageGallery images={images} productName={product.name} />
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#212861]">{product.name}</h2>
                <p className="text-[#6B7280] font-mono text-sm">{product.sku}</p>
                <Badge
                  className="mt-2"
                  variant={product.status === "ACTIVE" ? "default" : "secondary"}
                >
                  {product.status === "ACTIVE" ? "Active" : "Discontinued"}
                </Badge>
              </div>

              {/* Pricing summary */}
              <div className="border-t border-[#F3F4F6] pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B7280]">Cost</span>
                  <span className="font-bold text-[#212861]">{formatCurrency(Number(product.costPrice))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B7280]">Wholesale</span>
                  <div className="text-right">
                    <span className="font-bold text-[#212861]">{formatCurrency(Number(product.wholesalePrice))}</span>
                    <p className={`text-xs ${getMarginColor(wholesaleMargin)}`}>{wholesaleMargin.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B7280]">Retail</span>
                  <div className="text-right">
                    <span className="font-bold text-[#212861]">{formatCurrency(Number(product.retailPrice))}</span>
                    <p className={`text-xs ${getMarginColor(retailMargin)}`}>{retailMargin.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/products/${product.id}/edit`}>
                    <Edit className="mr-1.5 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <DeleteProductButton id={product.id} />
              </div>
            </CardContent>
          </Card>

          {/* Right panel — two cards with stretched gap */}
          <div className="flex flex-col justify-between h-full gap-6">
            {/* Basic Information */}
            <Card className="w-full">
              <CardContent className="pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[#6B7280]">Supplier</p>
                    <Link
                      href={`/dashboard/suppliers/${product.supplier.id}`}
                      className="font-medium text-[#3A9FE1] hover:underline"
                    >
                      {product.supplier.companyName}
                    </Link>
                  </div>
                  {product.supplierSku && (
                    <div>
                      <p className="text-sm text-[#6B7280]">Supplier SKU</p>
                      <p className="font-medium">{product.supplierSku}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {product.category && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Category</p>
                        <p className="font-medium">{product.category}</p>
                      </div>
                    )}
                    {product.brand && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Brand</p>
                        <p className="font-medium">{product.brand}</p>
                      </div>
                    )}
                  </div>
                  {product.description && (
                    <div>
                      <p className="text-sm text-[#6B7280]">Description</p>
                      <p className="text-sm text-[#374151]">{product.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            {(product.weightKg || product.lengthCm || product.widthCm || product.heightCm || product.landedCost || product.moq || product.warehouseLocation || product.currentStock !== undefined || product.reorderLevel !== undefined) && (
              <Card className="w-full">
                <CardContent className="pt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Stock Status */}
                    {product.currentStock !== undefined && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Stock</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.currentStock} units</span>
                          <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                        </div>
                      </div>
                    )}
                    {product.reorderLevel !== undefined && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Reorder Level</p>
                        <p className="font-medium">{product.reorderLevel} units</p>
                      </div>
                    )}
                    {product.warehouseLocation && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Warehouse</p>
                        <p className="font-medium">{product.warehouseLocation}</p>
                      </div>
                    )}
                    {product.landedCost && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Landed Cost</p>
                        <p className="font-medium">{formatCurrency(Number(product.landedCost))}/unit</p>
                      </div>
                    )}
                    {totalInventoryValue !== null && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Inventory Value</p>
                        <p className="font-medium">{formatCurrency(totalInventoryValue)}</p>
                      </div>
                    )}
                    {product.weightKg && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Weight</p>
                        <p className="font-medium">{Number(product.weightKg)} kg</p>
                      </div>
                    )}
                    {(product.lengthCm || product.widthCm || product.heightCm) && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Dimensions</p>
                        <p className="font-medium">
                          {product.lengthCm || "-"} x {product.widthCm || "-"} x {product.heightCm || "-"} cm
                        </p>
                      </div>
                    )}
                    {product.moq && (
                      <div>
                        <p className="text-sm text-[#6B7280]">MOQ</p>
                        <p className="font-medium">{product.moq} units</p>
                      </div>
                    )}
                  </div>

                  {/* Stock alert */}
                  {stockNeeded > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-700 font-medium">
                          {stockNeeded} units needed to reach reorder level
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stock movements preview */}
                  {movements && movements.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#F3F4F6]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#6B7280]">Recent Stock Movements</p>
                        <Dialog open={movementsDialogOpen} onOpenChange={setMovementsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <ArrowUpDown className="h-3 w-3 mr-1" />
                              View All
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Stock Movement History</DialogTitle>
                              <DialogDescription>All inventory movements for {product.name}</DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto">
                              <StockMovementsTable
                                data={movements.map((m) => ({
                                  ...m,
                                  product: { id: product.id, name: product.name, sku: product.sku, images: product.images },
                                  reason: m.type === "in" ? "shipment_received" : m.type === "out" ? "sale" : "correction",
                                  referenceType: null,
                                  referenceId: null,
                                  landedCost: null,
                                  unitCost: null,
                                  notes: null,
                                }))}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="space-y-2">
                        {movements.slice(0, 3).map((movement) => (
                          <div key={movement.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  movement.type === "in"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {movement.type.toUpperCase()}
                              </Badge>
                              <span className="text-[#6B7280]">
                                {new Date(movement.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span
                              className={
                                movement.quantity > 0 ? "text-green-600" : "text-red-600"
                              }
                            >
                              {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
