"use client";

import { useRouter } from "next/navigation";
import { ShippingCompanyForm } from "@/components/shipping-companies/shipping-company-form";
import { createShippingCompany } from "@/lib/actions/shipping-companies";
import { toast } from "@/components/ui/use-toast";

export default function NewShippingCompanyPage() {
  const router = useRouter();

  async function handleSubmit(data: any) {
    const result = await createShippingCompany(data);

    if (result.success) {
      toast({
        title: "Success",
        description: "Shipping company created successfully",
      });
      router.push(`/dashboard/shipping-companies/${result.data!.id}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create shipping company",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212861]">Add Shipping Company</h1>
        <p className="text-[#6B7280]">Add a new shipping logistics partner</p>
      </div>

      <ShippingCompanyForm onSubmit={handleSubmit} submitLabel="Create Shipping Company" />
    </div>
  );
}
