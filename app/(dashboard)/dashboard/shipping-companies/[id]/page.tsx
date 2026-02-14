import { getShippingCompany } from "@/lib/actions/shipping-companies";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Mail, Phone, Ship, DollarSign, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ShippingCompanyViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getShippingCompany(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const company = result.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/shipping-companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#212861]">{company.name}</h1>
            <p className="text-[#6B7280]">Shipping Company Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/shipping-companies/${company.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Company Name</p>
              <p className="font-medium text-[#212861]">{company.name}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Shipping Type</p>
              <Badge className="mt-1">{company.type.toUpperCase()}</Badge>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Contact Person</p>
              <p className="font-medium text-[#212861]">{company.contactPerson || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Status</p>
              <Badge
                className={
                  company.isActive
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 mt-1"
                    : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6] mt-1"
                }
              >
                {company.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#9CA3AF]" />
                <p className="font-medium text-[#212861]">{company.email || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#9CA3AF]" />
                <p className="font-medium text-[#212861]">{company.phone || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Shipping Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[#6B7280]">Rate per Kg</p>
              <p className="text-lg font-semibold text-[#212861]">
                {company.ratePerKg ? `$${company.ratePerKg.toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Rate per CBM</p>
              <p className="text-lg font-semibold text-[#212861]">
                {company.ratePerCBM ? `$${company.ratePerCBM.toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Minimum Charge</p>
              <p className="text-lg font-semibold text-[#212861]">
                {company.minCharge ? `$${company.minCharge.toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#6B7280]">Transit Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#9CA3AF]" />
                <p className="font-medium text-[#212861]">{company.transitTime || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {company.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#374151] whitespace-pre-wrap">{company.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Shipments */}
      {company.shipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Shipments ({company.shipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {company.shipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-[#212861]">{shipment.shipmentNumber}</p>
                    <p className="text-sm text-[#6B7280]">
                      {shipment.method} · {shipment.departureDate ? new Date(shipment.departureDate).toLocaleDateString() : "TBD"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        shipment.status === "delivered"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : shipment.status === "pending"
                          ? "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        }
                    >
                      {shipment.status}
                    </Badge>
                    <p className="text-sm font-medium text-[#212861] mt-1">
                      ${shipment.totalCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
