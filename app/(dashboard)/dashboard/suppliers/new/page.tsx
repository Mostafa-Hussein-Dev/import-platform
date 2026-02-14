"use client";

import { useRouter } from "next/navigation";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { createSupplier } from "@/lib/actions/suppliers";
import { toast } from "@/components/ui/use-toast";

export default function NewSupplierPage() {
  const router = useRouter();

  async function handleSubmit(data: any) {
    const result = await createSupplier(data);

    if (result.success) {
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      router.push("/dashboard/suppliers");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create supplier",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-[#212861]">Add New Supplier</h2>
        <p className="text-[#6B7280]">
          Fill in the details to add a new supplier to your catalog.
        </p>
      </div>

      <SupplierForm
        onSubmit={handleSubmit}
        submitLabel="Create Supplier"
        cancelHref="/dashboard/suppliers"
      />
    </div>
  );
}
