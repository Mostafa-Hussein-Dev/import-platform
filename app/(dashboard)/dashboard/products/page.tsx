"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductsTable } from "@/components/products/products-table";
import { ProductsGrid } from "@/components/products/products-grid";
import { getProducts } from "@/lib/actions/products";
import { getSuppliers } from "@/lib/actions/suppliers";
import type { ProductFilterData } from "@/lib/validations/product";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#212861]">Products</h2>
          <p className="text-[#6B7280]">Manage your product catalog</p>
        </div>
      </div>
      <div className="text-center py-8 text-[#9CA3AF]">Loading...</div>
    </div>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<{ id: string; companyName: string }[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  // Get filters from URL
  const search = searchParams.get("search") || "";
  const supplierId = searchParams.get("supplierId") || "all";
  const category = searchParams.get("category") || "";
  const status = (searchParams.get("status") as "all" | "ACTIVE" | "DISCONTINUED") || "all";
  const view = (searchParams.get("view") as "table" | "grid") || "table";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = searchParams.get("pageSize") || "25";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const updateURL = (params: Record<string, string | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === "" || value === "all") {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    router.push(`?${newParams.toString()}`);
  };

  const fetchProducts = () => {
    startTransition(async () => {
      const filters: ProductFilterData = {
        search: search || undefined,
        supplierId: supplierId === "all" ? undefined : supplierId,
        category: category || undefined,
        status,
        view,
        page,
        pageSize: pageSize as "10" | "25" | "50",
        sortBy: sortBy as "name" | "sku" | "createdAt" | "retailPrice" | "currentStock",
        sortOrder: sortOrder as "asc" | "desc",
      };

      const [productsResult, suppliersResult] = await Promise.all([
        getProducts(filters),
        getSuppliers({ search: "", status: "active", page: 1, pageSize: "25", sortBy: "companyName", sortOrder: "desc" }),
      ]);

      if (productsResult.success) {
        setData(productsResult.data);
        setError(null);
      } else {
        setError(productsResult.error || "Failed to fetch products");
      }

      if (suppliersResult.success && suppliersResult.data) {
        setSuppliers(suppliersResult.data.suppliers);
      }
    });
  };

  useEffect(() => {
    fetchProducts();
  }, [search, supplierId, category, status, view, page, pageSize, sortBy, sortOrder]);

  const handleSearch = (value: string) => {
    updateURL({ search: value, page: 1 });
  };

  const handleSupplierChange = (value: string) => {
    updateURL({ supplierId: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    updateURL({ status: value, page: 1 });
  };

  const handleViewChange = (value: "table" | "grid") => {
    updateURL({ view: value });
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage });
  };

  const handlePageSizeChange = (newSize: string) => {
    updateURL({ pageSize: newSize, page: 1 });
  };

  const handleSort = (column: string, direction: "asc" | "desc") => {
    updateURL({ sortBy: column, sortOrder: direction });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#212861]">Products</h2>
          <p className="text-[#6B7280]">Manage your product catalog</p>
        </div>
        <Button asChild>
          <a href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </a>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={supplierId} onValueChange={handleSupplierChange}>
          <SelectTrigger className="w-48">
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

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => handleViewChange("table")}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => handleViewChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table/Grid */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {data && view === "table" && (
        <ProductsTable
          data={data.products}
          currentPage={page}
          totalPages={data.pages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSort={handleSort}
        />
      )}

      {data && view === "grid" && (
        <div>
          <ProductsGrid data={data.products} />
          {/* Pagination */}
          <div className="flex items-center justify-end gap-2 px-2 mt-6">
            <p className="text-sm text-[#6B7280]">
              Page {page} of {data.pages}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === data.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {isPending && (
        <div className="text-center py-8 text-[#9CA3AF]">
          Loading products...
        </div>
      )}
    </div>
  );
}
