import { getProduct } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { formatCurrency, calculateMargin, getMarginColor } from "@/lib/utils";
import { DeleteProductButton } from "./delete-button";

export default async function ViewProductPage({
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
  const images = product.images || [];

  const wholesaleMargin = calculateMargin(
    Number(product.costPrice),
    Number(product.wholesalePrice)
  );
  const retailMargin = calculateMargin(
    Number(product.costPrice),
    Number(product.retailPrice)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-[#212861]">{product.name}</h2>
            <p className="text-[#6B7280] font-mono">{product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/products/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteProductButton id={id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            {images.length > 0 ? (
              <div className="grid gap-4 grid-cols-2">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square relative rounded-lg overflow-hidden bg-[#F3F4F6]"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[#6B7280]">Status</p>
                <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
                  {product.status === "ACTIVE" ? "Active" : "Discontinued"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Supplier</p>
                <Link
                  href={`/dashboard/suppliers/${product.supplier.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {product.supplier.companyName}
                </Link>
              </div>
              {product.supplierSku && (
                <div>
                  <p className="text-sm text-[#6B7280]">Supplier SKU</p>
                  <p className="font-medium">{product.supplierSku}</p>
                </div>
              )}
              {product.category && (
                <div>
                  <p className="text-sm text-[#6B7280]">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
              )}
              {product.brand && (
                <div>
                  <p className="text-sm text-[#6B7280]">Brand</p>
                  <p className="font-medium">{product.brand}</p>
                </div>
              )}
              {product.description && (
                <div>
                  <p className="text-sm text-[#6B7280]">Description</p>
                  <p className="text-sm">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[#6B7280]">Current Stock</p>
                <p className="text-xl font-bold text-[#212861]">
                  {product.currentStock}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Reorder Level</p>
                <p className="font-medium">{product.reorderLevel}</p>
              </div>
              {product.warehouseLocation && (
                <div>
                  <p className="text-sm text-[#6B7280]">Warehouse Location</p>
                  <p className="font-medium">{product.warehouseLocation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-[#6B7280]">Cost Price</p>
              <p className="text-xl font-bold text-[#212861]">
                {formatCurrency(Number(product.costPrice))}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Wholesale Price</p>
              <p className="text-xl font-bold text-[#212861]">
                {formatCurrency(Number(product.wholesalePrice))}
              </p>
              <p className={`text-sm ${getMarginColor(wholesaleMargin)}`}>
                {wholesaleMargin.toFixed(2)}% margin
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Retail Price</p>
              <p className="text-xl font-bold text-[#212861]">
                {formatCurrency(Number(product.retailPrice))}
              </p>
              <p className={`text-sm ${getMarginColor(retailMargin)}`}>
                {retailMargin.toFixed(2)}% margin
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      {(product.weightKg || product.lengthCm || product.widthCm || product.heightCm || product.landedCost || product.moq) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {product.weightKg && (
              <div>
                <p className="text-sm text-[#6B7280]">Weight</p>
                <p className="font-medium">{Number(product.weightKg)} kg</p>
              </div>
            )}
            {(product.lengthCm || product.widthCm || product.heightCm) && (
              <div>
                <p className="text-sm text-[#6B7280]">Dimensions (L x W x H)</p>
                <p className="font-medium">
                  {product.lengthCm || "-"} x {product.widthCm || "-"} x {product.heightCm || "-"} cm
                </p>
              </div>
            )}
            {product.moq && (
              <div>
                <p className="text-sm text-[#6B7280]">MOQ</p>
                <p className="font-medium">{product.moq} units</p>
              </div>
            )}
            {product.landedCost && (
              <div>
                <p className="text-sm text-[#6B7280]">Landed Cost</p>
                <p className="font-medium">
                  {formatCurrency(Number(product.landedCost))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
