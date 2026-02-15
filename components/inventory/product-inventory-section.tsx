"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowUpDown, AlertTriangle } from "lucide-react";
import { StockAdjustmentDialog } from "./stock-adjustment-dialog";
import { StockMovementsTable } from "./stock-movements-table";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface ProductInventorySectionProps {
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  landedCost: number | null;
  warehouseLocation: string | null;
  movements: Array<{
    id: string;
    type: string;
    reason: string;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    createdAt: Date;
  }>;
}

export function ProductInventorySection({
  productId,
  productName,
  currentStock,
  reorderLevel,
  landedCost,
  warehouseLocation,
  movements,
}: ProductInventorySectionProps) {
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [movementsDialogOpen, setMovementsDialogOpen] = useState(false);
  const router = useRouter();

  const stockStatus =
    currentStock === 0
      ? { label: "Out of Stock", color: "bg-red-100 text-red-800 hover:bg-red-100" }
      : currentStock <= reorderLevel
        ? { label: "Low Stock", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" }
        : { label: "In Stock", color: "bg-green-100 text-green-800 hover:bg-green-100" };

  const stockNeeded = Math.max(0, reorderLevel - currentStock);
  const totalInventoryValue = landedCost ? landedCost * currentStock : null;

  // Get last movement
  const lastMovement = movements[0];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Inventory Information</CardTitle>
        <div className="flex gap-2">
          <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Adjust Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adjust Stock</DialogTitle>
                <DialogDescription>Modify stock levels for {productName}</DialogDescription>
              </DialogHeader>
              <StockAdjustmentDialog
                open={adjustDialogOpen}
                onOpenChange={setAdjustDialogOpen}
                product={{
                  id: productId,
                  name: productName,
                  sku: "",
                  currentStock,
                  reorderLevel,
                }}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/inventory/movements?search=${productName}`}>
              View History
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stock Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Current Stock</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-[#212861]">{currentStock}</span>
              <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
            </div>
          </div>
          {stockNeeded > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#6B7280]">Stock Needed</p>
              <p className="text-lg font-semibold text-red-600">{stockNeeded} units</p>
            </div>
          )}
        </div>

        {/* Inventory Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#F3F4F6]">
          <div>
            <p className="text-xs text-[#6B7280]">Reorder Level</p>
            <p className="font-medium">{reorderLevel} units</p>
          </div>
          {warehouseLocation && (
            <div>
              <p className="text-xs text-[#6B7280]">Warehouse Location</p>
              <p className="font-medium">{warehouseLocation}</p>
            </div>
          )}
          {landedCost && (
            <>
              <div>
                <p className="text-xs text-[#6B7280]">Landed Cost</p>
                <p className="font-medium">{formatCurrency(landedCost)} / unit</p>
              </div>
              {totalInventoryValue !== null && (
                <div>
                  <p className="text-xs text-[#6B7280]">Inventory Value</p>
                  <p className="font-medium">{formatCurrency(totalInventoryValue)}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Last Movement */}
        {lastMovement && (
          <div className="pt-3 border-t border-[#F3F4F6]">
            <p className="text-xs text-[#6B7280] mb-1">Last Movement</p>
            <div className="flex items-center gap-2 text-sm">
              <Badge
                className={
                  lastMovement.type === "in"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {lastMovement.type.toUpperCase()}
              </Badge>
              <span>
                {lastMovement.quantity > 0 ? "+" : ""}
                {lastMovement.quantity} units
              </span>
              <span className="text-[#6B7280]">•</span>
              <span className="text-[#6B7280]">
                {new Date(lastMovement.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Stock Movement Preview */}
        {movements.length > 0 && (
          <div className="pt-3 border-t border-[#F3F4F6]">
            <Dialog open={movementsDialogOpen} onOpenChange={setMovementsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="text-sm text-[#6B7280]">Recent Stock Movements ({movements.length})</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Stock Movement History</DialogTitle>
                  <DialogDescription>All inventory movements for {productName}</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto">
                  <StockMovementsTable
                    data={movements.map((m) => ({
                      ...m,
                      product: { id: productId, name: productName, sku: "", images: [] },
                      referenceType: null,
                      referenceId: null,
                      landedCost: null,
                      notes: null,
                    }))}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
