"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import { getSuppliers } from "@/lib/actions/suppliers";
import type { SupplierFilterData } from "@/lib/validations/supplier";

export default function SuppliersPage() {
  return (
    <Suspense fallback={<SuppliersPageSkeleton />}>
      <SuppliersPageContent />
    </Suspense>
  );
}

function SuppliersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#212861]">Suppliers</h2>
          <p className="text-[#6B7280]">Manage your supplier relationships</p>
        </div>
      </div>
      <div className="text-center py-8 text-[#9CA3AF]">Loading...</div>
    </div>
  );
}

function SuppliersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<{
    suppliers: any[];
    total: number;
    pages: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get filters from URL
  const search = searchParams.get("search") || "";
  const status = (searchParams.get("status") as "all" | "active" | "inactive") || "all";
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

  const fetchSuppliers = () => {
    startTransition(async () => {
      const filters: SupplierFilterData = {
        search: search || undefined,
        status,
        page,
        pageSize: pageSize as "10" | "25" | "50",
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      };

      const result = await getSuppliers(filters);
      if (result.success && result.data) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch suppliers");
      }
    });
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, status, page, pageSize, sortBy, sortOrder]);

  const handleSearch = (value: string) => {
    updateURL({ search: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    updateURL({ status: value, page: 1 });
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
          <h2 className="text-2xl font-bold text-[#212861]">Suppliers</h2>
          <p className="text-[#6B7280]">Manage your supplier relationships</p>
        </div>
        <Button asChild>
          <a href="/dashboard/suppliers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </a>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">{error}</div>
      )}

      {data && (
        <SuppliersTable
          data={data.suppliers}
          currentPage={page}
          totalPages={data.pages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSort={handleSort}
        />
      )}

      {isPending && (
        <div className="text-center py-8 text-[#9CA3AF]">
          Loading suppliers...
        </div>
      )}
    </div>
  );
}
