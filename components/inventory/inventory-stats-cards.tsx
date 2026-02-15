"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes, DollarSign, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface InventoryStatsCardsProps {
  stats: {
    totalProducts: number;
    totalInventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStockUnits: number;
  };
  previousStats?: {
    totalInventoryValue: number;
  };
}

export function InventoryStatsCards({
  stats,
  previousStats,
}: InventoryStatsCardsProps) {
  // Calculate trend
  const valueTrend = previousStats
    ? ((stats.totalInventoryValue - previousStats.totalInventoryValue) /
        previousStats.totalInventoryValue) *
      100
    : 0;

  const cards = [
    {
      title: "Total Inventory Value",
      value: formatCurrency(stats.totalInventoryValue),
      icon: DollarSign,
      color: "text-[#3A9FE1]",
      bgColor: "bg-blue-50",
      trend: valueTrend !== 0 ? `${valueTrend >= 0 ? "+" : ""}${valueTrend.toFixed(1)}%` : undefined,
      trendPositive: valueTrend >= 0,
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toLocaleString(),
      icon: Boxes,
      color: "text-[#212861]",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      alert: stats.lowStockCount > 0,
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount.toString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      alert: stats.outOfStockCount > 0,
    },
    {
      title: "Total Stock Units",
      value: stats.totalStockUnits.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isLast = index === cards.length - 1;
        return (
          <Card key={card.title} className="py-3 gap-1 flex-1">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
              <CardTitle className="text-xs font-medium text-[#6B7280]">
                {card.title}
              </CardTitle>
              <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-[#212861]">{card.value}</div>
                {card.alert && (
                  <Badge variant="destructive" className="text-xs">
                    Alert
                  </Badge>
                )}
              </div>
              {card.trend && (
                <p
                  className={`text-xs mt-1 ${
                    card.trendPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {card.trend} from last period
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
