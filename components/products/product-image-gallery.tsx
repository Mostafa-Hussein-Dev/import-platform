"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Package, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex justify-center">
        <div className="h-28 w-28 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
          <Package className="h-12 w-12 text-[#D1D5DB]" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Small centered clickable image */}
      <div className="flex justify-center">
        <div
          className="h-28 w-28 relative rounded-xl overflow-hidden bg-[#F3F4F6] cursor-pointer group"
          onClick={() => { setSelectedIndex(0); setLightboxOpen(true); }}
        >
          <Image
            src={images[0]}
            alt={productName}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-200"
            sizes="112px"
          />
          {images.length > 1 && (
            <div className="absolute inset-0 flex items-end justify-center pb-0.5">
              <span className="bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                +{images.length - 1}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox overlay — portaled to body to escape stacking contexts */}
      {lightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/80 text-sm font-medium z-10">
            {(previewIndex !== null ? previewIndex : selectedIndex) + 1} / {images.length}
          </div>

          {/* Previous */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 text-white hover:bg-white/20 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Image */}
          <div
            className="relative max-w-[85vw] max-h-[75vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[previewIndex !== null ? previewIndex : selectedIndex]}
              alt={`${productName} ${(previewIndex !== null ? previewIndex : selectedIndex) + 1}`}
              fill
              className="object-contain"
              sizes="85vw"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 text-white hover:bg-white/20 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`h-14 w-14 relative rounded-lg overflow-hidden cursor-pointer transition-all duration-150 ${
                    index === selectedIndex
                      ? "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                      : "opacity-50 hover:opacity-100"
                  }`}
                  onMouseEnter={() => setPreviewIndex(index)}
                  onMouseLeave={() => setPreviewIndex(null)}
                  onClick={() => { setSelectedIndex(index); setPreviewIndex(null); }}
                >
                  <Image
                    src={image}
                    alt={`${productName} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
