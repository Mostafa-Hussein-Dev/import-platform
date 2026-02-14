"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency, calculateMargin, getMarginColor } from "@/lib/utils";
import { Package } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  images: string[];
  retailPrice: any;
  costPrice: any;
  currentStock: number;
  reorderLevel: number;
  status: string;
  supplier: {
    id: string;
    companyName: string;
  };
}

interface ProductsGridProps {
  data: Product[];
}

export function ProductsGrid({ data }: ProductsGridProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-[#9CA3AF] mb-4" />
        <p className="text-[#6B7280]">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((product) => {
        const margin = calculateMargin(
          Number(product.costPrice),
          Number(product.retailPrice)
        );
        const isLowStock = product.currentStock < product.reorderLevel;

        return (
          <Link key={product.id} href={`/dashboard/products/${product.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                {/* Image */}
                <div className="aspect-square rounded-lg bg-[#F3F4F6] mb-4 relative overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-[#6B7280] truncate">
                        {product.sku}
                      </p>
                      <h3 className="font-semibold text-[#212861] truncate">
                        {product.name}
                      </h3>
                    </div>
                    <Badge
                      variant={product.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {product.status === "ACTIVE" ? "Active" : "Discontinued"}
                    </Badge>
                  </div>

                  <p className="text-sm text-[#6B7280]">
                    {product.supplier.companyName}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#212861]">
                        {formatCurrency(Number(product.retailPrice))}
                      </p>
                      <p
                        className={`text-xs ${getMarginColor(margin)}`}
                      >
                        {margin.toFixed(1)}% margin
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          isLowStock ? "text-amber-600" : "text-[#6B7280]"
                        }`}
                      >
                        Stock: {product.currentStock}
                      </p>
                      {isLowStock && (
                        <p className="text-xs text-amber-600">Low stock</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
