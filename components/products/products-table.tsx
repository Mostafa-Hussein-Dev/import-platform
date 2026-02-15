"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Eye, Trash2, ImageOff } from "lucide-react";
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
import Image from "next/image";
import { formatCurrency, calculateMargin, getMarginColor } from "@/lib/utils";

interface Product {
  id: string;
  sku: string;
  name: string;
  images: string[];
  retailPrice: any;
  costPrice: any;
  wholesalePrice: any;
  currentStock: number;
  reorderLevel: number;
  status: string;
  createdAt: Date;
  supplier: {
    id: string;
    companyName: string;
  };
}

interface ProductsTableProps {
  data: Product[];
  currentPage: number;
  totalPages: number;
  pageSize: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: string) => void;
  onSort: (column: string, direction: "asc" | "desc") => void;
}

export function ProductsTable({
  data,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSort,
}: ProductsTableProps) {
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "images",
      header: "Image",
      cell: ({ row }) => {
        const images = row.getValue("images") as string[];
        if (images && images.length > 0) {
          return (
            <div className="h-10 w-10 relative rounded overflow-hidden bg-[#F3F4F6] flex items-center justify-center">
              <Image
                src={images[0]}
                alt={row.getValue("name") as string}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          );
        }
        return (
          <div className="h-10 w-10 rounded bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF]">
            <ImageOff className="h-4 w-4" />
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
              column.toggleSorting(direction === "asc");
              onSort("sku", direction);
            }}
            className="h-8 px-2"
          >
            SKU
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("sku")}</span>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
              column.toggleSorting(direction === "asc");
              onSort("name", direction);
            }}
            className="h-8 px-2"
          >
            Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => row.original.supplier.companyName,
    },
    {
      accessorKey: "costPrice",
      header: () => <div className="text-center">Cost</div>,
      cell: ({ row }) => {
        const price = Number(row.getValue("costPrice"));
        return <div className="text-center">{formatCurrency(price)}</div>;
      },
    },
    {
      accessorKey: "wholesalePrice",
      header: () => <div className="text-center">Wholesale</div>,
      cell: ({ row }) => {
        const costPrice = Number(row.getValue("costPrice"));
        const wholesalePrice = Number(row.getValue("wholesalePrice"));
        const margin = calculateMargin(costPrice, wholesalePrice);

        return (
          <div className="text-center">
            <div>{formatCurrency(wholesalePrice)}</div>
            <div className={`text-xs ${getMarginColor(margin)}`}>
              {margin.toFixed(1)}%
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "retailPrice",
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
                column.toggleSorting(direction === "asc");
                onSort("retailPrice", direction);
              }}
              className="h-8 px-2"
            >
              Retail
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const costPrice = Number(row.getValue("costPrice"));
        const retailPrice = Number(row.getValue("retailPrice"));
        const margin = calculateMargin(costPrice, retailPrice);

        return (
          <div className="text-center">
            <div>{formatCurrency(retailPrice)}</div>
            <div className={`text-xs ${getMarginColor(margin)}`}>
              {margin.toFixed(1)}%
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "currentStock",
      header: ({ column }) => {
        return (
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => {
                const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
                column.toggleSorting(direction === "asc");
                onSort("currentStock", direction);
              }}
              className="h-8 px-2"
            >
              Stock
              <ArrowUpDown className="ml-2 h-3 w-3" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const stock = row.getValue("currentStock") as number;
        const reorderLevel = row.original.reorderLevel;
        const isLowStock = stock < reorderLevel;

        return (
          <div className="text-center">
            <span className={isLowStock ? "text-amber-600 font-medium" : ""}>
              {stock}
            </span>
            {isLowStock && (
              <Badge variant="outline" className="ml-2 text-xs">
                Low
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            className={status === "ACTIVE"
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]"
            }
          >
            {status === "ACTIVE" ? "Active" : "Discontinued"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={`/dashboard/products/${product.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/dashboard/products/${product.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this product?")) {
                    await fetch(`/dashboard/products/${product.id}/delete`, {
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
                  No products found.
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
