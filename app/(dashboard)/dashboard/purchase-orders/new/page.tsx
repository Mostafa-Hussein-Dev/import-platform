"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getProducts } from "@/lib/actions/products";
import { createPurchaseOrder } from "@/lib/actions/purchase-orders";
import { toast } from "@/components/ui/use-toast";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [suppliersResult, productsResult] = await Promise.all([
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

      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data?.suppliers || []);
      }
      if (productsResult.success) {
        setProducts(productsResult.data?.products || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  async function handleSubmit(data: any, status: "draft" | "sent") {
    const result = await createPurchaseOrder(data);

    if (result.success) {
      toast({
        title: "Success",
        description: `Purchase order ${result.data!.poNumber} created`,
      });
      router.push(`/dashboard/purchase-orders/${result.data!.id}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create purchase order",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212861]">Create Purchase Order</h1>
        <p className="text-[#6B7280]">Create a new purchase order for your supplier</p>
      </div>

      <PurchaseOrderForm
        suppliers={suppliers}
        products={products}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
