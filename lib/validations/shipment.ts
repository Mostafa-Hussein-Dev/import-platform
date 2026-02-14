import { z } from "zod";

export const shipmentFormSchema = z.object({
  purchaseOrderId: z.string().cuid("Purchase order is required"),
  shippingCompanyId: z.string().cuid("Shipping company is required"),
  method: z.enum(["sea", "air", "courier"], {
    errorMap: () => ({ message: "Shipping method is required" }),
  }),
  // Accept both string and Date, convert to ISO string in transform
  departureDate: z.union([z.string(), z.date()]).optional().transform((val): string => {
    if (val instanceof Date) {
      return val.toISOString().split("T")[0];
    }
    return val as string;
  }),
  estimatedArrival: z.union([z.string(), z.date()]).optional().transform((val): string => {
    if (val instanceof Date) {
      return val.toISOString().split("T")[0];
    }
    return val as string;
  }),
  trackingNumber: z.string().max(200).optional(),
  totalWeight: z.union([z.string(), z.number()]).optional(),
  totalVolume: z.union([z.string(), z.number()]).optional(),
  // Accept both string and number, convert to number in transform with proper typing
  shippingCost: z.union([z.string(), z.number()]).transform((val): number => {
    return typeof val === "string" ? parseFloat(val) : val;
  }),
  customsDuty: z.union([z.string(), z.number()]).transform((val): number => {
    return typeof val === "string" ? parseFloat(val) : val;
  }),
  otherFees: z.union([z.string(), z.number()]).transform((val): number => {
    return typeof val === "string" ? parseFloat(val) : val;
  }),
  notes: z.string().max(5000).optional(),
})
.refine((data) => {
  if (data.estimatedArrival && data.departureDate) {
    // Both values are now strings from our transform, parse them as dates
    const arrival = new Date(data.estimatedArrival);
    const departure = new Date(data.departureDate);
    return arrival > departure;
  }
  return true;
}, {
  message: "Estimated arrival must be after departure date",
  path: ["estimatedArrival"],
})
.transform((data) => ({
  ...data,
  // Convert cost fields to numbers
  shippingCost: typeof data.shippingCost === "string" ? parseFloat(data.shippingCost) : data.shippingCost,
  customsDuty: typeof data.customsDuty === "string" ? parseFloat(data.customsDuty) : data.customsDuty,
  otherFees: typeof data.otherFees === "string" ? parseFloat(data.otherFees) : data.otherFees,
}));

export type ShipmentFormData = z.infer<typeof shipmentFormSchema>;

export const shipmentFilterSchema = z.object({
  search: z.string().optional(),
  shippingCompanyId: z.string().optional(),
  status: z.enum(["all", "pending", "in_transit", "customs", "delivered"]).default("all"),
  dateFrom: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  page: z.number().int().positive().default(1),
  pageSize: z.enum(["10", "25", "50", "100"]).default("25"),
  sortBy: z.enum(["shipmentNumber", "departureDate", "estimatedArrival", "totalCost", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ShipmentFilterData = z.infer<typeof shipmentFilterSchema>;

export const updateShipmentStatusSchema = z.object({
  status: z.enum(["pending", "in_transit", "customs", "delivered"]),
});
