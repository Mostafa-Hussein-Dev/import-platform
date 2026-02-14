import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPotentialProduct } from "@/lib/actions/potential-products";
import { PotentialProductForm } from "@/components/potential-products/potential-product-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPotentialProductPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getPotentialProduct(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const potentialProduct = result.data;
  const isReadOnly = potentialProduct.status === "CONVERTED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={"/dashboard/potential-products/" + id}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#212861]">
            {isReadOnly ? "View Potential Product" : "Edit Potential Product"}
          </h1>
          <p className="text-[#6B7280]">
            {isReadOnly
              ? "This product has been converted and is read-only"
              : "Update the potential product details"}
          </p>
        </div>
      </div>

      <PotentialProductForm
        initialData={{
          id: potentialProduct.id,
          name: potentialProduct.name,
          description: potentialProduct.description,
          supplierId: potentialProduct.supplierId ?? undefined,
          supplierSku: potentialProduct.supplierSku ?? undefined,
          estimatedCost: potentialProduct.estimatedCost ?? undefined,
          estimatedPrice: potentialProduct.estimatedPrice ?? undefined,
          moq: potentialProduct.moq ?? undefined,
          sourceUrl: potentialProduct.sourceUrl ?? undefined,
          images: potentialProduct.images,
          notes: potentialProduct.notes ?? undefined,
          status: potentialProduct.status,
        }}
        isEditing={true}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}

