import { Decimal } from "@prisma/client/runtime/library";

export type OrderType = "online" | "wholesale" | "retail";
export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "partial" | "paid";

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  isWholesale: boolean;
  companyName: string | null;
  shippingAddress: string | null;
  city: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: Decimal;
  shippingFee: Decimal;
  discount: Decimal | null;
  total: Decimal;
  paidAmount: Decimal;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  _count?: {
    items: number;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: Decimal;
  totalPrice: Decimal;
  product?: {
    id: string;
    name: string;
    sku: string;
    images: string[];
    landedCost: Decimal | null;
  };
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

export interface OrderItemWithProduct extends OrderItem {
  product: {
    id: string;
    name: string;
    sku: string;
    images: string[];
    landedCost: Decimal | null;
  };
}

export interface CreateOrderInput {
  type: OrderType;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  isWholesale?: boolean;
  companyName?: string;
  shippingAddress?: string;
  city?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingFee?: number;
  discount?: number;
  notes?: string;
  status?: OrderStatus;
}

export interface UpdateOrderInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  companyName?: string;
  shippingAddress?: string;
  city?: string;
  items?: Array<{
    id?: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingFee?: number;
  discount?: number;
  notes?: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  type: OrderType;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: Decimal;
  createdAt: Date;
  itemCount: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  averageOrderValue: number;
}

export interface OrderPaymentInput {
  amount: number;
  notes?: string;
}

// Status workflow metadata
export const orderStatusInfo: Record<OrderStatus, { label: string; color: string; icon: string; description: string }> = {
  pending: {
    label: "Pending",
    color: "gray",
    icon: "Clock",
    description: "Order is pending confirmation",
  },
  confirmed: {
    label: "Confirmed",
    color: "blue",
    icon: "Check",
    description: "Order confirmed, stock deducted",
  },
  packed: {
    label: "Packed",
    color: "cyan",
    icon: "Package",
    description: "Order is packed and ready",
  },
  shipped: {
    label: "Shipped",
    color: "purple",
    icon: "Truck",
    description: "Order has been shipped",
  },
  delivered: {
    label: "Delivered",
    color: "green",
    icon: "CheckCircle",
    description: "Order has been delivered",
  },
  cancelled: {
    label: "Cancelled",
    color: "red",
    icon: "XCircle",
    description: "Order has been cancelled",
  },
};

export const paymentStatusInfo: Record<PaymentStatus, { label: string; color: string }> = {
  pending: {
    label: "Pending",
    color: "red",
  },
  partial: {
    label: "Partial",
    color: "yellow",
  },
  paid: {
    label: "Paid",
    color: "green",
  },
};

export const orderTypeInfo: Record<OrderType, { label: string; color: string; icon: string }> = {
  online: {
    label: "Online",
    color: "blue",
    icon: "Globe",
  },
  wholesale: {
    label: "Wholesale",
    color: "purple",
    icon: "Building2",
  },
  retail: {
    label: "Retail",
    color: "green",
    icon: "Store",
  },
};
