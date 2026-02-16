"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Package } from "lucide-react";

interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string | null;
  availableStock: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderItemsTableProps {
  items: OrderItem[];
  onChange: (items: OrderItem[]) => void;
  editable?: boolean;
  orderType?: "online" | "wholesale" | "retail";
}

export function OrderItemsTable({
  items,
  onChange,
  editable = true,
  orderType = "retail",
}: OrderItemsTableProps) {
  const updateItem = (index: number, field: keyof OrderItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total
    if (field === "quantity" || field === "unitPrice") {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }

    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const getStockWarning = (item: OrderItem) => {
    if (item.quantity > item.availableStock) {
      return (
        <Badge variant="destructive" className="text-xs">
          Only {item.availableStock} available
        </Badge>
      );
    }
    if (item.quantity >= item.availableStock * 0.8) {
      return (
        <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
          Low stock
        </Badge>
      );
    }
    return null;
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/20">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No products added yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add products to create this order
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
              <th className="px-4 py-3 text-center text-sm font-medium">Available Stock</th>
              <th className="px-4 py-3 text-center text-sm font-medium">Quantity</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Unit Price</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
              {editable && <th className="px-4 py-3 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-muted/30">
                {/* Product */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.productImage ? (
                      <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>
                      {editable && getStockWarning(item)}
                    </div>
                  </div>
                </td>

                {/* Available Stock */}
                <td className="px-4 py-3 text-center">
                  <Badge variant={item.availableStock > 10 ? "outline" : "destructive"}>
                    {item.availableStock}
                  </Badge>
                </td>

                {/* Quantity */}
                <td className="px-4 py-3">
                  {editable ? (
                    <div className="max-w-[100px] mx-auto">
                      <Input
                        type="number"
                        min="1"
                        max={item.availableStock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            Math.max(1, Math.min(item.availableStock, parseInt(e.target.value) || 1))
                          )
                        }
                        className="text-center"
                      />
                    </div>
                  ) : (
                    <div className="text-center font-medium">{item.quantity}</div>
                  )}
                </td>

                {/* Unit Price */}
                <td className="px-4 py-3">
                  {editable ? (
                    <div className="max-w-[120px] ml-auto">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          className="pl-7 text-right"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-right font-medium">
                      ${item.unitPrice.toFixed(2)}
                    </div>
                  )}
                </td>

                {/* Total */}
                <td className="px-4 py-3 text-right font-semibold">
                  ${item.totalPrice.toFixed(2)}
                </td>

                {/* Remove */}
                {editable && (
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subtotal */}
      <div className="flex justify-end">
        <div className="text-right">
          <Label className="text-muted-foreground">Subtotal</Label>
          <p className="text-2xl font-bold">${subtotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
