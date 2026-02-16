"use client";

import { Check, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OrderStatus, orderStatusInfo } from "@/types/order";

const statusFlow: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

interface StatusTimelineProps {
  currentStatus: OrderStatus;
}

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const currentIndex = statusFlow.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center py-4">
        <Badge variant="destructive" className="text-sm px-4 py-2">
          Order Cancelled
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-4">
      {statusFlow.map((status, index) => {
        const info = orderStatusInfo[status];
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={status} className="flex-1 flex items-center">
            {/* Status circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-muted-foreground/30"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium mt-2 text-center",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {info.label}
              </span>
            </div>

            {/* Connector line */}
            {index < statusFlow.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-colors",
                  index < currentIndex ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
