"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Check, X, RotateCcw } from "lucide-react";
import { updatePotentialProductStatus } from "@/lib/actions/potential-products";
import { toast } from "@/components/ui/use-toast";
import type { PotentialProductStatus } from "@prisma/client";

interface StatusActionsProps {
  id: string;
  status: PotentialProductStatus;
  onSuccess?: () => void;
}

export function StatusActions({ id, status, onSuccess }: StatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleStatusUpdate(newStatus: "APPROVED" | "REJECTED" | "RESEARCHING") {
    setIsLoading(true);
    const result = await updatePotentialProductStatus(id, newStatus);

    setIsLoading(false);

    if (result.success) {
      toast({ title: `Status updated to ${newStatus.toLowerCase()}` });
      onSuccess?.();
    } else {
      toast({ title: result.error || "Failed to update status", variant: "destructive" });
    }
  }

  if (status === "CONVERTED") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Update Status
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "RESEARCHING" && (
          <>
            <DropdownMenuItem onClick={() => handleStatusUpdate("APPROVED")}>
              <Check className="h-4 w-4 mr-2 text-emerald-500" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate("REJECTED")}>
              <X className="h-4 w-4 mr-2 text-red-500" />
              Reject
            </DropdownMenuItem>
          </>
        )}
        {status === "APPROVED" && (
          <DropdownMenuItem onClick={() => handleStatusUpdate("RESEARCHING")}>
            <RotateCcw className="h-4 w-4 mr-2 text-[#9CA3AF]" />
            Move back to Research
          </DropdownMenuItem>
        )}
        {status === "REJECTED" && (
          <DropdownMenuItem onClick={() => handleStatusUpdate("RESEARCHING")}>
            <RotateCcw className="h-4 w-4 mr-2 text-[#9CA3AF]" />
            Move back to Research
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
