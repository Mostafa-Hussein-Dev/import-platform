"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Edit, Eye, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export interface ProductStockInfo {
  id: string;
  sku: string;
  name: string;
  images: string[];
  supplier: {
    id: string;
    companyName: string;
  };
  currentStock: number;
  reorderLevel: number;
  landedCost?: number | null;
  maxLandedCost?: number | null;
  category?: string | null;
  warehouseLocation?: string | null;
  status?: string;
  lastMovement?: {
    createdAt: Date;
    type: string;
    quantity: number;
  } | null;
}

interface CurrentStockTableProps {
  data: ProductStockInfo[];
  onSort?: (column: string, direction: "asc" | "desc") => void;
}

export function CurrentStockTable({ data, onSort }: CurrentStockTableProps) {
  const getStockStatus = (stock: number, reorderLevel: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800 hover:bg-red-100" };
    if (stock <= reorderLevel) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" };
    return { label: "In Stock", color: "bg-green-100 text-green-800 hover:bg-green-100" };
  };

  const columns: ColumnDef<ProductStockInfo>[] = [
    {
      accessorKey: "images",
      header: () => <div className="text-center">Image</div>,
      cell: ({ row }) => {
        const images = row.getValue("images") as string[];
        const name = row.getValue("name") as string;
        if (images && images.length > 0) {
          return (
            <div className="flex justify-center">
              <div className="h-10 w-10 relative rounded overflow-hidden bg-[#F3F4F6] flex items-center justify-center">
                <Image
                  src={images[0]}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            </div>
          );
        }
        return (
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF]">
              <ImageOff className="h-4 w-4" />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
              column.toggleSorting(direction === "asc");
              onSort?.("sku", direction);
            }}
            className="h-8 px-2"
          >
            SKU
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => <div className="text-center font-mono text-sm">{row.getValue("sku")}</div>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
              column.toggleSorting(direction === "asc");
              onSort?.("name", direction);
            }}
            className="h-8 px-2"
          >
            Product
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium max-w-[200px] truncate">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "supplier",
      header: () => <div className="text-center">Supplier</div>,
      cell: ({ row }) => {
        const supplier = row.original.supplier;
        return (
          <div className="text-center">
            <Link
              href={`/dashboard/suppliers/${supplier.id}`}
              className="text-[#3A9FE1] hover:underline text-sm"
            >
              {supplier.companyName}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "currentStock",
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
              column.toggleSorting(direction === "asc");
              onSort?.("currentStock", direction);
            }}
            className="h-8 px-2"
          >
            Stock
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const stock = row.getValue("currentStock") as number;
        const reorderLevel = row.getValue("reorderLevel") as number;
        const status = getStockStatus(stock, reorderLevel);
        return (
          <div className="text-center flex items-center justify-center gap-2">
            <span className="font-medium">{stock}</span>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "reorderLevel",
      header: () => <div className="text-center">Reorder Level</div>,
      cell: ({ row }) => <div className="text-center text-sm">{row.getValue("reorderLevel")}</div>,
    },
    {
      accessorKey: "landedCost",
      header: () => <div className="text-center">Landed Cost</div>,
      cell: ({ row }) => {
        const cost = row.getValue("landedCost") as number | null;
        const maxCost = row.original.maxLandedCost as number | null;
        return (
          <div className="text-center">
            {cost !== null ? (
              <div>
                <span className="text-sm">{formatCurrency(cost)}</span>
                {maxCost !== null && maxCost > cost && (
                  <div className="text-xs text-[#6B7280]">(max: {formatCurrency(maxCost)})</div>
                )}
              </div>
            ) : (
              <span className="text-sm text-[#9CA3AF]">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalValue",
      header: () => <div className="text-center">Total Value</div>,
      cell: ({ row }) => {
        const stock = row.getValue("currentStock") as number;
        const landedCost = row.getValue("landedCost") as number | null;
        return (
          <div className="text-center">
            {landedCost !== null ? (
              <span className="font-medium">{formatCurrency(stock * landedCost)}</span>
            ) : (
              <span className="text-sm text-[#9CA3AF]">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "warehouseLocation",
      header: () => <div className="text-center">Location</div>,
      cell: ({ row }) => {
        const location = row.getValue("warehouseLocation") as string | null;
        return (
          <div className="text-center">
            {location ? (
              <span className="text-sm">{location}</span>
            ) : (
              <span className="text-sm text-[#9CA3AF]">—</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const productId = row.original.id;
        return (
          <div className="flex items-center justify-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/dashboard/products/${productId}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/dashboard/products/${productId}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6B7280]">No products found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#F3F4F6] overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-[#F9FAFB]">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="font-semibold text-[#374151]">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
