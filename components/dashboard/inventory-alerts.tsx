import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
}

interface OutOfStockProduct {
  id: string;
  name: string;
  sku: string;
}

interface InventoryAlertsProps {
  lowStockProducts: LowStockProduct[];
  outOfStockProducts: OutOfStockProduct[];
}

export function InventoryAlerts({
  lowStockProducts,
  outOfStockProducts,
}: InventoryAlertsProps) {
  const hasOutOfStock = outOfStockProducts.length > 0;
  const hasLowStock = lowStockProducts.length > 0;

  if (!hasOutOfStock && !hasLowStock) {
    return (
      <div className="rounded-lg bg-green-50 border-l-4 border-green-500 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold text-green-800">
            All products are well-stocked
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasOutOfStock && (
        <div className="rounded-lg bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">
                {outOfStockProducts.length} product{outOfStockProducts.length !== 1 ? "s are" : " is"} out of stock
              </p>
              <div className="mt-2 space-y-1">
                {outOfStockProducts.slice(0, 3).map((product) => (
                  <Link
                    key={product.id}
                    href={`/dashboard/products/${product.id}`}
                    className="block text-xs text-[#212861] hover:text-[#3A9FE1] transition-colors"
                  >
                    {product.name} ({product.sku})
                  </Link>
                ))}
                {outOfStockProducts.length > 3 && (
                  <p className="text-xs text-red-600">
                    and {outOfStockProducts.length - 3} more
                  </p>
                )}
              </div>
              <Link
                href="/dashboard/inventory?tab=alerts"
                className="inline-block mt-2 text-xs font-medium text-[#3A9FE1] hover:underline"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      )}

      {hasLowStock && (
        <div className="rounded-lg bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-yellow-800">
                {lowStockProducts.length} product{lowStockProducts.length !== 1 ? "s are" : " is"} low on stock
              </p>
              <div className="mt-2 space-y-1">
                {lowStockProducts.slice(0, 3).map((product) => (
                  <Link
                    key={product.id}
                    href={`/dashboard/products/${product.id}`}
                    className="block text-xs text-[#212861] hover:text-[#3A9FE1] transition-colors"
                  >
                    {product.name} ({product.sku}): {product.currentStock} / {product.reorderLevel} units
                  </Link>
                ))}
                {lowStockProducts.length > 3 && (
                  <p className="text-xs text-yellow-600">
                    and {lowStockProducts.length - 3} more
                  </p>
                )}
              </div>
              <Link
                href="/dashboard/inventory?tab=alerts"
                className="inline-block mt-2 text-xs font-medium text-[#3A9FE1] hover:underline"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
