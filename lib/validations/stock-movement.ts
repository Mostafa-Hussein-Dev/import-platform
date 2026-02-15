import { z } from "zod";

// Movement types
export const movementTypeEnum = z.enum(["in", "out", "adjustment"]);
export type MovementType = z.infer<typeof movementTypeEnum>;

// Movement reasons
export const movementReasonEnum = z.enum([
  "shipment_received",
  "sale",
  "damage",
  "loss",
  "found",
  "correction",
  "return",
  "other",
]);
export type MovementReason = z.infer<typeof movementReasonEnum>;

// Reference types
export const referenceTypeEnum = z.enum([
  "PurchaseOrder",
  "Shipment",
  "Order",
  "Manual",
]);
export type ReferenceType = z.infer<typeof referenceTypeEnum>;

// Stock movement schema
export const stockMovementSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  type: movementTypeEnum,
  reason: movementReasonEnum,
  quantity: z.number().int().refine((val) => val !== 0, {
    message: "Quantity cannot be zero",
  }),
  referenceType: referenceTypeEnum.optional(),
  referenceId: z.string().optional(),
  landedCost: z.number().nonnegative().optional(),
  unitCost: z.number().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});

export type StockMovementInput = z.infer<typeof stockMovementSchema>;

// Stock adjustment schema (for manual adjustments)
export const stockAdjustmentSchema = z.object({
  productId: z.string().cuid("Please select a product"),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: "Quantity cannot be zero",
  }),
  reason: z.enum([
    "damage",
    "loss",
    "found",
    "correction",
    "return",
    "other",
  ], {
    required_error: "Please select a reason",
  }),
  notes: z.string().min(5, "Please provide a reason (at least 5 characters)").max(1000),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

// Stock movement filter schema
export const stockMovementFilterSchema = z.object({
  search: z.string().optional(),
  productId: z.string().optional(),
  type: z.enum(["all", "in", "out", "adjustment"]).default("all"),
  reason: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.enum(["25", "50", "100"]).default("50"),
  sortBy: z.enum(["createdAt", "quantity", "stockAfter"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type StockMovementFilterData = z.infer<typeof stockMovementFilterSchema>;

// Bulk stock movement schema (for shipment delivery)
export const bulkStockMovementSchema = z.object({
  shipmentId: z.string().cuid("Invalid shipment ID"),
  movements: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive(),
    landedCost: z.number().nonnegative(),
    unitCost: z.number().nonnegative(),
  })),
});

export type BulkStockMovementInput = z.infer<typeof bulkStockMovementSchema>;
