"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession, requireValidUser } from "@/lib/auth";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { supplierFormSchema, supplierFilterSchema } from "@/lib/validations/supplier";
import type { SupplierFormData, SupplierFilterData } from "@/lib/validations/supplier";
import type { Prisma } from "@prisma/client";

export type SupplierActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getSuppliers(filters?: SupplierFilterData): Promise<SupplierActionResult<{
  suppliers: Array<{
    id: string;
    companyName: string;
    contactPerson: string | null;
    country: string;
    email: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
    _count: { products: number };
  }>;
  total: number;
  pages: number;
}>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedFilters = supplierFilterSchema.parse(filters || {});

    const { search, status, page, pageSize, sortBy, sortOrder } = validatedFilters;
    const pageNum = typeof page === "string" ? parseInt(page) : page;
    const pageSizeNum = typeof pageSize === "string" ? parseInt(pageSize) : parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.SupplierWhereInput = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status !== "all") {
      where.isActive = status === "active";
    }

    const [suppliersRaw, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          country: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    const pages = Math.ceil(total / pageSizeNum);

    // Ensure dates are serializable
    const suppliers = suppliersRaw.map(s => ({
      ...s,
      createdAt: s.createdAt,
    }));

    return { success: true, data: { suppliers, total, pages } };
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return { success: false, error: "Failed to fetch suppliers" };
  }
}

export async function getSupplier(id: string): Promise<SupplierActionResult<{
  id: string;
  companyName: string;
  contactPerson: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  wechat: string | null;
  address: string | null;
  website: string | null;
  paymentTerms: string | null;
  leadTime: string | null;
  rating: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
  }>;
}>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            currentStock: true,
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!supplier) {
      return { success: false, error: "Supplier not found" };
    }

    if (supplier.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to view this supplier" };
    }

    // Convert Decimal to Number for rating field
    const { rating, ...supplierData } = supplier;
    const convertedSupplier = {
      ...supplierData,
      rating: rating ? Number(rating) : null,
    };

    return { success: true, data: convertedSupplier };
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return { success: false, error: "Failed to fetch supplier" };
  }
}

export async function createSupplier(data: SupplierFormData): Promise<SupplierActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    const user = await requireValidUser(session);

    if (!user) {
      return { success: false, error: "User not found. Please sign out and sign in again." };
    }

    const validatedData = supplierFormSchema.parse(data);

    const supplier = await prisma.supplier.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    });

    revalidateTag("suppliers", {});
    revalidateTag("dashboard", {});
    revalidatePath("/dashboard/suppliers");

    return { success: true, data: { id: supplier.id } };
  } catch (error) {
    console.error("Error creating supplier:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "A supplier with this information already exists" };
    }
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return { success: false, error: "User account not found. Please sign out and sign in again." };
    }
    return { success: false, error: "Failed to create supplier" };
  }
}

export async function updateSupplier(
  id: string,
  data: SupplierFormData
): Promise<SupplierActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check ownership
    const existing = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Supplier not found" };
    }

    if (existing.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to update this supplier" };
    }

    const validatedData = supplierFormSchema.parse(data);

    await prisma.supplier.update({
      where: { id },
      data: validatedData,
    });

    revalidateTag("suppliers", {});
    revalidateTag("dashboard", {});
    revalidatePath("/dashboard/suppliers");
    revalidatePath(`/dashboard/suppliers/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Failed to update supplier" };
  }
}

export async function deleteSupplier(id: string): Promise<SupplierActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!supplier) {
      return { success: false, error: "Supplier not found" };
    }

    if (supplier.userId !== session.user.id) {
      return { success: false, error: "You don't have permission to delete this supplier" };
    }

    if (supplier._count.products > 0) {
      return { success: false, error: "Cannot delete supplier with associated products. Please reassign or delete products first." };
    }

    await prisma.supplier.delete({
      where: { id },
    });

    revalidateTag("suppliers", {});
    revalidateTag("dashboard", {});
    revalidatePath("/dashboard/suppliers");

    return { success: true };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error: "Failed to delete supplier" };
  }
}

export const getSupplierCount = unstable_cache(
  async (): Promise<SupplierActionResult<number>> => {
    try {
      const count = await prisma.supplier.count();
      return { success: true, data: count };
    } catch (error) {
      console.error("Error getting supplier count:", error);
      return { success: false, error: "Failed to get supplier count" };
    }
  },
  ["supplier-count"],
  { revalidate: 30, tags: ["suppliers"] }
);

export const getRecentSuppliers = unstable_cache(
  async (limit: number = 5): Promise<SupplierActionResult<Array<{
    id: string;
    companyName: string;
    contactPerson: string | null;
    country: string;
    createdAt: Date;
  }>>> => {
    try {
      const suppliers = await prisma.supplier.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          country: true,
          createdAt: true,
        },
      });

      return { success: true, data: suppliers };
    } catch (error) {
      console.error("Error getting recent suppliers:", error);
      return { success: false, error: "Failed to get recent suppliers" };
    }
  },
  ["recent-suppliers"],
  { revalidate: 30, tags: ["suppliers"] }
);
