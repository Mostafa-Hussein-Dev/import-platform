"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { createProduct } from "@/lib/actions/products";
import { toast } from "@/components/ui/use-toast";

export default function NewProductPage() {
  const router = useRouter();

  async function handleSubmit(data: any) {
    const result = await createProduct(data);

    if (result.success) {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      router.push("/dashboard/products");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create product",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-[#212861]">Add New Product</h2>
        <p className="text-[#6B7280]">
          Fill in the details to add a new product to your catalog.
        </p>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        submitLabel="Create Product"
        cancelHref="/dashboard/products"
      />
    </div>
  );
}
