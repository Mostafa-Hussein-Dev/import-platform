"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession, requireValidUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  potentialProductFormSchema,
  potentialProductFilterSchema,
  convertToProductSchema,
} from "@/lib/validations/potential-product";
import type {
  PotentialProductFormData,
  PotentialProductFilterData,
  ConvertToProductData,
} from "@/lib/validations/potential-product";
import type { Prisma, PotentialProductStatus } from "@prisma/client";

export type PotentialProductActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getPotentialProducts(
  filters?: PotentialProductFilterData
): Promise<
  PotentialProductActionResult<{
    potentialProducts: Array<{
      id: string;
      name: string;
      description: string | null;
      supplierId: string | null;
      supplierSku: string | null;
      estimatedCost: number | null;
      estimatedPrice: number | null;
      moq: number | null;
      sourceUrl: string | null;
      images: string[];
      notes: string | null;
      status: PotentialProductStatus;
      productId: string | null;
      createdAt: Date;
      updatedAt: Date;
      supplier: {
        id: string;
        companyName: string;
      } | null;
    }>;
    total: number;
    pages: number;
  }>
> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedFilters = potentialProductFilterSchema.parse(filters || {});

    const { search, supplierId, status, page, pageSize, sortBy, sortOrder } =
      validatedFilters;
    const pageNum = typeof page === "string" ? parseInt(page) : page;
    const pageSizeNum =
      typeof pageSize === "string" ? parseInt(pageSize) : parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.PotentialProductWhereInput = {
      createdBy: session.user.id,
    };

    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }];
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status !== "all") {
      where.status = status as PotentialProductStatus;
    }

    const [potentialProductsRaw, total] = await Promise.all([
      prisma.potentialProduct.findMany({
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
      prisma.potentialProduct.count({ where }),
    ]);

    const pages = Math.ceil(total / pageSizeNum);

    const potentialProducts = potentialProductsRaw.map((p) => ({
      ...p,
      estimatedCost: p.estimatedCost ? Number(p.estimatedCost) : null,
      estimatedPrice: p.estimatedPrice ? Number(p.estimatedPrice) : null,
    }));

    return { success: true, data: { potentialProducts, total, pages } };
  } catch (error) {
    console.error("Error fetching potential products:", error);
    return { success: false, error: "Failed to fetch potential products" };
  }
}

export async function getPotentialProduct(id: string): Promise<
  PotentialProductActionResult<{
    id: string;
    name: string;
    description: string | null;
    supplierId: string | null;
    supplierSku: string | null;
    estimatedCost: number | null;
    estimatedPrice: number | null;
    moq: number | null;
    sourceUrl: string | null;
    images: string[];
    notes: string | null;
    category: string | null;
    brand: string | null;
    weightKg: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    status: PotentialProductStatus;
    productId: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    supplier: {
      id: string;
      companyName: string;
    } | null;
    product: {
      id: string;
      name: string;
      sku: string;
    } | null;
  }>
> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const potentialProduct = await prisma.potentialProduct.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    if (!potentialProduct) {
      return { success: false, error: "Potential product not found" };
    }

    if (potentialProduct.createdBy !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to view this potential product",
      };
    }

    const serialized = {
      ...potentialProduct,
      estimatedCost: potentialProduct.estimatedCost
        ? Number(potentialProduct.estimatedCost)
        : null,
      estimatedPrice: potentialProduct.estimatedPrice
        ? Number(potentialProduct.estimatedPrice)
        : null,
      weightKg: potentialProduct.weightKg ? Number(potentialProduct.weightKg) : null,
      lengthCm: potentialProduct.lengthCm ? Number(potentialProduct.lengthCm) : null,
      widthCm: potentialProduct.widthCm ? Number(potentialProduct.widthCm) : null,
      heightCm: potentialProduct.heightCm ? Number(potentialProduct.heightCm) : null,
    };

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching potential product:", error);
    return { success: false, error: "Failed to fetch potential product" };
  }
}

