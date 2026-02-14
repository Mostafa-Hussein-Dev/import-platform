"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { getPurchaseOrder, updatePurchaseOrder } from "@/lib/actions/purchase-orders";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getProducts } from "@/lib/actions/products";
import { toast } from "@/components/ui/use-toast";

export default function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      const [orderResult, suppliersResult, productsResult] = await Promise.all([
        getPurchaseOrder(id),
        getSuppliers({
          page: 1,
          pageSize: "100",
          status: "active",
          sortBy: "companyName",
          sortOrder: "asc"
        }),
        getProducts({
          page: 1,
          pageSize: "50",
          status: "ACTIVE",
          view: "grid",
          sortBy: "name",
          sortOrder: "asc",
        }),
      ]);

      if (orderResult.success && orderResult.data) {
        setOrder(orderResult.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load purchase order",
          variant: "destructive",
        });
        router.push("/dashboard/purchase-orders");
        return;
      }

      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data?.suppliers || []);
      }

      if (productsResult.success) {
        setProducts(productsResult.data?.products || []);
      }

      setLoading(false);
    }
    fetchData();
  }, [id, router]);

  async function handleSubmit(data: any) {
    const result = await updatePurchaseOrder(id!, data);

    if (result.success) {
      toast({
        title: "Success",
        description: "Purchase order updated successfully",
      });
      router.push(`/dashboard/purchase-orders/${id}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update purchase order",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212861]">Edit Purchase Order</h1>
        <p className="text-[#6B7280]">Update purchase order information</p>
      </div>

      <PurchaseOrderForm
        suppliers={suppliers}
        products={products}
        initialData={{
          supplierId: order.supplier.id,
          expectedDate: order.expectedDate,
          items: order.items,
          shippingEstimate: order.shippingEstimate,
          notes: order.notes || undefined,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Purchase Order"
      />
    </div>
  );
}
