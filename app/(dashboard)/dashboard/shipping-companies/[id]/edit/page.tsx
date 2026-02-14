"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShippingCompanyForm } from "@/components/shipping-companies/shipping-company-form";
import { getShippingCompany, updateShippingCompany } from "@/lib/actions/shipping-companies";
import type { ShippingCompanyFormData } from "@/lib/validations/shipping-company";
import { toast } from "@/components/ui/use-toast";

export default function EditShippingCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
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
    async function fetchCompany() {
      if (!id) return;
      const result = await getShippingCompany(id);
      if (result.success && result.data) {
        setCompany(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load shipping company",
          variant: "destructive",
        });
        router.push("/dashboard/shipping-companies");
      }
      setLoading(false);
    }
    fetchCompany();
  }, [id, router]);

  async function handleSubmit(data: any) {
    if (!id) return;
    const result = await updateShippingCompany(id, data);

    if (result.success) {
      toast({
        title: "Success",
        description: "Shipping company updated successfully",
      });
      router.push(`/dashboard/shipping-companies/${id}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update shipping company",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#212861]">Edit Shipping Company</h1>
        <p className="text-[#6B7280]">Update shipping company information</p>
      </div>

      <ShippingCompanyForm
        initialData={{
          name: company.name,
          type: company.type as any,
          contactPerson: company.contactPerson || undefined,
          email: company.email || undefined,
          phone: company.phone || undefined,
          ratePerKg: company.ratePerKg || undefined,
          ratePerCBM: company.ratePerCBM || undefined,
          minCharge: company.minCharge || undefined,
          transitTime: company.transitTime || undefined,
          notes: company.notes || undefined,
          isActive: company.isActive,
        }}
        onSubmit={handleSubmit}
        submitLabel="Update Shipping Company"
      />
    </div>
  );
}