export async function createPotentialProduct(
  data: PotentialProductFormData
): Promise<PotentialProductActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    const user = await requireValidUser(session);

    if (!user) {
      return { success: false, error: "User not found. Please sign out and sign in again." };
    }

    const validatedData = potentialProductFormSchema.parse(data);

    const potentialProduct = await prisma.potentialProduct.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        supplierId: validatedData.supplierId || null,
        supplierSku: validatedData.supplierSku || null,
        estimatedCost: validatedData.estimatedCost ?? null,
        estimatedPrice: validatedData.estimatedPrice ?? null,
        moq: validatedData.moq ?? null,
        sourceUrl: validatedData.sourceUrl || null,
        images: validatedData.images,
        notes: validatedData.notes || null,
        status: validatedData.status,
        createdBy: user.id,
      },
    });

    revalidatePath("/dashboard/potential-products");

    return { success: true, data: { id: potentialProduct.id } };
  } catch (error) {
    console.error("Error creating potential product:", error);
    return { success: false, error: "Failed to create potential product" };
  }
}

export async function updatePotentialProduct(
  id: string,
  data: PotentialProductFormData
): Promise<PotentialProductActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const existing = await prisma.potentialProduct.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Potential product not found" };
    }

    if (existing.createdBy !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to update this potential product",
      };
    }

    if (existing.status === "CONVERTED") {
      return {
        success: false,
        error: "Cannot update a converted potential product",
      };
    }

    const validatedData = potentialProductFormSchema.parse(data);

    await prisma.potentialProduct.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        supplierId: validatedData.supplierId || null,
        supplierSku: validatedData.supplierSku || null,
        estimatedCost: validatedData.estimatedCost ?? null,
        estimatedPrice: validatedData.estimatedPrice ?? null,
        moq: validatedData.moq ?? null,
        sourceUrl: validatedData.sourceUrl || null,
        images: validatedData.images,
        notes: validatedData.notes || null,
      },
    });

    revalidatePath("/dashboard/potential-products");
    revalidatePath(`/dashboard/potential-products/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating potential product:", error);
    return { success: false, error: "Failed to update potential product" };
  }
}

export async function deletePotentialProduct(
  id: string
): Promise<PotentialProductActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const potentialProduct = await prisma.potentialProduct.findUnique({
      where: { id },
    });

    if (!potentialProduct) {
      return { success: false, error: "Potential product not found" };
    }

    if (potentialProduct.createdBy !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to delete this potential product",
      };
    }

    if (potentialProduct.status === "CONVERTED") {
      return {
        success: false,
        error:
          "Cannot delete a converted potential product. It serves as a historical record.",
      };
    }

    await prisma.potentialProduct.delete({
      where: { id },
    });

    revalidatePath("/dashboard/potential-products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting potential product:", error);
    return { success: false, error: "Failed to delete potential product" };
  }
}

export async function updatePotentialProductStatus(
  id: string,
  newStatus: "RESEARCHING" | "APPROVED" | "REJECTED"
): Promise<PotentialProductActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const potentialProduct = await prisma.potentialProduct.findUnique({
      where: { id },
    });

    if (!potentialProduct) {
      return { success: false, error: "Potential product not found" };
    }

    if (potentialProduct.createdBy !== session.user.id) {
      return {
        success: false,
        error:
          "You don't have permission to update this potential product status",
      };
    }

    if (potentialProduct.status === "CONVERTED") {
      return {
        success: false,
        error: "Cannot change status of a converted potential product",
      };
    }

    await prisma.potentialProduct.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard/potential-products");
    revalidatePath(`/dashboard/potential-products/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating potential product status:", error);
    return {
      success: false,
      error: "Failed to update potential product status",
    };
  }
}

