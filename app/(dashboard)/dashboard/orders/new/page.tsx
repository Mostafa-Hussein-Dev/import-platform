"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/actions/orders";
import { OrderForm } from "@/components/orders/order-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | false>(false);

  const handleSubmit = async (data: any) => {
    setLoading(data.status === "confirmed" ? "confirm" : "save");

    try {
      const result = await createOrder(data);

      if (result.success && result.data) {
        const action = data.status === "confirmed" ? "confirmed" : "created";
        toast.success(`Order ${action} successfully`);
        router.push(`/dashboard/orders/${result.data.id}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Order</h1>
          <p className="text-muted-foreground mt-1">
            Create a new sales order for your customer
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">
              {loading === "confirm" ? "Confirming order..." : "Creating order..."}
            </p>
          </div>
        </div>
      ) : (
        <OrderForm
          onSubmit={handleSubmit}
          submitLabel="Create Order"
          isEditing={false}
        />
      )}
    </div>
  );
}
