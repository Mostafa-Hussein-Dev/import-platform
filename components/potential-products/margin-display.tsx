import { cn } from "@/lib/utils";

interface MarginDisplayProps {
  cost: number | null;
  price: number | null;
  className?: string;
}

export function MarginDisplay({ cost, price, className }: MarginDisplayProps) {
  if (!cost || !price) {
    return <span className={cn("text-[#9CA3AF]", className)}>—</span>;
  }

  const margin = ((price - cost) / cost) * 100;
  const profit = price - cost;

  return (
    <span
      className={cn(
        "font-medium",
        margin > 0
          ? "text-emerald-600"
          : margin < 0
            ? "text-red-600"
            : "text-[#6B7280]",
        className
      )}
    >
      {margin > 0 ? "+" : ""}
      {margin.toFixed(1)}%
    </span>
  );
}

export function MarginDetail({ cost, price, moq }: { cost: number | null; price: number | null; moq: number | null }) {
  if (!cost || !price) {
    return null;
  }

  const margin = ((price - cost) / cost) * 100;
  const profit = price - cost;
  const totalInvestment = moq ? cost * moq : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#6B7280]">Estimated Margin:</span>
        <span
          className={`font-bold text-lg ${
            margin > 0 ? "text-emerald-600" : margin < 0 ? "text-red-600" : "text-[#6B7280]"
          }`}
        >
          {margin > 0 ? "+" : ""}
          {margin.toFixed(1)}% ({profit.toFixed(2)} profit per unit)
        </span>
      </div>
      {totalInvestment && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6B7280]">Total Investment (MOQ):</span>
          <span className="font-semibold text-[#212861]">
            ${totalInvestment.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
