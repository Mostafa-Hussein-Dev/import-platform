import { z } from "zod";

export const productFormSchema = z.object({
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().max(2000).optional().or(z.literal("")),
  supplierId: z.string().cuid("Please select a supplier"),
  supplierSku: z.string().optional(),
  costPrice: z.number().positive("Cost price must be positive"),
  wholesalePrice: z.number().positive("Wholesale price must be positive"),
  retailPrice: z.number().positive("Retail price must be positive"),
  currentStock: z.number().int().nonnegative(),
  reorderLevel: z.number().int().positive(),
  moq: z.number().int().positive().optional(),
  landedCost: z.number().nonnegative().optional(),
  category: z.string().max(100).optional().or(z.literal("")),
  brand: z.string().max(100).optional().or(z.literal("")),
  weightKg: z.number().positive().optional(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  images: z.array(z.string().url()),
  warehouseLocation: z.string().max(200).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "DISCONTINUED"]),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export const productFilterSchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["all", "ACTIVE", "DISCONTINUED"]).default("all"),
  view: z.enum(["table", "grid"]).default("table"),
  page: z.number().int().positive().default(1),
  pageSize: z.enum(["10", "25", "50"]).default("25"),
  sortBy: z.enum(["name", "sku", "createdAt", "retailPrice", "currentStock"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductFilterData = z.infer<typeof productFilterSchema>;
