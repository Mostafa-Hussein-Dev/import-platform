"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface SalesByTypeChartProps {
  data: {
    online: { revenue: number; count: number; percentage: number };
    wholesale: { revenue: number; count: number; percentage: number };
    retail: { revenue: number; count: number; percentage: number };
  };
}

const COLORS = {
  online: "#3b82f6", // blue
  wholesale: "#a855f7", // purple
  retail: "#22c55e", // green
};

export function SalesByTypeChart({ data }: SalesByTypeChartProps) {
  const chartData = [
    {
      name: "Online",
      value: data.online.revenue,
      count: data.online.count,
      percentage: data.online.percentage,
      color: COLORS.online,
    },
    {
      name: "Wholesale",
      value: data.wholesale.revenue,
      count: data.wholesale.count,
      percentage: data.wholesale.percentage,
      color: COLORS.wholesale,
    },
    {
      name: "Retail",
      value: data.retail.revenue,
      count: data.retail.count,
      percentage: data.retail.percentage,
      color: COLORS.retail,
    },
  ].filter((item) => item.value > 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">Revenue: {formatCurrency(data.value)}</p>
          <p className="text-sm">Orders: {data.count}</p>
          <p className="text-sm">{data.percentage.toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No sales data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total for percentage
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${((value / totalValue) * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry: any) => {
                const data = entry.payload;
                return `${value}: ${formatCurrency(data.value)}`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Detailed breakdown */}
        <div className="mt-6 space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">{formatCurrency(item.value)}</p>
                <p className="text-muted-foreground">{item.count} orders</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
