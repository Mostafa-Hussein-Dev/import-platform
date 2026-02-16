"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Package, AlertCircle } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  images: string[];
  currentStock: number;
  wholesalePrice: number;
  retailPrice: number;
  landedCost: number | null;
  supplier: {
    id: string;
    companyName: string;
  };
}

interface ProductSelectorDialogProps {
  onProductSelect: (product: Product) => void;
  orderType: "online" | "wholesale" | "retail";
}

export function ProductSelectorDialog({
  onProductSelect,
  orderType,
}: ProductSelectorDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const router = useRouter();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/products?search=${encodeURIComponent(search)}&limit=50`
      );
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts();
  };

  const handleSelectProduct = (product: Product) => {
    onProductSelect(product);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    }
    if (stock < 10) {
      return (
        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200">
          <AlertCircle className="h-3 w-3" />
          Low Stock ({stock})
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-green-600 border-green-200">
        In Stock ({stock})
      </Badge>
    );
  };

  const getPrice = (product: Product) => {
    if (orderType === "wholesale") {
      return product.wholesalePrice;
    }
    return product.retailPrice;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
          <DialogDescription>
            Search and select a product to add to this order
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Search */}
          <div className="flex gap-2 flex-shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button type="button" onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>

          {/* Results */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[65vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-sm text-muted-foreground">Loading products...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                  <Package className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {search
                      ? "No products found. Try a different search term."
                      : "Enter a search term to find products."}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        {product.images[0] ? (
                          <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium truncate">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {product.supplier.companyName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                ${getPrice(product).toFixed(2)}
                              </p>
                              {orderType === "wholesale" && (
                                <p className="text-xs text-muted-foreground">
                                  Wholesale
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {getStockStatus(product.currentStock)}
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSelectProduct(product)}
                              disabled={product.currentStock === 0}
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
