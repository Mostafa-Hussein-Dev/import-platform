import { Suspense } from "react";
import { getPotentialProducts } from "@/lib/actions/potential-products";
import { getSuppliers } from "@/lib/actions/suppliers";
import { PotentialProductsGrid } from "@/components/potential-products/potential-products-grid";
import { PotentialProductsTable } from "@/components/potential-products/potential-products-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, X, Grid, Table as TableIcon, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { reloadPath } from "./context";

interface SearchParams {
  search?: string;
  supplierId?: string;
  status?: string;
  view?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function PotentialProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const suppliersResult = await getSuppliers({ status: "all", page: 1, pageSize: "25", sortBy: "createdAt", sortOrder: "desc" });

  const filters = {
    search: params.search,
    supplierId: params.supplierId,
    status: (params.status as any) || "all",
    view: (params.view as any) || "table",
    page: params.page ? parseInt(params.page) : 1,
    pageSize: (params.pageSize || "12") as "12" | "25" | "50",
    sortBy: (params.sortBy as any) || "createdAt",
    sortOrder: (params.sortOrder as any) || "desc",
  };

  const result = await getPotentialProducts(filters);
  const suppliers = suppliersResult.success ? suppliersResult.data?.suppliers || [] : [];
  const potentialProducts = result.success ? result.data?.potentialProducts || [] : [];
  const total = result.success ? result.data?.total || 0 : 0;
  const pages = result.success ? result.data?.pages || 1 : 1;

  const hasFilters = params.search || params.supplierId || params.status !== "all";

  function clearFilters() {
    reloadPath();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212861]">Potential Products</h1>
          <p className="text-[#6B7280]">Research and evaluate products before adding to catalog</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/potential-products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Potential Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            placeholder="Search by name..."
            defaultValue={params.search}
            name="search"
            className="pl-9"
          />
        </div>

        <Select name="status" defaultValue={params.status || "all"}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="RESEARCHING">Researching</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
          </SelectContent>
        </Select>

        <Select name="supplierId" defaultValue={params.supplierId || "all"}>
          <SelectTrigger className="w-[180px]">
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

        {hasFilters && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/dashboard/potential-products">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Link>
          </Button>
        )}

        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            variant={filters.view === "grid" ? "default" : "outline"}
            size="icon"
            asChild
          >
            <Link href={{ pathname: "/dashboard/potential-products", query: { ...params, view: "grid" } }}>
              <LayoutGrid className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            variant={filters.view === "table" ? "default" : "outline"}
            size="icon"
            asChild
          >
            <Link href={{ pathname: "/dashboard/potential-products", query: { ...params, view: "table" } }}>
              <TableIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-[#6B7280]">
        Showing {potentialProducts.length} of {total} potential products
      </p>

      {/* Content */}
      <Suspense fallback={<div className="py-8 text-center text-[#6B7280]">Loading...</div>}>
        {filters.view === "grid" ? (
          <PotentialProductsGrid potentialProducts={potentialProducts} />
        ) : (
          <PotentialProductsTable potentialProducts={potentialProducts} />
        )}
      </Suspense>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {filters.page > 1 && (
            <Button variant="outline" asChild>
              <Link
                href={{
                  pathname: "/dashboard/potential-products",
                  query: { ...params, page: (filters.page - 1).toString() },
                }}
              >
                Previous
              </Link>
            </Button>
          )}

          <span className="text-sm text-[#6B7280]">
            Page {filters.page} of {pages}
          </span>

          {filters.page < pages && (
            <Button variant="outline" asChild>
              <Link
                href={{
                  pathname: "/dashboard/potential-products",
                  query: { ...params, page: (filters.page + 1).toString() },
                }}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
