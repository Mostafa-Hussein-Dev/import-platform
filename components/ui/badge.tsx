import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-3 py-0.5 text-[11px] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[#3A9FE1] text-white [a&]:hover:bg-[#2E8FD1]",
        secondary:
          "bg-[#E8F4FB] text-[#3A9FE1] [a&]:hover:bg-[#D4F0FB]",
        destructive:
          "bg-[#FEE2E2] text-[#EF4444] [a&]:hover:bg-[#FECACA] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-[#E5E7EB] text-[#212861] [a&]:hover:bg-[#E8F4FB] [a&]:hover:text-[#3A9FE1]",
        ghost: "text-[#6B7280] [a&]:hover:bg-[#E8F4FB] [a&]:hover:text-[#3A9FE1]",
        link: "text-[#3A9FE1] underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
