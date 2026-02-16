"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, TrendingUp } from "lucide-react";

interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalSpent: number;
  revenueGenerated: number;
  productsCount: number;
  ordersCount: number;
  avgProductCost: number;
}

interface SupplierPerformanceTableProps {
  suppliers: SupplierPerformance[];
}

export function SupplierPerformanceTable({
  suppliers,
}: SupplierPerformanceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const calculateROI = (spent: number, generated: number) => {
    if (spent === 0) return 0;
    return ((generated - spent) / spent) * 100;
  };

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supplier Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No supplier data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Revenue Generated</TableHead>
              <TableHead className="text-right">ROI</TableHead>
              <TableHead className="text-center">Products</TableHead>
              <TableHead className="text-center">POs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => {
              const roi = calculateROI(supplier.totalSpent, supplier.revenueGenerated);
              return (
                <TableRow key={supplier.supplierId}>
                  <TableCell>
                    <Link
                      href={`/dashboard/suppliers/${supplier.supplierId}`}
                      className="font-medium hover:text-primary"
                    >
                      {supplier.supplierName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(supplier.totalSpent)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(supplier.revenueGenerated)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        roi >= 0
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {roi >= 0 ? "+" : ""}
                      {roi.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{supplier.productsCount}</TableCell>
                  <TableCell className="text-center">{supplier.ordersCount}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
