"use client";

import Link from "next/link";
import { ArrowRight, Edit, Eye, Trash2, ShoppingCart, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { MarginDisplay } from "./margin-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { useState } from "react";
import { DeletePotentialProductDialog } from "./delete-dialog";
import type { PotentialProductStatus } from "@prisma/client";

interface PotentialProductCardProps {
  id: string;
  name: string;
  images: string[];
  supplier: { id: string; companyName: string } | null;
  estimatedCost: number | null;
  estimatedPrice: number | null;
  moq: number | null;
  status: PotentialProductStatus;
  onDelete?: () => void;
}

export function PotentialProductCard({
  id,
  name,
  images,
  supplier,
  estimatedCost,
  estimatedPrice,
  moq,
  status,
  onDelete,
}: PotentialProductCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square bg-[#F3F4F6]">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#9CA3AF]">
              <ImageOff className="h-16 w-16 text-gray-300" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Name */}
          <h3 className="font-semibold text-[#212861] line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>

          {/* Supplier */}
          {supplier ? (
            <Link
              href={`/dashboard/suppliers/${supplier.id}`}
              className="text-sm text-[#6B7280] hover:text-[#212861]"
            >
              {supplier.companyName}
            </Link>
          ) : (
            <p className="text-sm text-[#9CA3AF]">No supplier yet</p>
          )}

          {/* Margin */}
          <div>
            <p className="text-xs text-[#6B7280]">Est. Margin</p>
            <MarginDisplay cost={estimatedCost} price={estimatedPrice} />
          </div>

          {/* MOQ */}
          {moq && (
            <div className="text-sm text-[#6B7280]">
              MOQ: {moq} units
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/potential-products/${id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {status !== "CONVERTED" && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/potential-products/${id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>

            {status === "APPROVED" && (
              <Button size="sm" asChild>
                <Link href={`/dashboard/potential-products/${id}`}>
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Convert
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <DeletePotentialProductDialog
        id={id}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={onDelete}
      />
    </Card>
  );
}
