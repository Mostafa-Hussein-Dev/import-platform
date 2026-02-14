"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession, requireValidUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { shippingCompanyFormSchema, shippingCompanyFilterSchema } from "@/lib/validations/shipping-company";
import type { ShippingCompanyFormData, ShippingCompanyFilterData } from "@/lib/validations/shipping-company";
import type { Prisma } from "@prisma/client";

export type ShippingCompanyActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getShippingCompanies(filters?: ShippingCompanyFilterData): Promise<ShippingCompanyActionResult<{
  companies: Array<{
    id: string;
    name: string;
    type: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    ratePerKg: number | null;
    ratePerCBM: number | null;
    minCharge: number | null;
    transitTime: string | null;
    isActive: boolean;
    createdAt: Date;
    _count: { shipments: number };
  }>;
  total: number;
  pages: number;
}>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const validatedFilters = shippingCompanyFilterSchema.parse(filters || {});

    const { search, type, status, page, pageSize, sortBy, sortOrder } = validatedFilters;
    const pageNum = typeof page === "string" ? parseInt(page) : page;
    const pageSizeNum = typeof pageSize === "string" ? parseInt(pageSize) : parseInt(pageSize);
    const skip = (pageNum - 1) * pageSizeNum;

    const where: Prisma.ShippingCompanyWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type !== "all") {
      where.type = type;
    }

    if (status !== "all") {
      where.isActive = status === "active";
    }

    const [companiesRaw, total] = await Promise.all([
      prisma.shippingCompany.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { shipments: true },
          },
        },
      }),
      prisma.shippingCompany.count({ where }),
    ]);

    const pages = Math.ceil(total / pageSizeNum);

    const companies = companiesRaw.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      contactPerson: c.contactPerson,
      email: c.email,
      phone: c.phone,
      ratePerKg: c.ratePerKg ? Number(c.ratePerKg) : null,
      ratePerCBM: c.ratePerCBM ? Number(c.ratePerCBM) : null,
      minCharge: c.minCharge ? Number(c.minCharge) : null,
      transitTime: c.transitTime,
      isActive: c.isActive,
      createdAt: c.createdAt,
      _count: c._count,
    }));

    return { success: true, data: { companies, total, pages } };
  } catch (error) {
    console.error("Error fetching shipping companies:", error);
    return { success: false, error: "Failed to fetch shipping companies" };
  }
}

export async function getShippingCompany(id: string): Promise<ShippingCompanyActionResult<{
  id: string;
  name: string;
  type: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  ratePerKg: number | null;
  ratePerCBM: number | null;
  minCharge: number | null;
  transitTime: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  shipments: Array<{
    id: string;
    shipmentNumber: string;
    status: string;
    method: string;
    departureDate: Date | null;
    estimatedArrival: Date | null;
    totalCost: number;
  }>;
}>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const company = await prisma.shippingCompany.findUnique({
      where: { id },
      include: {
        shipments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!company) {
      return { success: false, error: "Shipping company not found" };
    }

    return {
      success: true,
      data: {
        id: company.id,
        name: company.name,
        type: company.type,
        contactPerson: company.contactPerson,
        email: company.email,
        phone: company.phone,
        ratePerKg: company.ratePerKg ? Number(company.ratePerKg) : null,
        ratePerCBM: company.ratePerCBM ? Number(company.ratePerCBM) : null,
        minCharge: company.minCharge ? Number(company.minCharge) : null,
        transitTime: company.transitTime,
        notes: company.notes,
        isActive: company.isActive,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        shipments: company.shipments.map(s => ({
          id: s.id,
          shipmentNumber: s.shipmentNumber,
          status: s.status,
          method: s.method,
          departureDate: s.departureDate,
          estimatedArrival: s.estimatedArrival,
          totalCost: Number(s.totalCost),
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching shipping company:", error);
    return { success: false, error: "Failed to fetch shipping company" };
  }
}

export async function createShippingCompany(data: ShippingCompanyFormData): Promise<ShippingCompanyActionResult<{ id: string }>> {
  try {
    const session = await getServerSession();
    const user = await requireValidUser(session);

    if (!user) {
      return { success: false, error: "User not found. Please sign out and sign in again." };
    }

    const validatedData = shippingCompanyFormSchema.parse(data);

    const company = await prisma.shippingCompany.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        contactPerson: validatedData.contactPerson,
        email: validatedData.email || null,
        phone: validatedData.phone,
        ratePerKg: validatedData.ratePerKg,
        ratePerCBM: validatedData.ratePerCBM,
        minCharge: validatedData.minCharge,
        transitTime: validatedData.transitTime,
        notes: validatedData.notes,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/dashboard/shipping-companies");

    return { success: true, data: { id: company.id } };
  } catch (error) {
    console.error("Error creating shipping company:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "A shipping company with this name already exists" };
    }
    return { success: false, error: "Failed to create shipping company" };
  }
}

export async function updateShippingCompany(
  id: string,
  data: ShippingCompanyFormData
): Promise<ShippingCompanyActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const existing = await prisma.shippingCompany.findUnique({
      where: { id },
      include: { _count: { select: { shipments: true } } },
    });

    if (!existing) {
      return { success: false, error: "Shipping company not found" };
    }

    const validatedData = shippingCompanyFormSchema.parse(data);

    await prisma.shippingCompany.update({
      where: { id },
      data: {
        name: validatedData.name,
        type: validatedData.type,
        contactPerson: validatedData.contactPerson,
        email: validatedData.email || null,
        phone: validatedData.phone,
        ratePerKg: validatedData.ratePerKg,
        ratePerCBM: validatedData.ratePerCBM,
        minCharge: validatedData.minCharge,
        transitTime: validatedData.transitTime,
        notes: validatedData.notes,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/dashboard/shipping-companies");
    revalidatePath(`/dashboard/shipping-companies/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating shipping company:", error);
    return { success: false, error: "Failed to update shipping company" };
  }
}

export async function deleteShippingCompany(id: string): Promise<ShippingCompanyActionResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const company = await prisma.shippingCompany.findUnique({
      where: { id },
      include: { _count: { select: { shipments: true } } },
    });

    if (!company) {
      return { success: false, error: "Shipping company not found" };
    }

    if (company._count.shipments > 0) {
      // Soft delete - set inactive
      await prisma.shippingCompany.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no shipments
      await prisma.shippingCompany.delete({
        where: { id },
      });
    }

    revalidatePath("/dashboard/shipping-companies");

    return { success: true };
  } catch (error) {
    console.error("Error deleting shipping company:", error);
    return { success: false, error: "Failed to delete shipping company" };
  }
}

export async function getShippingCompanyCount(): Promise<ShippingCompanyActionResult<number>> {
  try {
    const count = await prisma.shippingCompany.count({ where: { isActive: true } });
    return { success: true, data: count };
  } catch (error) {
    console.error("Error getting shipping company count:", error);
    return { success: false, error: "Failed to get shipping company count" };
  }
}
