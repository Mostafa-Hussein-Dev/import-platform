"use server";

import { prisma } from "@/lib";
import { unstable_cache } from "next/cache";

/**
 * Consolidated dashboard data fetcher.
 * Batches all dashboard queries into 2-3 transactions instead of 19 separate calls.
 */
export const getDashboardData = unstable_cache(
  async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Batch 1: All count queries in a single $transaction
    const [
      supplierCount,
      productCount,
      activeProductCount,
      sentPOCount,
      confirmedPOCount,
      inTransitShipmentCount,
      customsShipmentCount,
      activeProductsTotal,
      outOfStockCount,
    ] = await prisma.$transaction([
      prisma.supplier.count(),
      prisma.product.count(),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.purchaseOrder.count({ where: { status: "sent" } }),
      prisma.purchaseOrder.count({ where: { status: "confirmed" } }),
      prisma.shipment.count({ where: { status: "in_transit" } }),
      prisma.shipment.count({ where: { status: "customs" } }),
      prisma.product.aggregate({
        where: { status: "ACTIVE" },
        _sum: { currentStock: true },
      }),
      prisma.product.count({
        where: { status: "ACTIVE", currentStock: 0 },
      }),
    ]);

    // Batch 2: Aggregations and recent items in parallel
    const [
      thisMonthPOValue,
      inventoryProducts,
      lowStockCount,
      orderStats,
      recentOrders,
      recentPOs,
      recentShipments,
      recentMovements,
      recentSuppliers,
      recentProducts,
      potentialProductCounts,
      approvedPotentialProducts,
    ] = await Promise.all([
      // This month PO value
      prisma.purchaseOrder.aggregate({
        where: { orderDate: { gte: startOfMonth } },
        _sum: { totalCost: true },
      }),
      // Inventory value products
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
          landedCost: { not: null },
          currentStock: { gt: 0 },
        },
        select: { currentStock: true, landedCost: true },
      }),
      // Low stock count
      prisma.product.count({
        where: {
          status: "ACTIVE",
          currentStock: {
            gt: 0,
            lte: prisma.product.fields.reorderLevel,
          },
        },
      }),
      // Order stats
      (async () => {
        const [totalOrders, totalRevenue, monthOrders, monthRevenue, pendingPaymentOrders] =
          await prisma.$transaction([
            prisma.order.count({ where: { status: { not: "cancelled" } } }),
            prisma.order.aggregate({
              where: { status: { not: "cancelled" } },
              _sum: { total: true },
            }),
            prisma.order.count({
              where: { status: { not: "cancelled" }, createdAt: { gte: startOfMonth } },
            }),
            prisma.order.aggregate({
              where: { status: { not: "cancelled" }, createdAt: { gte: startOfMonth } },
              _sum: { total: true },
            }),
            prisma.order.findMany({
              where: {
                status: { not: "cancelled" },
                paymentStatus: { in: ["pending", "partial"] },
              },
              select: { total: true, paidAmount: true },
            }),
          ]);

        const pendingPaymentValue = pendingPaymentOrders.reduce(
          (sum: number, order: any) => sum + Number(order.total) - Number(order.paidAmount),
          0
        );

        return {
          totalOrders,
          totalRevenue: Number(totalRevenue._sum.total || 0),
          monthOrders,
          monthRevenue: Number(monthRevenue._sum.total || 0),
          pendingPaymentOrders: pendingPaymentOrders.length,
          pendingPaymentValue,
        };
      })(),
      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          type: true,
          customerName: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
      // Recent POs
      prisma.purchaseOrder.findMany({
        take: 5,
        orderBy: { orderDate: "desc" },
        include: { supplier: { select: { companyName: true } } },
      }),
      // Recent shipments
      prisma.shipment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          purchaseOrder: {
            include: { supplier: { select: { companyName: true } } },
          },
          shippingCompany: { select: { id: true, name: true } },
        },
      }),
      // Recent stock movements
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: { id: true, name: true, sku: true, images: true },
          },
        },
      }),
      // Recent suppliers
      prisma.supplier.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          country: true,
          createdAt: true,
        },
      }),
      // Recent products
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          sku: true,
          createdAt: true,
          currentStock: true,
          supplier: { select: { id: true, companyName: true } },
        },
      }),
      // Potential product counts via single groupBy
      prisma.potentialProduct.groupBy({
        by: ["status"],
        _count: true,
      }),
      // Approved potential products
      prisma.potentialProduct.findMany({
        where: { status: "APPROVED" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          estimatedCost: true,
          estimatedPrice: true,
          createdAt: true,
          supplier: { select: { id: true, companyName: true } },
        },
      }),
    ]);

    // Calculate inventory value
    const inventoryValue = inventoryProducts.reduce(
      (sum, p) => sum + Number(p.landedCost!) * p.currentStock,
      0
    );

    // Serialize data
    return {
      counts: {
        suppliers: supplierCount,
        products: productCount,
        activeProducts: activeProductCount,
        sentPOs: sentPOCount,
        confirmedPOs: confirmedPOCount,
        inTransitShipments: inTransitShipmentCount,
        customsShipments: customsShipmentCount,
        outOfStock: outOfStockCount,
        lowStock: lowStockCount,
        totalStockUnits: activeProductsTotal._sum.currentStock || 0,
      },
      values: {
        thisMonthPOValue: Number(thisMonthPOValue._sum.totalCost || 0),
        inventoryValue: Math.round(inventoryValue * 100) / 100,
      },
      orderStats,
      potentialProductsCount: (() => {
        const counts: Record<string, number> = {};
        for (const row of potentialProductCounts) {
          counts[row.status] = row._count;
        }
        const researching = counts["RESEARCHING"] || 0;
        const approved = counts["APPROVED"] || 0;
        const rejected = counts["REJECTED"] || 0;
        const converted = counts["CONVERTED"] || 0;
        return { researching, approved, rejected, converted, total: researching + approved + rejected + converted };
      })(),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        type: order.type,
        customerName: order.customerName,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: Number(order.total),
        createdAt: order.createdAt,
        itemCount: order._count.items,
      })),
      recentPOs: recentPOs.map((po) => ({
        id: po.id,
        poNumber: po.poNumber,
        supplier: { companyName: po.supplier.companyName },
        orderDate: po.orderDate,
        totalCost: Number(po.totalCost),
        status: po.status,
      })),
      recentShipments: recentShipments.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        purchaseOrder: {
          poNumber: s.purchaseOrder.poNumber,
          supplier: { companyName: s.purchaseOrder.supplier.companyName },
        },
        shippingCompany: s.shippingCompany,
        estimatedArrival: s.estimatedArrival,
      })),
      recentMovements: recentMovements.map((m) => ({
        ...m,
        landedCost: m.landedCost ? Number(m.landedCost) : null,
        unitCost: m.unitCost ? Number(m.unitCost) : null,
      })),
      recentSuppliers,
      recentProducts,
      approvedPotentialProducts: approvedPotentialProducts.map((p) => ({
        ...p,
        estimatedCost: p.estimatedCost ? Number(p.estimatedCost) : null,
        estimatedPrice: p.estimatedPrice ? Number(p.estimatedPrice) : null,
      })),
    };
  },
  ["dashboard-data"],
  { revalidate: 30, tags: ["dashboard", "orders", "products", "suppliers", "purchase-orders", "shipments", "inventory", "stock-movements", "potential-products"] }
);
