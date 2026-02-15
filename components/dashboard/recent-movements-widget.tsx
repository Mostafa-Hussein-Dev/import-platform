import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface StockMovement {
  id: string;
  type: string;
  reason: string;
  quantity: number;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

interface RecentMovementsWidgetProps {
  movements: StockMovement[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTypeBadge(type: string) {
  switch (type) {
    case "in":
      return <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] px-2 py-0.5">IN</Badge>;
    case "out":
      return <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px] px-2 py-0.5">OUT</Badge>;
    default:
      return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white text-[10px] px-2 py-0.5">ADJ</Badge>;
  }
}

export function RecentMovementsWidget({ movements }: RecentMovementsWidgetProps) {
  if (movements.length === 0) {
    return (
      <p className="text-sm text-[#9CA3AF] text-center py-4">
        No stock movements yet
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F3F4F6]">
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] py-2 pr-3">Time</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] py-2 pr-3">Product</th>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] py-2 pr-3">Type</th>
              <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] py-2">Qty</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                <td className="py-2.5 pr-3 text-xs text-[#6B7280] whitespace-nowrap">
                  {formatRelativeTime(movement.createdAt)}
                </td>
                <td className="py-2.5 pr-3">
                  <Link
                    href={`/dashboard/products/${movement.product.id}`}
                    className="text-sm font-medium text-[#212861] hover:text-[#3A9FE1] transition-colors"
                  >
                    {movement.product.name}
                  </Link>
                  <p className="text-[10px] text-[#9CA3AF]">{movement.product.sku}</p>
                </td>
                <td className="py-2.5 pr-3">
                  {getTypeBadge(movement.type)}
                </td>
                <td className="py-2.5 text-right">
                  <span className={`text-sm font-semibold ${movement.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                    {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-right">
        <Link
          href="/dashboard/inventory?tab=movements"
          className="text-sm font-semibold text-[#3A9FE1] hover:text-[#2E8FD1] transition-colors"
        >
          View All Movements
        </Link>
      </div>
    </div>
  );
}
