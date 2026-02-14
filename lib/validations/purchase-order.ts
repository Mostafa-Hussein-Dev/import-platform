import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  productId: z.string().cuid("Invalid product"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitCost: z.union([z.string().min(0, "Unit cost is required"), z.number().min(0, "Unit cost is required")]),
}).transform((data) => ({
  ...data,
  unitCost: typeof data.unitCost === "string" ? parseFloat(data.unitCost) : data.unitCost,
}));

export const purchaseOrderFormSchema = z.object({
  supplierId: z.string().cuid("Supplier is required"),
  expectedDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one product is required"),
  shippingEstimate: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(5000).optional(),
}).transform((data) => ({
  ...data,
  shippingEstimate: data.shippingEstimate ? (typeof data.shippingEstimate === "string" ? parseFloat(data.shippingEstimate) : data.shippingEstimate) : undefined,
}));

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderFormSchema>;

export const purchaseOrderFilterSchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.enum(["all", "draft", "sent", "confirmed", "producing", "shipped", "received"]).default("all"),
  paymentStatus: z.enum(["all", "pending", "partial", "paid"]).default("all"),
  dateFrom: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  page: z.number().int().positive().default(1),
  pageSize: z.enum(["10", "25", "50", "100"]).default("25"),
  sortBy: z.enum(["poNumber", "orderDate", "totalCost", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PurchaseOrderFilterData = z.infer<typeof purchaseOrderFilterSchema>;

export const recordPaymentSchema = z.object({
  amount: z.union([z.string().min(0.01, "Amount must be greater than 0"), z.number().min(0.01, "Amount must be greater than 0")]),
  date: z.string().default(() => new Date().toISOString()),
  notes: z.string().max(500).optional(),
}).transform((data) => ({
  ...data,
  amount: typeof data.amount === "string" ? parseFloat(data.amount) : data.amount,
  date: new Date(data.date),
}));

export type RecordPaymentData = z.infer<typeof recordPaymentSchema>;

export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum(["draft", "sent", "confirmed", "producing", "shipped", "received"]),
});
