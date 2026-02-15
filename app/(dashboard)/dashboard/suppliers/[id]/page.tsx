import { getSupplier } from "@/lib/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Mail, Phone, Globe, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteSupplierButton } from "./delete-button";

export default async function ViewSupplierPage({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/suppliers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-[#212861]">
              {supplier.companyName}
            </h2>
            <p className="text-[#6B7280]">{supplier.contactPerson || "No contact"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/suppliers/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteSupplierButton id={id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Status</p>
              <Badge variant={supplier.isActive ? "default" : "secondary"}>
                {supplier.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Country</p>
              <p className="font-medium">{supplier.country}</p>
            </div>
            {supplier.rating && (
              <div>
                <p className="text-sm text-[#6B7280]">Rating</p>
                <p className="font-medium">{supplier.rating}/5</p>
              </div>
            )}
            {supplier.website && (
              <div>
                <p className="text-sm text-[#6B7280]">Website</p>
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#3A9FE1] hover:underline flex items-center gap-1"
                >
                  <Globe className="h-4 w-4" />
                  {supplier.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.email && (
              <div>
                <p className="text-sm text-[#6B7280]">Email</p>
                <a
                  href={`mailto:${supplier.email}`}
                  className="font-medium text-[#3A9FE1] hover:underline flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.phone && (
              <div>
                <p className="text-sm text-[#6B7280]">Phone</p>
                <p className="font-medium flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {supplier.phone}
                </p>
              </div>
            )}
            {supplier.whatsapp && (
              <div>
                <p className="text-sm text-[#6B7280]">WhatsApp</p>
                <p className="font-medium">{supplier.whatsapp}</p>
              </div>
            )}
            {supplier.wechat && (
              <div>
                <p className="text-sm text-[#6B7280]">WeChat</p>
                <p className="font-medium">{supplier.wechat}</p>
              </div>
            )}
            {supplier.address && (
              <div>
                <p className="text-sm text-[#6B7280]">Address</p>
                <p className="font-medium flex items-start gap-1">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  {supplier.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Business Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.paymentTerms && (
              <div>
                <p className="text-sm text-[#6B7280]">Payment Terms</p>
                <p className="font-medium">{supplier.paymentTerms}</p>
              </div>
            )}
            {supplier.leadTime && (
              <div>
                <p className="text-sm text-[#6B7280]">Lead Time</p>
                <p className="font-medium">{supplier.leadTime}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {supplier.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{supplier.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({supplier.products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="text-[#3A9FE1] hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.currentStock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-[#9CA3AF] text-center py-4">
              No products from this supplier yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
