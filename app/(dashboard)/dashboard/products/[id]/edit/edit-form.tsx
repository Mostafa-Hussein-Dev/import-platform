"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { updateProduct } from "@/lib/actions/products";
import { toast } from "@/components/ui/use-toast";
import type { ProductFormData } from "@/lib/validations/product";

interface EditProductFormProps {
  id: string;
  initialData: Partial<ProductFormData>;
}

export function EditProductForm({ id, initialData }: EditProductFormProps) {
  const router = useRouter();

  async function handleUpdate(data: ProductFormData) {
    const result = await updateProduct(id, data);

    if (result.success) {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      router.push(`/dashboard/products/${id}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update product",
        variant: "destructive",
      });
    }
  }

  return (
    <ProductForm
      initialData={initialData}
      onSubmit={handleUpdate}
      submitLabel="Save Changes"
      cancelHref={`/dashboard/products/${id}`}
    />
  );
}
