import { getProduct } from "@/lib/actions/products";
import { notFound } from "next/navigation";
import type { ProductFormData } from "@/lib/validations/product";
import { EditProductForm } from "./edit-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProduct(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;

  // Convert Decimal values to numbers and properly type the data
  const formData: Partial<ProductFormData> = {
    sku: product.sku,
    name: product.name,
    description: product.description || "",
    supplierId: product.supplierId,
    supplierSku: product.supplierSku || "",
    costPrice: Number(product.costPrice),
    wholesalePrice: Number(product.wholesalePrice),
    retailPrice: Number(product.retailPrice),
    currentStock: product.currentStock,
    reorderLevel: product.reorderLevel,
    moq: product.moq ?? undefined,
    landedCost: product.landedCost ? Number(product.landedCost) : undefined,
    category: product.category || "",
    brand: product.brand || "",
    weightKg: product.weightKg ? Number(product.weightKg) : undefined,
    lengthCm: product.lengthCm ? Number(product.lengthCm) : undefined,
    widthCm: product.widthCm ? Number(product.widthCm) : undefined,
    heightCm: product.heightCm ? Number(product.heightCm) : undefined,
    images: product.images,
    warehouseLocation: product.warehouseLocation || "",
    status: product.status as "ACTIVE" | "DISCONTINUED",
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#212861]">Edit Product</h2>
        <p className="text-[#6B7280]">
          Update the information for {product.name}.
        </p>
      </div>

      <EditProductForm
        id={id}
        initialData={formData}
      />
      </div>
    </div>
  );
}
