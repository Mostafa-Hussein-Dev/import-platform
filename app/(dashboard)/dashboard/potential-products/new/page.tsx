import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PotentialProductForm } from "@/components/potential-products/potential-product-form";

export default function NewPotentialProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/potential-products">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#212861]">Add Potential Product</h1>
          <p className="text-[#6B7280]">Add a new product to your research catalog</p>
        </div>
      </div>

      <PotentialProductForm />
    </div>
  );
}
