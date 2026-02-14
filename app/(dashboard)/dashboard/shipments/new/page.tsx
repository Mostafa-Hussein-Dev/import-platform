"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShipmentForm } from "@/components/shipments/shipment-form";
import { getPurchaseOrders } from "@/lib/actions/purchase-orders";
import { getShippingCompanies } from "@/lib/actions/shipping-companies";
import { createShipment } from "@/lib/actions/shipments";
import { toast } from "@/components/ui/use-toast";

export default function NewShipmentPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [shippingCompanies, setShippingCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [posResult, shippingCompaniesResult] = await Promise.all([
        getPurchaseOrders({
          page: 1,
          pageSize: "100",
          paymentStatus: "all",
          sortBy: "createdAt",
          sortOrder: "desc",
          status: "all",
        }),
        getShippingCompanies({
          page: 1,
          pageSize: "100",
          status: "active",
          type: "all",
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ]);

      if (posResult.success && posResult.data) {
        // Filter POs that can have shipments (producing or confirmed, and not already shipped)
        const eligiblePOs = posResult.data.purchaseOrders.filter(
          po => po.status === "producing" || po.status === "confirmed"
        );
        setPurchaseOrders(eligiblePOs);
      }

      if (shippingCompaniesResult.success && shippingCompaniesResult.data) {
        setShippingCompanies(shippingCompaniesResult.data.companies);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  async function handleSubmit(data: any) {
    const result = await createShipment(data);

    if (result.success) {
      toast({
        title: "Success",
        description: `Shipment ${result.data!.shipmentNumber} created`,
      });
      router.push(`/dashboard/shipments/${result.data!.id}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create shipment",
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
        <h1 className="text-2xl font-bold text-[#212861]">Create Shipment</h1>
        <p className="text-[#6B7280]">Create a new shipment for your purchase order</p>
      </div>

      <ShipmentForm
        purchaseOrders={purchaseOrders}
        shippingCompanies={shippingCompanies}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
