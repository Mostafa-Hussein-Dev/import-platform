"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X, Link2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createPotentialProduct, updatePotentialProduct } from "@/lib/actions/potential-products";
import { getSuppliers } from "@/lib/actions/suppliers";
import { toast } from "@/components/ui/use-toast";
import { potentialProductFormSchema, type PotentialProductFormData } from "@/lib/validations/potential-product";

interface PotentialProductFormProps {
  initialData?: Partial<PotentialProductFormData & { id: string }>;
  isEditing?: boolean;
  isReadOnly?: boolean;
}

export function PotentialProductForm({
  initialData,
  isEditing = false,
  isReadOnly = false,
}: PotentialProductFormProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Array<{ id: string; companyName: string }>>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.images || []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState<"researching" | "approved" | null>(null);

  const form = useForm<PotentialProductFormData>({
    resolver: zodResolver(potentialProductFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      supplierId: initialData?.supplierId || "",
      supplierSku: initialData?.supplierSku || "",
      estimatedCost: initialData?.estimatedCost || undefined,
      estimatedPrice: initialData?.estimatedPrice || undefined,
      moq: initialData?.moq || undefined,
      sourceUrl: initialData?.sourceUrl || "",
      notes: initialData?.notes || "",
      images: initialData?.images || [],
      category: initialData?.category || "",
      brand: initialData?.brand || "",
      weightKg: initialData?.weightKg || undefined,
      lengthCm: initialData?.lengthCm || undefined,
      widthCm: initialData?.widthCm || undefined,
      heightCm: initialData?.heightCm || undefined,
      status: initialData?.status || "RESEARCHING",
    },
  });

  // Fetch suppliers on mount
  useEffect(() => {
    getSuppliers({ status: "all", page: 1, pageSize: "25", sortBy: "createdAt", sortOrder: "desc" }).then((result) => {
      if (result.success && result.data) {
        setSuppliers(result.data.suppliers);
      }
    });
  }, []);

  const estimatedCost = form.watch("estimatedCost");
  const estimatedPrice = form.watch("estimatedPrice");
  const notes = form.watch("notes");

  const margin =
    estimatedCost && estimatedPrice
      ? ((estimatedPrice - estimatedCost) / estimatedCost) * 100
      : null;
  const profit =
    estimatedCost && estimatedPrice ? estimatedPrice - estimatedCost : null;

  async function onSubmit(data: PotentialProductFormData) {
    const submitData = {
      ...data,
      images: imageUrls,
      status: (isSuccess ? "APPROVED" : "RESEARCHING") as "APPROVED" | "RESEARCHING",
    };

    setIsSubmitting(true);

    const result = isEditing && initialData?.id
      ? await updatePotentialProduct(initialData.id, submitData)
      : await createPotentialProduct(submitData);

    setIsSubmitting(false);

    if (result.success) {
      toast({ title: `Potential product ${isEditing ? "updated" : "created"} successfully` });
      if (isEditing && initialData?.id) {
        router.push(`/dashboard/potential-products/${initialData.id}`);
      } else if ((result.data as { id?: string })?.id) {
        router.push(`/dashboard/potential-products/${(result.data as { id: string }).id}`);
      }
    } else {
      toast({ title: result.error || "Failed to save potential product", variant: "destructive" });
    }
  }

  function addImageUrl() {
    if (newImageUrl && imageUrls.length < 10) {
      setImageUrls([...imageUrls, newImageUrl]);
      setNewImageUrl("");
    }
  }

  function removeImageUrl(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  if (isReadOnly) {
    return (
      <div className="space-y-6">
        <Card className="border-gray-200 bg-[#F9FAFB]">
          <CardContent className="pt-6">
            <p className="text-[#6B7280]">
              This potential product has been converted to a product and is now read-only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g., Wireless Bluetooth Headphones"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              {...form.register("description")}
              placeholder="Product description, features, specifications..."
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Source */}
      <Card>
        <CardHeader>
          <CardTitle>Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL</Label>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#9CA3AF]" />
              <Input
                id="sourceUrl"
                {...form.register("sourceUrl")}
                placeholder="https://alibaba.com/product/..."
              />
            </div>
            {form.formState.errors.sourceUrl && (
              <p className="text-sm text-red-600">{form.formState.errors.sourceUrl.message}</p>
            )}
            <p className="text-sm text-[#6B7280]">
              Link to Alibaba, 1688, or supplier catalog
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Physical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...form.register("category")}
                placeholder="e.g., Electronics, Home & Kitchen"
              />
              {form.formState.errors.category && (
                <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                {...form.register("brand")}
                placeholder="e.g., Sony, Apple, Nike"
              />
              {form.formState.errors.brand && (
                <p className="text-sm text-red-600">{form.formState.errors.brand.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              type="number"
              step="0.01"
              {...form.register("weightKg", { valueAsNumber: true })}
              placeholder="0.00"
            />
            {form.formState.errors.weightKg && (
              <p className="text-sm text-red-600">{form.formState.errors.weightKg.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lengthCm">Length (cm)</Label>
              <Input
                id="lengthCm"
                type="number"
                step="0.1"
                {...form.register("lengthCm", { valueAsNumber: true })}
                placeholder="0.0"
              />
              {form.formState.errors.lengthCm && (
                <p className="text-sm text-red-600">{form.formState.errors.lengthCm.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="widthCm">Width (cm)</Label>
              <Input
                id="widthCm"
                type="number"
                step="0.1"
                {...form.register("widthCm", { valueAsNumber: true })}
                placeholder="0.0"
              />
              {form.formState.errors.widthCm && (
                <p className="text-sm text-red-600">{form.formState.errors.widthCm.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input
                id="heightCm"
                type="number"
                step="0.1"
                {...form.register("heightCm", { valueAsNumber: true })}
                placeholder="0.0"
              />
              {form.formState.errors.heightCm && (
                <p className="text-sm text-red-600">{form.formState.errors.heightCm.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplierId">Supplier</Label>
            <Select
              value={form.watch("supplierId") || "none"}
              onValueChange={(value) => form.setValue("supplierId", value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supplier yet</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierSku">Supplier SKU</Label>
            <Input
              id="supplierSku"
              {...form.register("supplierSku")}
              placeholder="Supplier's SKU for this product"
            />
            {form.formState.errors.supplierSku && (
              <p className="text-sm text-red-600">{form.formState.errors.supplierSku.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Estimates */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Estimates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost (USD)</Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                {...form.register("estimatedCost", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {form.formState.errors.estimatedCost && (
                <p className="text-sm text-red-600">{form.formState.errors.estimatedCost.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedPrice">Estimated Selling Price (USD)</Label>
              <Input
                id="estimatedPrice"
                type="number"
                step="0.01"
                {...form.register("estimatedPrice", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {form.formState.errors.estimatedPrice && (
                <p className="text-sm text-red-600">{form.formState.errors.estimatedPrice.message}</p>
              )}
            </div>
          </div>

          {margin !== null && (
            <div className="bg-[#F9FAFB] rounded-lg p-4">
              <p className="text-sm text-[#6B7280] mb-1">Estimated Margin:</p>
              <p
                className={`text-2xl font-bold ${
                  margin > 0 ? "text-emerald-600" : margin < 0 ? "text-red-600" : "text-[#6B7280]"
                }`}
              >
                {margin > 0 ? "+" : ""}
                {margin.toFixed(1)}% (${profit?.toFixed(2)} profit per unit)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="moq">MOQ - Minimum Order Quantity</Label>
            <Input
              id="moq"
              type="number"
              {...form.register("moq", { valueAsNumber: true })}
              placeholder="e.g., 100"
            />
            {form.formState.errors.moq && (
              <p className="text-sm text-red-600">{form.formState.errors.moq.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Enter image URL..."
            />
            <Button
              type="button"
              onClick={addImageUrl}
              disabled={!newImageUrl || imageUrls.length >= 10}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg bg-[#F3F4F6] overflow-hidden">
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImageUrl(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-[#6B7280]">
            Enter image URLs from supplier or upload to your storage
          </p>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Research Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={6}
              {...form.register("notes")}
              placeholder="Add any research notes, observations, or considerations..."
            />
            <p className="text-sm text-[#6B7280]">
              {notes?.length || 0} / 5000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <div className="flex-1" />
        <Button
          type="submit"
          variant="default"
          onClick={() => setIsSuccess(null)}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save as Researching
        </Button>
        {!isEditing && (
          <Button
            type="submit"
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setIsSuccess("approved")}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save as Approved
          </Button>
        )}
        {isEditing && (
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update
          </Button>
        )}
      </div>
    </form>
  );
}
