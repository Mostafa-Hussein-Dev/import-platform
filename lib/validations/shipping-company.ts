import { z } from "zod";

export const shippingCompanyFormSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").max(200),
  type: z.enum(["sea", "air", "courier"], {
    errorMap: () => ({ message: "Shipping type is required" }),
  }),
  contactPerson: z.string().max(200).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  ratePerKg: z.union([z.string(), z.number()]).optional(),
  ratePerCBM: z.union([z.string(), z.number()]).optional(),
  minCharge: z.union([z.string(), z.number()]).optional(),
  transitTime: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
}).transform((data) => ({
  ...data,
  ratePerKg: data.ratePerKg ? (typeof data.ratePerKg === "number" ? data.ratePerKg : parseFloat(data.ratePerKg)) : undefined,
  ratePerCBM: data.ratePerCBM ? (typeof data.ratePerCBM === "number" ? data.ratePerCBM : parseFloat(data.ratePerCBM)) : undefined,
  minCharge: data.minCharge ? (typeof data.minCharge === "number" ? data.minCharge : parseFloat(data.minCharge)) : undefined,
}));

export type ShippingCompanyFormData = z.infer<typeof shippingCompanyFormSchema>;

export const shippingCompanyFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["all", "sea", "air", "courier"]).default("all"),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  page: z.number().int().positive().default(1),
  pageSize: z.enum(["10", "25", "50", "100"]).default("25"),
  sortBy: z.enum(["name", "type", "createdAt", "transitTime"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ShippingCompanyFilterData = z.infer<typeof shippingCompanyFilterSchema>;
