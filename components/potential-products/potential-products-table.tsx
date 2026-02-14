"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { MarginDisplay } from "./margin-display";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { MoreHorizontal, Eye, Edit, Trash2, ShoppingCart, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { DeletePotentialProductDialog } from "./delete-dialog";
import type { PotentialProductStatus } from "@prisma/client";

interface PotentialProductsTableProps {
  potentialProducts: Array<{
    id: string;
    name: string;
    images: string[];
    supplier: { id: string; companyName: string } | null;
    estimatedCost: number | null;
    estimatedPrice: number | null;
    moq: number | null;
    status: PotentialProductStatus;
    createdAt: Date;
  }>;
  onRefresh?: () => void;
}

export function PotentialProductsTable({
  potentialProducts,
  onRefresh,
}: PotentialProductsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: ColumnDef<{
    id: string;
    name: string;
    images: string[];
    supplier: { id: string; companyName: string } | null;
    estimatedCost: number | null;
    estimatedPrice: number | null;
    moq: number | null;
    status: PotentialProductStatus;
    createdAt: Date;
  }>[] = [
    {
      accessorKey: "images",
      header: "",
      cell: ({ row }) => {
        const images = row.getValue("images") as string[];
        const name = row.getValue("name") as string;

        return (
          <div className="w-12 h-12 rounded bg-[#F3F4F6] overflow-hidden flex items-center justify-center">
            {images[0] ? (
              <Image
                src={images[0]}
                alt={name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
                <ImageOff className="h-4 w-4" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const id = row.original.id;

        return (
          <Link
            href={`/dashboard/potential-products/${id}`}
            className="font-medium text-[#212861] hover:text-blue-600 hover:underline"
          >
            {name}
          </Link>
        );
      },
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => {
        const supplier = row.getValue("supplier") as {
          id: string;
          companyName: string;
        } | null;

        if (!supplier) {
          return <span className="text-[#9CA3AF]">—</span>;
        }

        return (
          <Link
            href={`/dashboard/suppliers/${supplier.id}`}
            className="text-[#6B7280] hover:text-[#212861]"
          >
            {supplier.companyName}
          </Link>
        );
      },
    },
    {
      accessorKey: "estimatedCost",
      header: () => <div className="text-center">Est. Cost</div>,
      cell: ({ row }) => {
        const cost = row.getValue("estimatedCost") as number | null;
        return (
          <div className="text-center text-[#6B7280]">
            {cost ? `$${cost.toFixed(2)}` : "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "estimatedPrice",
      header: () => <div className="text-center">Est. Price</div>,
      cell: ({ row }) => {
        const price = row.getValue("estimatedPrice") as number | null;
        return (
          <div className="text-center text-[#6B7280]">
            {price ? `$${price.toFixed(2)}` : "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "margin",
      header: () => <div className="text-center">Margin</div>,
      cell: ({ row }) => {
        const cost = row.getValue("estimatedCost") as number | null;
        const price = row.getValue("estimatedPrice") as number | null;
        return (
          <div className="text-center">
            <MarginDisplay cost={cost} price={price} />
          </div>
        );
      },
    },
    {
      accessorKey: "moq",
      header: () => <div className="text-center">MOQ</div>,
      cell: ({ row }) => {
        const moq = row.getValue("moq") as number | null;
        return (
          <div className="text-center text-[#6B7280]">
            {moq ? moq.toLocaleString() : "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as PotentialProductStatus;
        return <StatusBadge status={status} />;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as Date;
        return (
          <span className="text-sm text-[#6B7280]">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        const canEdit = product.status !== "CONVERTED";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/potential-products/${product.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/potential-products/${product.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              )}
              {product.status === "APPROVED" && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/potential-products/${product.id}`}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Convert to Product
                  </Link>
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => setDeleteId(product.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: potentialProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (potentialProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <h3 className="text-lg font-semibold text-[#212861] mb-2">
          No potential products found
        </h3>
        <p className="text-[#6B7280]">
          Start your product research by adding potential products.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="text-center">
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="text-center">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {deleteId && (
        <DeletePotentialProductDialog
          id={deleteId}
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
