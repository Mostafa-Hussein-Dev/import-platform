import Papa from "papaparse";

export interface InventoryExportData {
  sku: string;
  name: string;
  supplier: string;
  category: string | null;
  stock: number;
  reorderLevel: number;
  landedCost: number | null;
  totalValue: number;
}

/**
 * Convert inventory data to CSV format
 */
export function exportInventoryToCSV(data: InventoryExportData[]): string {
  const csvData = data.map((item) => ({
    SKU: item.sku,
    Name: item.name,
    Supplier: item.supplier,
    Category: item.category || "",
    Stock: item.stock,
    "Reorder Level": item.reorderLevel,
    "Landed Cost": item.landedCost !== null ? item.landedCost.toFixed(2) : "0.00",
    "Total Value": item.totalValue.toFixed(2),
  }));

  const result = Papa.unparse(csvData, {
    quotes: true,
    delimiter: ",",
    header: true,
    newline: "\n",
  });

  return result;
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate filename for inventory export
 */
export function generateExportFilename(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `inventory-report-${year}-${month}-${day}.csv`;
}
