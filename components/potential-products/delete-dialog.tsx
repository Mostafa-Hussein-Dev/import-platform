"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { deletePotentialProduct } from "@/lib/actions/potential-products";
import { toast } from "@/components/ui/use-toast";

interface DeletePotentialProductDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeletePotentialProductDialog({
  id,
  open,
  onOpenChange,
  onSuccess,
}: DeletePotentialProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deletePotentialProduct(id);

    setIsDeleting(false);

    if (result.success) {
      toast({ title: "Potential product deleted successfully" });
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast({ title: result.error || "Failed to delete potential product", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Potential Product</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete this potential product?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
