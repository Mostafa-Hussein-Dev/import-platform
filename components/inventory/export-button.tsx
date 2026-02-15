"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { getInventoryExportData } from "@/lib/actions/inventory";
import { exportInventoryToCSV, downloadCSV, generateExportFilename } from "@/lib/utils/export-csv";
import { toast } from "@/components/ui/use-toast";

interface ExportButtonProps {
  filters?: {
    supplierId?: string;
  };
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);

    try {
      const result = await getInventoryExportData(filters);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to export inventory");
      }

      const csv = exportInventoryToCSV(result.data);
      const filename = generateExportFilename();
      downloadCSV(csv, filename);

      toast({
        title: "Success",
        description: "Inventory exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export inventory",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export
        </>
      )}
    </Button>
  );
}
