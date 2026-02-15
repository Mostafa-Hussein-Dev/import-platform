"use client";

import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, ExternalLink, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/potential-products/status-badge";
import { MarginDetail } from "@/components/potential-products/margin-display";
import { StatusActions } from "@/components/potential-products/status-actions";
import { ConversionDialog } from "@/components/potential-products/conversion-dialog";
import { DeletePotentialProductDialog } from "@/components/potential-products/delete-dialog";
import { getPotentialProduct } from "@/lib/actions/potential-products";
import { useEffect, useState } from "react";

export default function ViewPotentialProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [potentialProduct, setPotentialProduct] = useState<any>(null);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetchProduct(p.id);
    });
  }, [params]);

  async function fetchProduct(productId: string) {
    const result = await getPotentialProduct(productId);
    if (!result.success || !result.data) {
      setNotFoundFlag(true);
    } else {
      setPotentialProduct(result.data);
    }
  }

  function handleRefresh() {
    if (id) {
      fetchProduct(id);
      setRefreshKey((k) => k + 1);
    }
  }

  if (notFoundFlag) {
    notFound();
  }

  if (!potentialProduct) {
    return <div className="py-8 text-center text-[#6B7280]">Loading...</div>;
  }

  return (
    <div className="space-y-6" key={refreshKey}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/potential-products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#212861]">{potentialProduct.name}</h1>
            <p className="text-[#6B7280]">Potential product details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {potentialProduct.status !== "CONVERTED" && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/potential-products/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between bg-[#F9FAFB] rounded-lg p-4 gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <StatusBadge status={potentialProduct.status} />
          {potentialProduct.status === "RESEARCHING" && (
            <p className="text-sm text-[#6B7280]">
              This product is currently under research and evaluation
            </p>
          )}
          {potentialProduct.status === "APPROVED" && (
            <p className="text-sm text-[#6B7280]">
              This product has been approved and is ready to be converted to the catalog
            </p>
          )}
          {potentialProduct.status === "REJECTED" && (
            <p className="text-sm text-[#6B7280]">
              This product was rejected. You can move it back to research if needed.
            </p>
          )}
          {potentialProduct.status === "CONVERTED" && (
            <p className="text-sm text-[#6B7280]">
              This product has been converted to the main catalog
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {potentialProduct.status !== "CONVERTED" && (
            <StatusActions id={id!} status={potentialProduct.status} onSuccess={handleRefresh} />
          )}
          {potentialProduct.status === "APPROVED" && (
            <Button size="sm" onClick={() => setConvertOpen(true)}>
              <Package className="h-4 w-4 mr-2" />
              Convert to Product
            </Button>
          )}
          {potentialProduct.status === "CONVERTED" && potentialProduct.product && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/products/${potentialProduct.product.id}`}>
                <Package className="h-4 w-4 mr-2" />
                View Product in Catalog
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
          {potentialProduct.status !== "CONVERTED" && (
            <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      </div>

      {potentialProduct.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {potentialProduct.images.map((url: string, index: number) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg bg-[#F3F4F6] overflow-hidden block"
                >
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Product Name</p>
              <p className="font-medium">{potentialProduct.name}</p>
            </div>
            {potentialProduct.description && (
              <div>
                <p className="text-sm text-[#6B7280]">Description</p>
                <p className="text-sm whitespace-pre-wrap">{potentialProduct.description}</p>
              </div>
            )}
            {potentialProduct.sourceUrl && (
              <div>
                <p className="text-sm text-[#6B7280]">Source URL</p>
                <a
                  href={potentialProduct.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3A9FE1] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Source
                </a>
              </div>
            )}
            <div>
              <p className="text-sm text-[#6B7280]">Created</p>
              <p className="text-sm">
                {new Date(potentialProduct.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {potentialProduct.category && potentialProduct.brand && (
            <Card>
              <CardHeader>
                <CardTitle>Physical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {potentialProduct.category && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Category</p>
                        <p className="font-medium">{potentialProduct.category}</p>
                      </div>
                  )}
                  {potentialProduct.brand && (
                      <div>
                        <p className="text-sm text-[#6B7280]">Brand</p>
                        <p className="font-medium">{potentialProduct.brand}</p>
                      </div>
                  )}
                </div>

                {potentialProduct.weightKg && (
                    <div>
                      <p className="text-sm text-[#6B7280]">Weight</p>
                      <p className="font-medium">{potentialProduct.weightKg} kg</p>
                    </div>
                )}

                {(potentialProduct.lengthCm ||
                    potentialProduct.widthCm ||
                    potentialProduct.heightCm) && (
                    <div>
                      <p className="text-sm text-[#6B7280]">
                        Dimensions (L&times;W&times;H)
                      </p>
                      <p className="font-medium">
                        {potentialProduct.lengthCm || "—"} &times;{" "}
                        {potentialProduct.widthCm || "—"} &times;{" "}
                        {potentialProduct.heightCm || "—"} cm
                      </p>
                    </div>
                )}
              </CardContent>
            </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {potentialProduct.supplier ? (
              <>
                <div>
                  <p className="text-sm text-[#6B7280]">Supplier</p>
                  <Link
                    href={`/dashboard/suppliers/${potentialProduct.supplier.id}`}
                    className="font-medium text-[#3A9FE1] hover:underline"
                  >
                    {potentialProduct.supplier.companyName}
                  </Link>
                </div>
                {potentialProduct.supplierSku && (
                  <div>
                    <p className="text-sm text-[#6B7280]">Supplier SKU</p>
                    <p className="font-medium">{potentialProduct.supplierSku}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[#9CA3AF]">No supplier assigned yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Estimates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Estimated Cost</p>
              <p className="text-2xl font-bold">
                ${potentialProduct.estimatedCost?.toFixed(2) || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Estimated Selling Price</p>
              <p className="text-2xl font-bold">
                ${potentialProduct.estimatedPrice?.toFixed(2) || "—"}
              </p>
            </div>
            <MarginDetail
              cost={potentialProduct.estimatedCost}
              price={potentialProduct.estimatedPrice}
              moq={potentialProduct.moq}
            />
            {potentialProduct.moq && (
              <div>
                <p className="text-sm text-[#6B7280]">Minimum Order Quantity</p>
                <p className="font-medium">{potentialProduct.moq} units</p>
              </div>
            )}
          </CardContent>
        </Card>

        {potentialProduct.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Research Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{potentialProduct.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <DeletePotentialProductDialog
        id={id!}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={handleRefresh}
      />
      <ConversionDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        potentialProduct={potentialProduct}
      />
    </div>
  );
}
