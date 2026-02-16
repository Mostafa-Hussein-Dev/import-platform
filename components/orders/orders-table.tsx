"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  OrderType,
  OrderStatus,
  PaymentStatus,
  orderStatusInfo,
  paymentStatusInfo,
  orderTypeInfo,
} from "@/types/order";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, X, DollarSign } from "lucide-react";

interface OrdersTableProps {
  orders: Array<{
    id: string;
    orderNumber: string;
    type: OrderType;
    customerName: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: number;
    createdAt: Date;
    itemCount: number;
  }>;
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const getStatusBadge = (status: OrderStatus) => {
    const info = orderStatusInfo[status];
    const colors = {
      gray: "bg-gray-100 text-gray-800 border-gray-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      cyan: "bg-cyan-100 text-cyan-800 border-cyan-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      green: "bg-green-100 text-green-800 border-green-200",
      red: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge variant="outline" className={colors[info.color as keyof typeof colors]}>
        {info.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const info = paymentStatusInfo[status];
    const colors = {
      red: "bg-red-100 text-red-800 border-red-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200",
    };

    return (
      <Badge variant="outline" className={colors[info.color as keyof typeof colors]}>
        {info.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: OrderType) => {
    const info = orderTypeInfo[type];
    const colors = {
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      green: "bg-green-100 text-green-800",
    };

    return (
      <Badge className={colors[info.color as keyof typeof colors]}>
        {info.label}
      </Badge>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#F3F4F6] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F9FAFB]">
            <TableHead>Order Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="cursor-pointer hover:bg-[#F9FAFB]">
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="hover:text-primary"
                >
                  {order.orderNumber}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(order.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{order.customerName}</TableCell>
              <TableCell>{getTypeBadge(order.type)}</TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="font-normal">
                  {order.itemCount}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                ${order.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    {order.status === "pending" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/orders/${order.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {order.paymentStatus !== "paid" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/orders/${order.id}?action=payment`}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Record Payment
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
