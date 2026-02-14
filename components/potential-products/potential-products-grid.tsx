"use client";

import { PotentialProductCard } from "./potential-product-card";
import type { PotentialProductStatus } from "@prisma/client";
import { Search } from "lucide-react";

interface PotentialProductsGridProps {
  potentialProducts: Array<{
    id: string;
    name: string;
    images: string[];
    supplier: { id: string; companyName: string } | null;
    estimatedCost: number | null;
    estimatedPrice: number | null;
    moq: number | null;
    status: PotentialProductStatus;
  }>;
  onRefresh?: () => void;
}

export function PotentialProductsGrid({
  potentialProducts,
  onRefresh,
}: PotentialProductsGridProps) {
  if (potentialProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-[#9CA3AF] mb-4" />
        <p className="text-[#6B7280]">No potential products found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {potentialProducts.map((product) => (
        <PotentialProductCard
          key={product.id}
          {...product}
          onDelete={onRefresh}
        />
      ))}
    </div>
  );
}
