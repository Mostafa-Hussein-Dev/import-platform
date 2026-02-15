"use client";

import { useEffect, useState, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrentStockTable } from "./current-stock-table";
import { ExportButton } from "./export-button";
import { getProducts } from "@/lib/actions/products";
import { getSuppliers } from "@/lib/actions/suppliers";

interface ProductStockInfo {
  id: string;
  sku: string;
  name: string;
  supplier: { id: string; companyName: string };
  currentStock: number;
  reorderLevel: number;
  moq: number | null;
  landedCost: number | null;
  maxLandedCost: number | null;
  warehouseLocation: string | null;
  images: string[];
}

export function CurrentStockContent() {
  const [products, setProducts] = useState<ProductStockInfo[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; companyName: string }[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Fetch suppliers on mount
    startTransition(async () => {
      const suppliersResult = await getSuppliers({
        search: "",
        status: "active",
        page: 1,
        pageSize: "100",
        sortBy: "companyName",
        sortOrder: "asc",
      });

      if (suppliersResult.success && suppliersResult.data) {
        setSuppliers(suppliersResult.data.suppliers);
      }
    });
  }, []);

  useEffect(() => {
    // Fetch products whenever supplier filter changes
    startTransition(async () => {
      const productsResult = await getProducts({
        page: 1,
        pageSize: "50",
        sortBy: "name",
        sortOrder: "asc",
        status: "ACTIVE",
        view: "table",
        supplierId: selectedSupplier === "all" ? undefined : selectedSupplier,
      });

      if (productsResult.success && productsResult.data) {
        setProducts(productsResult.data.products);
      }
    });
  }, [selectedSupplier]);

  return (
    <div className="space-y-4">
      {/* Filter and Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[#6B7280]">Filter by Supplier:</label>
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier} disabled={isPending}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isPending && <span className="text-sm text-[#9CA3AF]">Loading...</span>}
        </div>

        <ExportButton
          filters={{
            supplierId: selectedSupplier === "all" ? undefined : selectedSupplier,
          }}
        />
      </div>

      {/* Table */}
      <CurrentStockTable data={products} />
    </div>
  );
}
