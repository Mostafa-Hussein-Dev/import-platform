"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  period: "day" | "week" | "month";
}

export function RevenueChart({ data, period }: RevenueChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (period) {
      case "day":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      case "week":
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      case "month":
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      default:
        return dateStr;
    }
  };

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="formattedDate"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: number | undefined, name?: string) => {
                if (value === undefined) return ["", ""];
                if (name === "revenue") {
                  return [`$${value.toLocaleString()}`, "Revenue"];
                }
                return [value, "Orders"];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))" }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--muted-foreground))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
