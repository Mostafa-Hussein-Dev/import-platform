import { Suspense } from "react";
import { getStockMovements } from "@/lib/actions/stock-movements";
import { StockMovementsTable } from "@/components/inventory/stock-movements-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { History, Filter, Download, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: {
    search?: string;
    type?: string;
    reason?: string;
    page?: string;
    pageSize?: string;
  };
}

async function StockMovementsContent({
  searchParams,
}: {
  searchParams: { search?: string; type?: string; page?: string; pageSize?: string };
}) {
  const movementsResult = await getStockMovements({
    search: searchParams.search,
    type: (searchParams.type as any) || "all",
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    pageSize: (searchParams.pageSize as any) || "50",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const movements = movementsResult.success ? movementsResult.data?.movements ?? [] : [];
  const total = movementsResult.success ? movementsResult.data?.total ?? 0 : 0;
  const pages = movementsResult.success ? movementsResult.data?.pages ?? 1 : 1;

  const currentPage = searchParams.page ? parseInt(searchParams.page) : 1;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            name="search"
            placeholder="Search by product name or SKU..."
            defaultValue={searchParams.search}
            className="max-w-sm"
          />
        </div>
        <Select name="type" defaultValue={searchParams.type || "all"}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Movement type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in">Stock In</SelectItem>
            <SelectItem value="out">Stock Out</SelectItem>
            <SelectItem value="adjustment">Adjustments</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button type="button" variant="ghost" asChild>
          <a href="/dashboard/inventory/movements">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </a>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[#212861]">{movements.length}</div>
            <div className="text-xs text-[#6B7280]">Showing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {movements.filter((m) => m.type === "in").reduce((sum, m) => sum + m.quantity, 0)}
            </div>
            <div className="text-xs text-[#6B7280]">Total IN</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {Math.abs(movements.filter((m) => m.type === "out").reduce((sum, m) => sum + m.quantity, 0))}
            </div>
            <div className="text-xs text-[#6B7280]">Total OUT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-[#212861]">{total}</div>
            <div className="text-xs text-[#6B7280]">Total Movements</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Stock Movement History</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {movements.length > 0 ? (
            <StockMovementsTable data={movements} />
          ) : (
            <div className="text-center py-12">
              <p className="text-[#6B7280]">No stock movements recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            asChild={currentPage > 1}
          >
            {currentPage > 1 ? (
              <a href={`/dashboard/inventory/movements?page=${currentPage - 1}&type=${searchParams.type || "all"}&pageSize=${searchParams.pageSize || "50"}`}>
                Previous
              </a>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <span className="text-sm text-[#6B7280]">
            Page {currentPage} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === pages}
            asChild={currentPage < pages}
          >
            {currentPage < pages ? (
              <a href={`/dashboard/inventory/movements?page=${currentPage + 1}&type=${searchParams.type || "all"}&pageSize=${searchParams.pageSize || "50"}`}>
                Next
              </a>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function StockMovementsPage({ searchParams }: PageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212861] flex items-center gap-2">
            <History className="h-6 w-6" />
            Stock Movement History
          </h1>
          <p className="text-[#6B7280] mt-1">View all inventory movements and adjustments</p>
        </div>
      </div>

      {/* Content */}
      <form action="/dashboard/inventory/movements" method="GET">
        <Suspense fallback={<TableSkeleton />}>
          <StockMovementsContent searchParams={searchParams} />
        </Suspense>
      </form>
    </div>
  );
}
