import { z } from "zod";

// Order types
export const orderTypeEnum = z.enum(["online", "wholesale", "retail"]);
export type OrderType = z.infer<typeof orderTypeEnum>;

// Order status
export const orderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

// Payment status
export const paymentStatusEnum = z.enum(["pending", "partial", "paid"]);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

// Order item schema
export const orderItemSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;

// Order form schema
export const orderFormSchema = z.object({
  type: orderTypeEnum,
  customerName: z.string().min(2, "Customer name must be at least 2 characters").max(200),
  customerPhone: z.string().max(50).optional(),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  isWholesale: z.boolean().optional(),
  companyName: z.string().max(200).optional(),
  shippingAddress: z.string().max(1000).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  shippingFee: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
}).refine(
  (data) => {
    // If wholesale, company name is required
    if (data.isWholesale || data.type === "wholesale") {
      return !!data.companyName && data.companyName.trim().length > 0;
    }
    return true;
  },
  {
    message: "Company name is required for wholesale orders",
    path: ["companyName"],
  }
);

export type OrderFormData = z.infer<typeof orderFormSchema>;

// Order filter schema
export const orderFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["all", "online", "wholesale", "retail"]).default("all"),
  status: z.enum(["all", "pending", "confirmed", "packed", "shipped", "delivered", "cancelled"]).default("all"),
  paymentStatus: z.enum(["all", "pending", "partial", "paid"]).default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.enum(["25", "50", "100"]).default("25"),
  sortBy: z.enum(["createdAt", "orderNumber", "total", "customerName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type OrderFilterData = z.infer<typeof orderFilterSchema>;

// Payment recording schema
export const paymentRecordSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type PaymentRecordInput = z.infer<typeof paymentRecordSchema>;

// Order status update schema
export const orderStatusUpdateSchema = z.object({
  status: orderStatusEnum,
  reason: z.string().max(500).optional(),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

// Status transition rules
export const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// Helper to validate status transition
export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  return statusTransitions[currentStatus].includes(newStatus);
}
