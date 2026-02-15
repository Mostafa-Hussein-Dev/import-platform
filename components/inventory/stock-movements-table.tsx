"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink } from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";

export interface StockMovementInfo {
  id: string;
  type: string;
  reason: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  landedCost: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  notes: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    sku: string;
    images: string[];
  };
}

interface StockMovementsTableProps {
  data: StockMovementInfo[];
  onSort?: (column: string, direction: "asc" | "desc") => void;
}

export function StockMovementsTable({ data, onSort }: StockMovementsTableProps) {
  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case "in":
        return { label: "IN", color: "bg-green-100 text-green-800 hover:bg-green-100" };
      case "out":
        return { label: "OUT", color: "bg-red-100 text-red-800 hover:bg-red-100" };
      case "adjustment":
        return { label: "ADJ", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" };
      default:
        return { label: type.toUpperCase(), color: "bg-gray-100 text-gray-800 hover:bg-gray-100" };
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      shipment_received: "Shipment Received",
      sale: "Sale",
      damage: "Damage",
      loss: "Loss/Theft",
      found: "Found",
      correction: "Correction",
      return: "Return",
      other: "Other",
    };
    return labels[reason] || reason;
  };

  const getReferenceLink = (referenceType: string | null | undefined, referenceId: string | null | undefined) => {
    if (!referenceType || !referenceId) return null;

    switch (referenceType) {
      case "Shipment":
        return `/dashboard/shipments/${referenceId}`;
      case "PurchaseOrder":
        return `/dashboard/purchase-orders/${referenceId}`;
      default:
        return null;
    }
  };

  const columns: ColumnDef<StockMovementInfo>[] = [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
              column.toggleSorting(direction === "asc");
              onSort?.("createdAt", direction);
            }}
            className="h-8 px-2"
          >
            Date
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as Date;
        return (
          <div className="text-center text-sm">
            <div>{new Date(date).toLocaleDateString()}</div>
            <div className="text-[#6B7280] text-xs">
              {formatDistanceToNow(date, { addSuffix: true })}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "product",
      header: () => <div className="text-center">Product</div>,
      cell: ({ row }) => {
        const product = row.original.product;
        return (
          <div className="text-center min-w-0">
            <Link
              href={`/dashboard/products/${product.id}`}
              className="font-medium text-[#212861] hover:text-[#3A9FE1] block truncate"
            >
              {product.name}
            </Link>
            <span className="font-mono text-xs text-[#6B7280]">{product.sku}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: () => <div className="text-center">Type</div>,
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        const typeInfo = getMovementTypeInfo(type);
        return <div className="text-center"><Badge className={typeInfo.color}>{typeInfo.label}</Badge></div>;
      },
    },
    {
      accessorKey: "reason",
      header: () => <div className="text-center">Reason</div>,
      cell: ({ row }) => {
        const reason = row.getValue("reason") as string;
        return <div className="text-center text-sm">{getReasonLabel(reason)}</div>;
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              const direction = column.getIsSorted() === "asc" ? "desc" : "asc";
              column.toggleSorting(direction === "asc");
              onSort?.("quantity", direction);
            }}
            className="h-8 px-2"
          >
            Quantity
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        const isPositive = quantity > 0;
        return (
          <div className="text-center">
            <span
              className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? "+" : ""}{quantity}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "stockBefore",
      header: () => <div className="text-center">Before</div>,
      cell: ({ row }) => <div className="text-center text-sm text-[#6B7280]">{row.getValue("stockBefore")}</div>,
    },
    {
      accessorKey: "stockAfter",
      header: () => <div className="text-center">After</div>,
      cell: ({ row }) => {
        const stockAfter = row.getValue("stockAfter") as number;
        return <div className="text-center font-medium">{stockAfter}</div>;
      },
    },
    {
      accessorKey: "reference",
      header: () => <div className="text-center">Reference</div>,
      cell: ({ row }) => {
        const referenceType = row.original.referenceType;
        const referenceId = row.original.referenceId;
        const link = getReferenceLink(referenceType, referenceId);

        if (link && referenceType) {
          return (
            <div className="text-center">
              <Button variant="ghost" size="sm" asChild className="h-7">
                <Link href={link}>
                  {referenceType === "Shipment" ? "Shipment" : "PO"}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          );
        }
        return <div className="text-center text-sm text-[#9CA3AF]">—</div>;
      },
    },
    {
      accessorKey: "notes",
      header: () => <div className="text-center">Notes</div>,
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string | null;
        if (!notes) return <div className="text-center text-sm text-[#9CA3AF]">—</div>;
        return (
          <div className="text-center">
            <span className="text-sm max-w-[200px] truncate block" title={notes}>
              {notes}
            </span>
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
        <p className="text-[#6B7280]">No stock movements recorded yet</p>
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
                No stock movements found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
