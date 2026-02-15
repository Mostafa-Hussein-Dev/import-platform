"use server";

import { prisma } from "@/lib";
import { revalidatePath } from "next/cache";
import { productFormSchema, productFilterSchema } from "@/lib/validations/product";
import type { ProductFormData, ProductFilterData } from "@/lib/validations/product";
import type { Prisma } from "@prisma/client";

export type ProductActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getProducts(filters?: ProductFilterData): Promise<ProductActionResult<{
  products: Array<{
    id: string;
    sku: string;
    name: string;
    images: string[];
    retailPrice: number;
    costPrice: number;
    wholesalePrice: number;
    currentStock: number;
    reorderLevel: number;
    moq: number | null;
    landedCost: number | null;
    maxLandedCost: number | null;
    warehouseLocation: string | null;
    status: string;
    createdAt: Date;
    supplier: {
      id: string;
      companyName: string;
    };
  }>;
  total: number;
  pages: number;
}>> {
  try {
    const validatedFilters = productFilterSchema.parse(filters || {});

    const { search, supplierId, category, status, page, pageSize, sortBy, sortOrder } = validatedFilters;
    const pageNum = typeof page === "string" ? parseInt(page) : page;
    const pageSizeNum = typeof pageSize === "string" ? parseInt(pageSize) : parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" };
    }

    if (status !== "all") {
      where.status = status;
    }

    const [productsRaw, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const pages = Math.ceil(total / pageSizeNum);

    // Get max landed cost for each product from stock movements
    const productIds = productsRaw.map(p => p.id);
    const maxLandedCosts = await prisma.stockMovement.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        landedCost: { not: null },
      },
      _max: {
        landedCost: true,
      },
    });

    const maxLandedCostMap = new Map(
      maxLandedCosts.map(m => [m.productId, m._max.landedCost ? Number(m._max.landedCost) : null])
    );

    // Convert Decimal to Number for serialization
    const products = productsRaw.map(p => ({
      ...p,
      retailPrice: Number(p.retailPrice),
      costPrice: Number(p.costPrice),
      wholesalePrice: Number(p.wholesalePrice),
      landedCost: p.landedCost ? Number(p.landedCost) : null,
      maxLandedCost: maxLandedCostMap.get(p.id) ?? null,
      weightKg: p.weightKg ? Number(p.weightKg) : null,
      lengthCm: p.lengthCm ? Number(p.lengthCm) : null,
      widthCm: p.widthCm ? Number(p.widthCm) : null,
      heightCm: p.heightCm ? Number(p.heightCm) : null,
    }));

    return { success: true, data: { products, total, pages } };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function getProduct(id: string): Promise<ProductActionResult<{
  id: string;
  sku: string;
  name: string;
  description: string | null;
  supplierId: string;
  supplierSku: string | null;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  currentStock: number;
  reorderLevel: number;
  moq: number | null;
  landedCost: number | null;
  category: string | null;
  brand: string | null;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  images: string[];
  warehouseLocation: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  supplier: {
    id: string;
    companyName: string;
  };
}>> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Convert Decimal to Number for serialization
    const serializedProduct = {
      ...product,
      costPrice: Number(product.costPrice),
      wholesalePrice: Number(product.wholesalePrice),
      retailPrice: Number(product.retailPrice),
      landedCost: product.landedCost ? Number(product.landedCost) : null,
      weightKg: product.weightKg ? Number(product.weightKg) : null,
      lengthCm: product.lengthCm ? Number(product.lengthCm) : null,
      widthCm: product.widthCm ? Number(product.widthCm) : null,
      heightCm: product.heightCm ? Number(product.heightCm) : null,
    };

    return { success: true, data: serializedProduct };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { success: false, error: "Failed to fetch product" };
  }
}

export async function createProduct(data: ProductFormData): Promise<ProductActionResult<{ id: string }>> {
  try {
    const validatedData = productFormSchema.parse(data);

    const product = await prisma.product.create({
      data: validatedData,
    });

    revalidatePath("/dashboard/products");

    return { success: true, data: { id: product.id } };
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "A product with this SKU already exists" };
    }
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  data: ProductFormData
): Promise<ProductActionResult> {
  try {
    const validatedData = productFormSchema.parse(data);

    const product = await prisma.product.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/dashboard/products/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "A product with this SKU already exists" };
    }
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  try {
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/dashboard/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export async function getProductsBySupplier(
  supplierId: string
): Promise<ProductActionResult<Array<{
  id: string;
  name: string;
  sku: string;
  currentStock: number;
}>>> {
  try {
    const products = await prisma.product.findMany({
      where: { supplierId },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching products by supplier:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function getProductCount(): Promise<ProductActionResult<number>> {
  try {
    const count = await prisma.product.count();
    return { success: true, data: count };
  } catch (error) {
    console.error("Error getting product count:", error);
    return { success: false, error: "Failed to get product count" };
  }
}

export async function getActiveProductCount(): Promise<ProductActionResult<number>> {
  try {
    const count = await prisma.product.count({
      where: { status: "ACTIVE" },
    });
    return { success: true, data: count };
  } catch (error) {
    console.error("Error getting active product count:", error);
    return { success: false, error: "Failed to get active product count" };
  }
}

export async function getLowStockProductCount(): Promise<ProductActionResult<number>> {
  try {
    const count = await prisma.product.count({
      where: {
        currentStock: {
          lt: prisma.product.fields.reorderLevel,
        },
      },
    });
    return { success: true, data: count };
  } catch (error) {
    console.error("Error getting low stock count:", error);
    return { success: false, error: "Failed to get low stock count" };
  }
}

export async function getRecentProducts(limit: number = 5): Promise<ProductActionResult<Array<{
  id: string;
  name: string;
  sku: string;
  createdAt: Date;
  currentStock: number;
  supplier: {
    id: string;
    companyName: string;
  };
}>>> {
  try {
    const products = await prisma.product.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        createdAt: true,
        currentStock: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("Error getting recent products:", error);
    return { success: false, error: "Failed to get recent products" };
  }
}
