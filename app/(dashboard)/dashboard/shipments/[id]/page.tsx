import { getShipment } from "@/lib/actions/shipments";
import { notFound } from "next/navigation";
import ShipmentDetail from "@/components/shipments/shipment-detail";

export const dynamic = "force-dynamic";

export default async function ShipmentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getShipment(id);

  if (!result.success || !result.data) {
    notFound();
  }

  // Strip Decimal fields from shippingCompany to avoid serialization errors
  const { shippingCompany, ...rest } = result.data;
  const shipment = {
    ...rest,
    shippingCompany: {
      id: shippingCompany.id,
      name: shippingCompany.name,
    },
  };

  return <ShipmentDetail shipment={shipment} />;
}
