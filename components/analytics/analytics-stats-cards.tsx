"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, TrendingUp, Package, Warehouse, AlertTriangle } from "lucide-react";

interface AnalyticsStatsCardsProps {
  revenue: {
    totalRevenue: number;
    periodRevenue: number;
    ordersCount: number;
    avgOrderValue: number;
    growthRate: number;
  };
  profit: {
    totalProfit: number;
    profitMargin: number;
  };
  inventoryValue: number;
  lowStockCount: number;
  periodLabel: string;
}

export function AnalyticsStatsCards({
  revenue,
  profit,
  inventoryValue,
  lowStockCount,
  periodLabel,
}: AnalyticsStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const stats = [
    {
      title: `${periodLabel} Revenue`,
      value: formatCurrency(revenue.periodRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: revenue.growthRate,
      trendLabel: "vs last period",
    },
    {
      title: "Orders",
      value: revenue.ordersCount.toLocaleString(),
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Avg. Order Value",
      value: formatCurrency(revenue.avgOrderValue),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Profit",
      value: formatCurrency(profit.totalProfit),
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      subtitle: `${profit.profitMargin.toFixed(1)}% margin`,
    },
    {
      title: "Inventory Value",
      value: formatCurrency(inventoryValue),
      icon: Warehouse,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Low Stock Items",
      value: lowStockCount.toLocaleString(),
      icon: AlertTriangle,
      color: lowStockCount > 0 ? "text-red-600" : "text-gray-600",
      bgColor: lowStockCount > 0 ? "bg-red-100" : "bg-gray-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              )}
              {stat.trend !== undefined && (
                <p className="text-xs mt-1">
                  <span
                    className={
                      stat.trend >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
                    }
                  >
                    {formatPercent(stat.trend)}
                  </span>{" "}
                  <span className="text-muted-foreground">{stat.trendLabel}</span>
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