export async function convertToProduct(
  id: string,
  data: ConvertToProductData
): Promise<PotentialProductActionResult<{ productId: string }>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const potentialProduct = await prisma.potentialProduct.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });

    if (!potentialProduct) {
      return { success: false, error: "Potential product not found" };
    }

    if (potentialProduct.createdBy !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to convert this potential product",
      };
    }

    if (potentialProduct.status !== "APPROVED") {
      return {
        success: false,
        error: "Only approved potential products can be converted",
      };
    }

    if (!potentialProduct.supplierId) {
      return {
        success: false,
        error: "Cannot convert: Supplier must be assigned first",
      };
    }

    if (!potentialProduct.estimatedCost || !potentialProduct.estimatedPrice) {
      return {
        success: false,
        error: "Cannot convert: Both cost and price must be set",
      };
    }

    const validatedData = convertToProductSchema.parse(data);

    const existingSku = await prisma.product.findUnique({
      where: { sku: validatedData.sku },
    });

    if (existingSku) {
      return {
        success: false,
        error: "SKU already exists. Please choose a different SKU.",
      };
    }

    const product = await prisma.product.create({
      data: {
        sku: validatedData.sku,
        name: potentialProduct.name,
        description: potentialProduct.description,
        supplierId: potentialProduct.supplierId,
        supplierSku: potentialProduct.supplierSku,
        costPrice: potentialProduct.estimatedCost,
        wholesalePrice: validatedData.wholesalePrice,
        retailPrice: potentialProduct.estimatedPrice,
        moq: potentialProduct.moq,
        images: potentialProduct.images,
        currentStock: validatedData.currentStock,
        reorderLevel: validatedData.reorderLevel,
        warehouseLocation: validatedData.warehouseLocation || null,
        category: potentialProduct.category || null,
        brand: potentialProduct.brand || null,
        weightKg: potentialProduct.weightKg || null,
        lengthCm: potentialProduct.lengthCm || null,
        widthCm: potentialProduct.widthCm || null,
        heightCm: potentialProduct.heightCm || null,
        status: "ACTIVE",
      },
    });

    await prisma.potentialProduct.update({
      where: { id },
      data: {
        status: "CONVERTED",
        productId: product.id,
      },
    });

    revalidatePath("/dashboard/potential-products");
    revalidatePath(`/dashboard/potential-products/${id}`);
    revalidatePath("/dashboard/products");

    return { success: true, data: { productId: product.id } };
  } catch (error) {
    console.error("Error converting potential product:", error);
    return { success: false, error: "Failed to convert potential product" };
  }
}

export async function getPotentialProductsCount(): Promise<
  PotentialProductActionResult<{
    researching: number;
    approved: number;
    rejected: number;
    converted: number;
    total: number;
  }>
> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const [researching, approved, rejected, converted] = await Promise.all([
      prisma.potentialProduct.count({
        where: { createdBy: session.user.id, status: "RESEARCHING" },
      }),
      prisma.potentialProduct.count({
        where: { createdBy: session.user.id, status: "APPROVED" },
      }),
      prisma.potentialProduct.count({
        where: { createdBy: session.user.id, status: "REJECTED" },
      }),
      prisma.potentialProduct.count({
        where: { createdBy: session.user.id, status: "CONVERTED" },
      }),
    ]);

    return {
      success: true,
      data: {
        researching,
        approved,
        rejected,
        converted,
        total: researching + approved + rejected + converted,
      },
    };
  } catch (error) {
    console.error("Error getting potential products count:", error);
    return {
      success: false,
      error: "Failed to get potential products count",
    };
  }
}

export async function getApprovedPotentialProducts(
  limit: number = 5
): Promise<
  PotentialProductActionResult<
    Array<{
      id: string;
      name: string;
      estimatedCost: number | null;
      estimatedPrice: number | null;
      createdAt: Date;
      supplier: {
        id: string;
        companyName: string;
      } | null;
    }>
  >
> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const potentialProducts = await prisma.potentialProduct.findMany({
      where: {
        createdBy: session.user.id,
        status: "APPROVED",
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        estimatedCost: true,
        estimatedPrice: true,
        createdAt: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    const serialized = potentialProducts.map((p) => ({
      ...p,
      estimatedCost: p.estimatedCost ? Number(p.estimatedCost) : null,
      estimatedPrice: p.estimatedPrice ? Number(p.estimatedPrice) : null,
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error getting approved potential products:", error);
    return {
      success: false,
      error: "Failed to get approved potential products",
    };
  }
}
