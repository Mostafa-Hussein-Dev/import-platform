import { z } from "zod";

export const supplierFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  contactPerson: z.string().min(2).optional(),
  country: z.string().min(2, "Country is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  wechat: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  paymentTerms: z.string().max(500).optional(),
  leadTime: z.string().max(200).optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean(),
});

export type SupplierFormData = z.infer<typeof supplierFormSchema>;

export const supplierFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  page: z.number().int().positive().default(1),
  pageSize: z.enum(["10", "25", "50", "100"]).default("25"),
  sortBy: z.enum(["companyName", "createdAt", "contactPerson", "country"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SupplierFilterData = z.infer<typeof supplierFilterSchema>;
