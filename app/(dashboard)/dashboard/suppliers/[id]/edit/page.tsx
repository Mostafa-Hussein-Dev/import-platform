import { getSupplier } from "@/lib/actions/suppliers";
import { notFound } from "next/navigation";
import type { SupplierFormData } from "@/lib/validations/supplier";
import { EditSupplierForm } from "./edit-form";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSupplier(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const supplier = result.data;

  // Convert null values to undefined for the form
  const formData: Partial<SupplierFormData> = {
    companyName: supplier.companyName,
    contactPerson: supplier.contactPerson || undefined,
    country: supplier.country,
    email: supplier.email || undefined,
    phone: supplier.phone || undefined,
    whatsapp: supplier.whatsapp || undefined,
    wechat: supplier.wechat || undefined,
    address: supplier.address || undefined,
    website: supplier.website || undefined,
    paymentTerms: supplier.paymentTerms || undefined,
    leadTime: supplier.leadTime || undefined,
    rating: supplier.rating ? Number(supplier.rating) : undefined,
    notes: supplier.notes || undefined,
    isActive: supplier.isActive,
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#212861]">Edit Supplier</h2>
        <p className="text-[#6B7280]">
          Update the information for {supplier.companyName}.
        </p>
      </div>

      <EditSupplierForm
        id={id}
        initialData={formData}
      />
      </div>
    </div>
  );
}
