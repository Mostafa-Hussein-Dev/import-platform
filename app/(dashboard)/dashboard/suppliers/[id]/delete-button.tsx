"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteSupplier } from "@/lib/actions/suppliers";
import { toast } from "@/components/ui/use-toast";

interface DeleteSupplierButtonProps {
  id: string;
}

export function DeleteSupplierButton({ id }: DeleteSupplierButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    const result = await deleteSupplier(id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      router.push("/dashboard/suppliers");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete supplier",
        variant: "destructive",
      });
    }
  }

  return (
    <Button type="button" variant="destructive" onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  );
}
