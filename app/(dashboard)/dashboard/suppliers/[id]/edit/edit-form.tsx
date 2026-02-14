"use client";

import { useRouter } from "next/navigation";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { updateSupplier } from "@/lib/actions/suppliers";
import { toast } from "@/components/ui/use-toast";
import type { SupplierFormData } from "@/lib/validations/supplier";

interface EditSupplierFormProps {
  id: string;
  initialData: Partial<SupplierFormData>;
}

export function EditSupplierForm({ id, initialData }: EditSupplierFormProps) {
  const router = useRouter();

  async function handleUpdate(data: SupplierFormData) {
    const result = await updateSupplier(id, data);

    if (result.success) {
      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });
      router.push(`/dashboard/suppliers/${id}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update supplier",
        variant: "destructive",
      });
    }
  }

  return (
    <SupplierForm
      initialData={initialData}
      onSubmit={handleUpdate}
      submitLabel="Save Changes"
      cancelHref={`/dashboard/suppliers/${id}`}
    />
  );
}
