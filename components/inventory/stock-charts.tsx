"use client";

import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface StockChartsProps {
  stockValueByCategory: Array<{ category: string; value: number }>;
  stockMovementsTrend: Array<{ date: string; in: number; out: number }>;
  topProductsByValue: Array<{ productId: string; name: string; sku: string; value: number }>;
}

const COLORS = ["#3A9FE1", "#212861", "#8B5CF6", "#10B981", "#F59E0B"];

const customTooltipStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  border: "none",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "500",
};

export function StockCharts({
  stockValueByCategory,
  stockMovementsTrend,
  topProductsByValue,
}: StockChartsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Row 1: Pie Chart + Bar Chart side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stock Value by Category - Pie Chart */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#212861]">
              Stock Value by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stockValueByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stockValueByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => {
                      const percent = (entry.percent * 100).toFixed(0);
                      return percent !== "0" ? `${percent}%` : "";
                    }}
                    outerRadius={90}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="category"
                    paddingAngle={2}
                  >
                    {stockValueByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value !== undefined ? formatCurrency(value) : ""
                    }
                    contentStyle={customTooltipStyle}
                  />
                  <Legend
                    iconType="circle"
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-[#9CA3AF]">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products by Value */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#212861]">
              Top Products by Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsByValue.length > 0 ? (
              <div className="space-y-3 h-[250px] overflow-y-auto scrollbar-hide">
                {(() => {
                  const maxValue = Math.max(...topProductsByValue.map((p) => p.value));
                  return topProductsByValue.map((product) => (
                    <div key={product.productId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Link
                          href={`/dashboard/products/${product.productId}`}
                          className="font-medium text-[#3A9FE1] hover:text-[#2E8FD1] hover:underline transition-colors"
                        >
                          {product.sku}
                        </Link>
                        <span className="text-[#6B7280] font-medium">{formatCurrency(product.value)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#3A9FE1] to-[#212861]"
                          style={{ width: `${(product.value / maxValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-[#9CA3AF]">
                No products in inventory
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Stock Movements Trend - full width, grows to fill remaining space */}
      <Card className="shadow-sm hover:shadow-md transition-shadow flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#212861]">
            Stock Movements Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {stockMovementsTrend.some((d) => d.in > 0 || d.out > 0) ? (
            <ResponsiveContainer width="100%" height="100%" minHeight={220}>
              <AreaChart data={stockMovementsTrend}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  labelFormatter={(label) => formatFullDate(label as string)}
                  contentStyle={customTooltipStyle}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "13px" }}
                />
                <Area
                  type="monotone"
                  dataKey="in"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  strokeDasharray=""
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  fillOpacity={1}
                  fill="url(#colorIn)"
                  name="Stock IN"
                />
                <Area
                  type="monotone"
                  dataKey="out"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  fillOpacity={1}
                  fill="url(#colorOut)"
                  name="Stock OUT"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[220px] text-[#9CA3AF]">
              No movements in last 30 days
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
