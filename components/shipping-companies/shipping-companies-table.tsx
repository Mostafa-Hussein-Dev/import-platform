"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Edit, Eye, Trash2, Ship } from "lucide-react";
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
import Link from "next/link";

interface ShippingCompany {
  id: string;
  name: string;
  type: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  ratePerKg: number | null;
  ratePerCBM: number | null;
  minCharge: number | null;
  transitTime: string | null;
  isActive: boolean;
  _count: { shipments: number };
}

interface ShippingCompaniesTableProps {
  data: ShippingCompany[];
  onRefresh?: () => void;
}

const typeColors = {
  sea: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  air: "bg-green-100 text-green-700 hover:bg-green-100",
  courier: "bg-purple-100 text-purple-700 hover:bg-purple-100",
};

export function ShippingCompaniesTable({ data, onRefresh }: ShippingCompaniesTableProps) {
  const columns: ColumnDef<ShippingCompany>[] = [
    {
      accessorKey: "name",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge className={typeColors[type as keyof typeof typeColors]}>
            {type.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "contactPerson",
      header: "Contact Person",
      cell: ({ row }) => row.getValue("contactPerson") || "—",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-[#6B7280]">
          {row.getValue("email") || "—"}
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.getValue("phone") || "—",
    },
    {
      accessorKey: "ratePerKg",
      header: "Rate per Kg",
      cell: ({ row }) => {
        const rate = row.getValue("ratePerKg") as number | null;
        return <div className="text-center">{rate ? `$${rate.toFixed(2)}` : "—"}</div>;
      },
    },
    {
      accessorKey: "ratePerCBM",
      header: "Rate per CBM",
      cell: ({ row }) => {
        const rate = row.getValue("ratePerCBM") as number | null;
        return <div className="text-center">{rate ? `$${rate.toFixed(2)}` : "—"}</div>;
      },
    },
    {
      accessorKey: "transitTime",
      header: "Transit Time",
      cell: ({ row }) => row.getValue("transitTime") || "—",
    },
    {
      accessorKey: "_count.shipments",
      header: "Shipments",
      cell: ({ row }) => row.original._count.shipments,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge
            className={isActive
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const company = row.original;

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
                <Link href={`/dashboard/shipping-companies/${company.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/shipping-companies/${company.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this shipping company?")) {
                    await fetch(`/dashboard/shipping-companies/${company.id}/delete`, {
                      method: "POST",
                    });
                    onRefresh?.();
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
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
          <Ship className="h-8 w-8 text-[#9CA3AF]" />
        </div>
        <h3 className="text-lg font-semibold text-[#212861] mb-2">
          No shipping companies found
        </h3>
        <p className="text-[#6B7280]">
          Add shipping companies to track logistics costs and manage shipments.
        </p>
      </div>
    );
  }

  return (
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="text-center">
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
                className="h-24 text-center align-middle"
              >
                No shipping companies found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
