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

  return <ShipmentDetail shipment={result.data} />;
}
