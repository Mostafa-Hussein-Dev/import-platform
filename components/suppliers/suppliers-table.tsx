"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { products: number };
}

interface SuppliersTableProps {
  data: Supplier[];
  currentPage: number;
  totalPages: number;
  pageSize: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: string) => void;
  onSort: (column: string, direction: "asc" | "desc") => void;
}

export function SuppliersTable({
  data,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSort,
}: SuppliersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "companyName",
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
                column.toggleSorting(direction === "asc");
                onSort("companyName", direction);
              }}
              className="h-8 px-2"
            >
              Company Name
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="text-center font-medium">{row.getValue("companyName")}</div>
      ),
    },
    {
      accessorKey: "contactPerson",
      header: () => <div className="text-center">Contact Person</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("contactPerson") || "N/A"}</div>,
    },
    {
      accessorKey: "country",
      header: () => <div className="text-center">Country</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("country")}</div>,
    },
    {
      accessorKey: "email",
      header: () => <div className="text-center">Email</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-sm text-[#6B7280]">
            {row.getValue("email") || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "_count.products",
      header: () => <div className="text-center">Products</div>,
      cell: ({ row }) => <div className="text-center">{row.original._count.products}</div>,
    },
    {
      accessorKey: "isActive",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const isActive = row.getValue("isActive");
        return (
          <div className="text-center">
            <Badge
              className={isActive
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]"
              }
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const supplier = row.original;

        return (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={`/dashboard/suppliers/${supplier.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`/dashboard/suppliers/${supplier.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this supplier?")) {
                      await fetch(`/dashboard/suppliers/${supplier.id}/delete`, {
                        method: "POST",
                      });
                      window.location.reload();
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#F3F4F6] overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#F9FAFB]">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-[#374151]">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-[#F9FAFB]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No suppliers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-[#6B7280]">
            Page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
