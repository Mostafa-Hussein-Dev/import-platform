import { z } from "zod";

export const potentialProductFormSchema = z.object({
  name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(200, "Name must be at most 200 characters"),
  description: z.string().max(2000).nullable(),
  supplierId: z.string().cuid().nullable(),
  supplierSku: z.string().max(100).nullable(),
  estimatedCost: z.number().positive().max(999999.99).nullable(),
  estimatedPrice: z.number().positive().max(999999.99).nullable(),
  moq: z.number().int().positive().max(999999).nullable(),
  sourceUrl: z.string().url().nullable(),
  images: z.array(z.string().url()).max(10),
  notes: z.string().max(5000).nullable(),
  category: z.string().max(100).nullable(),
  brand: z.string().max(100).nullable(),
  weightKg: z.number().positive().max(999999.99).nullable(),
  lengthCm: z.number().positive().max(999999.99).nullable(),
  widthCm: z.number().positive().max(999999.99).nullable(),
  heightCm: z.number().positive().max(999999.99).nullable(),
  status: z.enum(["RESEARCHING", "APPROVED", "REJECTED", "CONVERTED"]),
});

export type PotentialProductFormData = z.infer<typeof potentialProductFormSchema>;

export const potentialProductFilterSchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.enum(["all", "RESEARCHING", "APPROVED", "REJECTED", "CONVERTED"]).default("all"),
  view: z.enum(["table", "grid"]).default("grid"),
  page: z.number().int().positive().default(1),
  pageSize: z.enum(["12", "25", "50"]).default("12"),
  sortBy: z.enum(["name", "createdAt", "estimatedCost", "estimatedPrice"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PotentialProductFilterData = z.infer<typeof potentialProductFilterSchema>;

export const convertToProductSchema = z.object({
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  wholesalePrice: z.number().positive("Wholesale price must be positive"),
  warehouseLocation: z.string().optional(),
  currentStock: z.number().int().min(0, "Stock must be 0 or greater").default(0),
  reorderLevel: z.number().int().min(0, "Reorder level must be 0 or greater").default(10),
});

export type ConvertToProductData = z.infer<typeof convertToProductSchema>;
