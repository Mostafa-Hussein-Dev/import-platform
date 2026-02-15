"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageOff, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  images: string[];
  currentStock: number;
  reorderLevel: number;
  stockNeeded: number;
  moq?: number | null;
  supplier: {
    id: string;
    companyName: string;
  };
  lastOrderDate?: Date;
}

interface LowStockTableProps {
  data: LowStockProduct[];
  onCreatePO?: (productId: string, supplierId: string) => void;
}

export function LowStockTable({ data, onCreatePO }: LowStockTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#212861] mb-1">All Products Well-Stocked</h3>
        <p className="text-[#6B7280]">No products are currently below their reorder level</p>
      </div>
    );
  }

  // Sort by urgency (lowest stock relative to reorder level first)
  const sortedData = [...data].sort((a, b) => {
    const aUrgency = (a.currentStock / a.reorderLevel);
    const bUrgency = (b.currentStock / b.reorderLevel);
    return aUrgency - bUrgency;
  });

  return (
    <div className="space-y-3">
      {sortedData.map((product) => {
        const isOutOfStock = product.currentStock === 0;
        const suggestedOrderQty = product.moq
          ? Math.max(product.moq, product.stockNeeded)
          : product.stockNeeded;

        return (
          <div
            key={product.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-[#F3F4F6] bg-white hover:bg-[#F9FAFB] transition-colors"
          >
            {/* Image */}
            <div className="flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <div className="h-12 w-12 relative rounded overflow-hidden bg-[#F3F4F6]">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF]">
                  <ImageOff className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="font-medium text-[#212861] hover:text-[#3A9FE1] truncate"
                >
                  {product.name}
                </Link>
                {isOutOfStock ? (
                  <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                    Low Stock
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-[#6B7280] mt-1">
                <span className="font-mono">{product.sku}</span>
                <span>•</span>
                <Link
                  href={`/dashboard/suppliers/${product.supplier.id}`}
                  className="hover:text-[#3A9FE1]"
                >
                  {product.supplier.companyName}
                </Link>
              </div>
            </div>

            {/* Stock Info */}
            <div className="text-center">
              <div className="text-2xl font-bold text-[#212861]">{product.currentStock}</div>
              <div className="text-xs text-[#6B7280]">Current Stock</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-semibold text-[#6B7280]">{product.reorderLevel}</div>
              <div className="text-xs text-[#6B7280]">Reorder Level</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{product.stockNeeded}</div>
              <div className="text-xs text-[#6B7280]">Stock Needed</div>
            </div>

            {/* Suggested Order */}
            <div className="text-center">
              <div className="text-sm text-[#6B7280]">Suggested Order</div>
              <div className="text-lg font-semibold text-[#3A9FE1]">{suggestedOrderQty} units</div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              <Button
                size="sm"
                asChild
                onClick={() => onCreatePO?.(product.id, product.supplier.id)}
              >
                <Link href={`/dashboard/purchase-orders/new?productId=${product.id}&supplierId=${product.supplier.id}&quantity=${suggestedOrderQty}`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create PO
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
