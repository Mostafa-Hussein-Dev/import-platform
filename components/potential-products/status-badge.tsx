import { Badge } from "@/components/ui/badge";
import type { PotentialProductStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: PotentialProductStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    RESEARCHING: {
      label: "Researching",
      variant: "default" as const,
      className: "bg-sky-500 hover:bg-sky-600 text-white",
    },
    APPROVED: {
      label: "Approved",
      variant: "default" as const,
      className: "bg-emerald-500 hover:bg-emerald-600 text-white",
    },
    REJECTED: {
      label: "Rejected",
      variant: "destructive" as const,
      className: "",
    },
    CONVERTED: {
      label: "In Catalog",
      variant: "default" as const,
      className: "bg-purple-500 hover:bg-purple-600 text-white",
    },
  };

  const { label, variant, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {status === "CONVERTED" && (
        <span className="mr-1">✓</span>
      )}
      {label}
    </Badge>
  );
}
