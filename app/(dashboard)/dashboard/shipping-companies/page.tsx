import { getShippingCompanies } from "@/lib/actions/shipping-companies";
import { redirect } from "next/navigation";
import { ShippingCompaniesTable } from "@/components/shipping-companies/shipping-companies-table";
import { Button } from "@/components/ui/button";
import { Ship, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ShippingCompaniesPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; type?: string; status?: string; };
}) {
  const page = parseInt(searchParams.page || "1");
  const pageSize = "25";

  const result = await getShippingCompanies({
    page,
    pageSize,
    search: searchParams.search,
    type: (searchParams.type as any) || "all",
    status: (searchParams.status as any) || "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (!result.success) {
    return (
      <div className="p-8">
        <p className="text-red-600">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#212861]">Shipping Companies</h1>
          <p className="text-[#6B7280]">Manage your shipping logistics partners</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/shipping-companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Shipping Company
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Input
              name="search"
              placeholder="Search companies..."
              defaultValue={searchParams.search}
              className="max-w-xs"
            />
            <Select name="type" defaultValue={searchParams.type || "all"}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sea">Sea Freight</SelectItem>
                <SelectItem value="air">Air Freight</SelectItem>
                <SelectItem value="courier">Courier</SelectItem>
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={searchParams.status || "all"}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <ShippingCompaniesTable data={result.data?.companies || []} />

      {/* Pagination */}
      {result.data && result.data.pages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-[#6B7280]">
            Page {page} of {result.data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams as any);
                params.set("page", String(page - 1));
                redirect(`?${params.toString()}`);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === result.data.pages}
              onClick={() => {
                const params = new URLSearchParams(searchParams as any);
                params.set("page", String(page + 1));
                redirect(`?${params.toString()}`);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
