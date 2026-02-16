import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  orderNumber: string;
  type: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  companyName?: string | null;
  shippingAddress?: string | null;
  city?: string | null;
  createdAt: Date;
  items: Array<{
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  shippingFee: number;
  discount?: number | null;
  total: number;
  paidAmount: number;
  notes?: string | null;
}

/**
 * Generate and print an invoice PDF
 */
export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF();

  // Company info (you can customize this)
  const companyName = "Stock Pilot";
  const companyAddress = "Business Address\nCity, Country\nPhone: +1 234 567 890";
  const companyEmail = "info@stockpilot.com";

  // Colors
  const primaryColor: [number, number, number] = [33, 40, 97]; // #212861
  const grayColor: [number, number, number] = [107, 114, 128]; // #6B7280

  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("INVOICE", 105, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(companyName, 105, yPos, { align: "center" });
  yPos += 5;
  doc.setFontSize(8);
  doc.text(companyAddress, 105, yPos, { align: "center" });
  yPos += 15;

  // Order Info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice Number: ${data.orderNumber}`, 14, yPos);
  yPos += 6;
  doc.text(`Date: ${data.createdAt.toLocaleDateString()}`, 14, yPos);
  yPos += 6;
  doc.text(`Order Type: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`, 14, yPos);
  yPos += 15;

  // Customer Info
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Bill To:", 14, yPos);
  yPos += 5;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.customerName, 14, yPos);
  yPos += 5;

  if (data.companyName) {
    doc.text(data.companyName, 14, yPos);
    yPos += 5;
  }

  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, 14, yPos);
    yPos += 5;
  }

  if (data.customerEmail) {
    doc.text(`Email: ${data.customerEmail}`, 14, yPos);
    yPos += 5;
  }

  // Shipping Address (if not retail)
  if (data.type !== "retail" && data.shippingAddress) {
    yPos += 5;
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Ship To:", 14, yPos);
    yPos += 5;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const addressLines = data.shippingAddress.split('\n');
    addressLines.forEach((line) => {
      doc.text(line, 14, yPos);
      yPos += 5;
    });
    if (data.city) {
      doc.text(data.city, 14, yPos);
      yPos += 5;
    }
  }

  yPos += 10;

  // Items Table
  const tableData = data.items.map((item) => [
    item.productName,
    item.productSku,
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.totalPrice.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Product", "SKU", "Quantity", "Unit Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [33, 40, 97],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const rightMargin = 196;
  const labelX = 150;
  const valueX = rightMargin;

  // Subtotal
  doc.text("Subtotal:", labelX, yPos);
  doc.text(`$${data.subtotal.toFixed(2)}`, valueX, yPos, { align: "right" });
  yPos += 6;

  // Shipping
  doc.text("Shipping:", labelX, yPos);
  doc.text(`$${data.shippingFee.toFixed(2)}`, valueX, yPos, { align: "right" });
  yPos += 6;

  // Discount
  if (data.discount && data.discount > 0) {
    doc.setTextColor(34, 197, 94); // green
    doc.text("Discount:", labelX, yPos);
    doc.text(`-$${data.discount.toFixed(2)}`, valueX, yPos, { align: "right" });
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }

  // Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", labelX, yPos);
  doc.text(`$${data.total.toFixed(2)}`, valueX, yPos, { align: "right" });
  yPos += 10;

  // Payment Status
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const paid = data.paidAmount;
  const balance = data.total - paid;

  doc.text("Amount Paid:", labelX, yPos);
  doc.text(`$${paid.toFixed(2)}`, valueX, yPos, { align: "right" });
  yPos += 6;

  if (balance > 0) {
    doc.setTextColor(220, 38, 38); // red
    doc.text("Balance Due:", labelX, yPos);
    doc.text(`$${balance.toFixed(2)}`, valueX, yPos, { align: "right" });
  } else {
    doc.setTextColor(34, 197, 94); // green
    doc.text("Status:", labelX, yPos);
    doc.text("PAID IN FULL", valueX, yPos, { align: "right" });
  }
  doc.setTextColor(0, 0, 0);

  yPos += 20;

  // Notes (if any)
  if (data.notes) {
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Notes:", 14, yPos);
    yPos += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(data.notes, 180);
    noteLines.forEach((line: string) => {
      doc.text(line, 14, yPos);
      yPos += 4;
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;

  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Thank you for your business!", 105, footerY, { align: "center" });
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, footerY + 5, { align: "center" });

  // Open print dialog
  doc.autoPrint();
}

/**
 * Download invoice PDF without printing
 */
export function downloadInvoicePDF(data: InvoiceData, filename?: string): void {
  const doc = new jsPDF();

  // Company info
  const companyName = "Stock Pilot";
  const companyAddress = "Business Address\nCity, Country\nPhone: +1 234 567 890";
  const companyEmail = "info@stockpilot.com";

  // Colors
  const primaryColor = [33, 40, 97];
  const grayColor = [107, 114, 128];

  let yPos = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("INVOICE", 105, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text(companyName, 105, yPos, { align: "center" });
  yPos += 5;
  doc.setFontSize(8);
  doc.text(companyAddress, 105, yPos, { align: "center" });
  yPos += 15;

  // Order Info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice Number: ${data.orderNumber}`, 14, yPos);
  yPos += 6;
  doc.text(`Date: ${data.createdAt.toLocaleDateString()}`, 14, yPos);
  yPos += 6;
  doc.text(`Order Type: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`, 14, yPos);
  yPos += 15;

  // Customer Info
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Bill To:", 14, yPos);
  yPos += 5;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(data.customerName, 14, yPos);
  yPos += 5;

  if (data.companyName) {
    doc.text(data.companyName, 14, yPos);
    yPos += 5;
  }

  if (data.customerPhone) {
    doc.text(`Phone: ${data.customerPhone}`, 14, yPos);
    yPos += 5;
  }

  if (data.customerEmail) {
    doc.text(`Email: ${data.customerEmail}`, 14, yPos);
    yPos += 5;
  }

  // Shipping Address
  if (data.type !== "retail" && data.shippingAddress) {
    yPos += 5;
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Ship To:", 14, yPos);
    yPos += 5;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const addressLines = data.shippingAddress.split('\n');
    addressLines.forEach((line) => {
      doc.text(line, 14, yPos);
      yPos += 5;
    });
    if (data.city) {
      doc.text(data.city, 14, yPos);
      yPos += 5;
    }
  }

  yPos += 10;

  // Items Table
  const tableData = data.items.map((item) => [
    item.productName,
    item.productSku,
    item.quantity.toString(),
    `$${item.unitPrice.toFixed(2)}`,
    `$${item.totalPrice.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Product", "SKU", "Quantity", "Unit Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [33, 40, 97],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const rightMargin = 196;
  const labelX = 150;
  const valueX = rightMargin;

  doc.text("Subtotal:", labelX, yPos);
  doc.text(`$${data.subtotal.toFixed(2)}`, valueX, yPos, { align: "right" });
  yPos += 6;

  doc.text("Shipping:", labelX, yPos);
  doc.text(`$${data.shippingFee.toFixed(2)}`, valueX, yPos, { align: "right" });
  yPos += 6;

  if (data.discount && data.discount > 0) {
    doc.setTextColor(34, 197, 94);
    doc.text("Discount:", labelX, yPos);
    doc.text(`-$${data.discount.toFixed(2)}`, valueX, yPos, { align: "right" });
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", labelX, yPos);
  doc.text(`$${data.total.toFixed(2)}`, valueX, yPos, { align: "right" });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const paid = data.paidAmount;
  const balance = data.total - paid;

  doc.text("Amount Paid:", labelX, yPos);
  doc.text(`$${paid.toFixed(2)}`, valueX, yPos, { align: "right" });
  yPos += 6;

  if (balance > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text("Balance Due:", labelX, yPos);
    doc.text(`$${balance.toFixed(2)}`, valueX, yPos, { align: "right" });
  } else {
    doc.setTextColor(34, 197, 94);
    doc.text("Status:", labelX, yPos);
    doc.text("PAID IN FULL", valueX, yPos, { align: "right" });
  }

  // Notes
  if (data.notes) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Notes:", 14, yPos);
    yPos += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(data.notes, 180);
    noteLines.forEach((line: string) => {
      doc.text(line, 14, yPos);
      yPos += 4;
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 20;

  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Thank you for your business!", 105, footerY, { align: "center" });
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, footerY + 5, { align: "center" });

  // Save the PDF
  const defaultFilename = `Invoice_${data.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename || defaultFilename);
}
