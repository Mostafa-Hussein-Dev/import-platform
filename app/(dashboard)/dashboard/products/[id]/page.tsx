import { getProduct } from "@/lib/actions/products";
import { getProductStockMovements } from "@/lib/actions/stock-movements";
import { notFound } from "next/navigation";
import { ProductDetail } from "./product-detail";

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

  // Get stock movements for this product
  const movementsResult = await getProductStockMovements(id, 5);
  const movements = movementsResult.success ? movementsResult.data ?? [] : [];

  return <ProductDetail product={product} movements={movements} />;
}
