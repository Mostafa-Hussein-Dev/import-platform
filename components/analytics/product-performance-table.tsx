"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface ProductPerformance {
  productId: string;
  productName: string;
  productSku: string;
  productImage: string | null;
  unitsSold: number;
  revenue: number;
  profit: number;
  avgPrice?: number;
}

interface ProductPerformanceTableProps {
  title: string;
  products: ProductPerformance[];
  showProfit?: boolean;
  showAvgPrice?: boolean;
  emptyMessage?: string;
}

export function ProductPerformanceTable({
  title,
  products,
  showProfit = true,
  showAvgPrice = false,
  emptyMessage = "No products yet",
}: ProductPerformanceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{emptyMessage}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Units Sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              {showAvgPrice && (
                <TableHead className="text-right">Avg. Price</TableHead>
              )}
              {showProfit && (
                <TableHead className="text-right">Profit</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={product.productId}>
                <TableCell>
                  <Link
                    href={`/dashboard/products/${product.productId}`}
                    className="flex items-center gap-3 hover:text-primary"
                  >
                    {product.productImage ? (
                      <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={product.productImage}
                          alt={product.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.productSku}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {product.unitsSold.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(product.revenue)}
                </TableCell>
                {showAvgPrice && (
                  <TableCell className="text-right">
                    {formatCurrency(product.avgPrice || 0)}
                  </TableCell>
                )}
                {showProfit && (
                  <TableCell className="text-right">
                    <Badge
                      variant={product.profit >= 0 ? "default" : "destructive"}
                      className="font-semibold"
                    >
                      {formatCurrency(product.profit)}
                    </Badge>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface ProductPerformanceGridProps {
  bestSellers: ProductPerformance[];
  topRevenue: ProductPerformance[];
  topProfit: ProductPerformance[];
}

export function ProductPerformanceGrid({
  bestSellers,
  topRevenue,
  topProfit,
}: ProductPerformanceGridProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <ProductPerformanceTable
        title="Best Sellers"
        products={bestSellers}
        showProfit={false}
        emptyMessage="No sales data yet"
      />
      <ProductPerformanceTable
        title="Top Revenue"
        products={topRevenue}
        showProfit={false}
        showAvgPrice={true}
        emptyMessage="No sales data yet"
      />
      <ProductPerformanceTable
        title="Top Profit"
        products={topProfit}
        showProfit={true}
        emptyMessage="No sales data yet"
      />
    </div>
  );
}
