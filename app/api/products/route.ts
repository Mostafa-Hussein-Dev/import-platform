import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      status: "ACTIVE",
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        images: true,
        currentStock: true,
        wholesalePrice: true,
        retailPrice: true,
        landedCost: true,
        supplier: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      products.map((p) => ({
        ...p,
        currentStock: Number(p.currentStock),
        wholesalePrice: Number(p.wholesalePrice),
        retailPrice: Number(p.retailPrice),
        landedCost: p.landedCost ? Number(p.landedCost) : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
