/**
 * Export data to CSV file and trigger download (Client-side only)
 */
export async function exportToCSV(
  data: any[],
  filename: string,
  headers: string[]
): Promise<void> {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Convert data to CSV format
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = value.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
          return `"${escaped}"`;
        }
        return escaped;
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }

  const csvContent = csvRows.join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Format date for CSV export
 */
export function formatDateForExport(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toISOString().split('T')[0];
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForExport(amount: number | { toNumber: () => number }): string {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return num.toFixed(2);
}
