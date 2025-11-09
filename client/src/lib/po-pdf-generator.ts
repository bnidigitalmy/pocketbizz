import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface POItem {
  itemName: string;
  quantity: string;
  unit: string;
  estimatedPrice: string;
  notes?: string | null;
}

export interface POData {
  poNumber: string;
  supplierName: string;
  supplierPhone?: string | null;
  supplierEmail?: string | null;
  supplierAddress?: string | null;
  deliveryAddress?: string | null;
  totalAmount: string;
  notes?: string | null;
  createdAt: string;
  status: string;
  items: POItem[];
  // New optional fields for better PO
  expectedDeliveryDate?: string | null;
  paymentTerms?: string | null;
  paymentMethod?: string | null;
  requestedBy?: string | null;
  discount?: string | null;
  tax?: string | null;
  shippingCharges?: string | null;
}

export interface BusinessInfo {
  name: string;
  registrationNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export function generatePOPDF(poData: POData, businessInfo?: BusinessInfo) {
  const doc = new jsPDF();
  
  // Set default business info if not provided
  const business = businessInfo || {
    name: "PocketBizz",
    address: "Malaysia",
    phone: "",
    email: ""
  };

  const pageWidth = doc.internal.pageSize.width;
  let yPos = 15;

  // ============ HEADER SECTION ============
  // Business Logo/Name (Left) + "PURCHASE ORDER" (Right)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(business.name, 14, yPos);
  
  doc.setTextColor(51, 102, 255); // Blue color for PO title
  doc.text("PURCHASE ORDER", pageWidth - 14, yPos, { align: "right" });
  doc.setTextColor(0, 0, 0); // Reset to black

  yPos += 8;

  // Business contact info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (business.registrationNumber) {
    doc.text(`Reg No: ${business.registrationNumber}`, 14, yPos);
    yPos += 4;
  }
  if (business.address) {
    const addressLines = doc.splitTextToSize(business.address, 80);
    doc.text(addressLines, 14, yPos);
    yPos += addressLines.length * 4;
  }
  if (business.phone || business.email) {
    const contactText = [business.phone, business.email].filter(Boolean).join(" | ");
    doc.text(contactText, 14, yPos);
    yPos += 4;
  }

  yPos += 5;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 8;

  // ============ PO DETAILS & SUPPLIER INFO ============
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  // Left column - PO Details
  const leftColX = 14;
  const rightColX = pageWidth / 2 + 5;
  
  doc.text("PO Details:", leftColX, yPos);
  doc.setFont("helvetica", "normal");
  yPos += 5;
  
  doc.setFont("helvetica", "bold");
  doc.text("PO Number:", leftColX, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(poData.poNumber, leftColX + 25, yPos);
  yPos += 5;
  
  const poDate = new Date(poData.createdAt).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.setFont("helvetica", "bold");
  doc.text("Tarikh:", leftColX, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(poDate, leftColX + 25, yPos);
  yPos += 5;
  
  doc.setFont("helvetica", "bold");
  doc.text("Status:", leftColX, yPos);
  doc.setFont("helvetica", "normal");
  const statusMap: Record<string, string> = {
    draft: "Draf",
    sent: "Dihantar",
    received: "Diterima",
    cancelled: "Dibatal"
  };
  doc.text(statusMap[poData.status] || poData.status, leftColX + 25, yPos);
  yPos += 5;

  // Expected Delivery Date (NEW)
  if (poData.expectedDeliveryDate) {
    const deliveryDate = new Date(poData.expectedDeliveryDate).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    doc.setFont("helvetica", "bold");
    doc.text("Tarikh Jangka:", leftColX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(deliveryDate, leftColX + 30, yPos);
    yPos += 5;
  }

  // Payment Terms (NEW)
  if (poData.paymentTerms) {
    doc.setFont("helvetica", "bold");
    doc.text("Terma Bayaran:", leftColX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(poData.paymentTerms, leftColX + 30, yPos);
    yPos += 5;
  }

  // Right column - Supplier Info
  const supplierStartY = yPos - 15;
  doc.setFont("helvetica", "bold");
  doc.text("Supplier Details:", rightColX, supplierStartY);
  doc.setFont("helvetica", "normal");
  
  let supplierY = supplierStartY + 5;
  doc.setFont("helvetica", "bold");
  doc.text("Nama:", rightColX, supplierY);
  doc.setFont("helvetica", "normal");
  const supplierNameLines = doc.splitTextToSize(poData.supplierName, 75);
  doc.text(supplierNameLines, rightColX + 15, supplierY);
  supplierY += supplierNameLines.length * 4 + 1;
  
  if (poData.supplierPhone) {
    doc.setFont("helvetica", "bold");
    doc.text("Telefon:", rightColX, supplierY);
    doc.setFont("helvetica", "normal");
    doc.text(poData.supplierPhone, rightColX + 15, supplierY);
    supplierY += 5;
  }
  
  if (poData.supplierEmail) {
    doc.setFont("helvetica", "bold");
    doc.text("Email:", rightColX, supplierY);
    doc.setFont("helvetica", "normal");
    doc.text(poData.supplierEmail, rightColX + 15, supplierY);
    supplierY += 5;
  }
  
  if (poData.supplierAddress) {
    doc.setFont("helvetica", "bold");
    doc.text("Alamat:", rightColX, supplierY);
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(poData.supplierAddress, 75);
    doc.text(addressLines, rightColX + 15, supplierY);
    supplierY += addressLines.length * 4;
  }

  yPos = Math.max(yPos, supplierY);
  yPos += 5;
  
  // ============ DELIVERY ADDRESS ============
  if (poData.deliveryAddress) {
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 6;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Alamat Penghantaran:", 14, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const deliveryLines = doc.splitTextToSize(poData.deliveryAddress, pageWidth - 28);
    doc.text(deliveryLines, 14, yPos);
    yPos += deliveryLines.length * 4 + 6;
  }

  yPos += 5;

  // ============ ITEMS TABLE ============
  const tableData = poData.items.map((item, index) => {
    const lineTotal = (parseFloat(item.quantity) * parseFloat(item.estimatedPrice || "0")).toFixed(2);
    return [
      (index + 1).toString(),
      item.itemName,
      item.quantity,
      item.unit,
      `RM ${parseFloat(item.estimatedPrice || "0").toFixed(2)}`,
      `RM ${lineTotal}`,
      item.notes || "-"
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Item', 'Kuantiti', 'Unit', 'Harga (RM)', 'Jumlah (RM)', 'Nota']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [51, 102, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 15 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 30 }
    },
    didDrawPage: (data) => {
      yPos = data.cursor?.y || yPos;
    }
  });

  yPos += 10;

  // ============ TOTAL SECTION WITH BREAKDOWN ============
  const totalBoxX = pageWidth - 70;
  let totalBoxY = yPos;
  const totalBoxWidth = 56;

  // Calculate amounts
  const subtotal = poData.items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) * parseFloat(item.estimatedPrice || "0"));
  }, 0);
  
  const discount = parseFloat(poData.discount || "0");
  const shipping = parseFloat(poData.shippingCharges || "0");
  const tax = parseFloat(poData.tax || "0");
  const total = subtotal - discount + shipping + tax;

  // Subtotal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Subtotal:", totalBoxX + 2, totalBoxY);
  doc.text(`RM ${subtotal.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalBoxY, { align: "right" });
  totalBoxY += 5;

  // Discount (if any)
  if (discount > 0) {
    doc.text("Diskaun:", totalBoxX + 2, totalBoxY);
    doc.text(`- RM ${discount.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalBoxY, { align: "right" });
    totalBoxY += 5;
  }

  // Shipping (if any)
  if (shipping > 0) {
    doc.text("Kos Penghantaran:", totalBoxX + 2, totalBoxY);
    doc.text(`RM ${shipping.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalBoxY, { align: "right" });
    totalBoxY += 5;
  }

  // Tax (if any)
  if (tax > 0) {
    doc.text("Cukai/SST:", totalBoxX + 2, totalBoxY);
    doc.text(`RM ${tax.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalBoxY, { align: "right" });
    totalBoxY += 5;
  }

  // Total with background
  doc.setFillColor(51, 102, 255);
  doc.rect(totalBoxX, totalBoxY, totalBoxWidth, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("JUMLAH KESELURUHAN:", totalBoxX + 2, totalBoxY + 7);
  doc.setFontSize(12);
  doc.text(`RM ${total.toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalBoxY + 7, { align: "right" });
  doc.setTextColor(0, 0, 0); // Reset color

  yPos = totalBoxY + 18;

  // ============ NOTES SECTION ============
  if (poData.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Catatan:", 14, yPos);
    yPos += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const notesLines = doc.splitTextToSize(poData.notes, pageWidth - 28);
    doc.text(notesLines, 14, yPos);
    yPos += notesLines.length * 4 + 5;
  }

  // ============ PAYMENT METHOD ============
  if (poData.paymentMethod) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Cara Bayaran:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(poData.paymentMethod, 40, yPos);
    yPos += 6;
  }

  // ============ TERMS & CONDITIONS ============
  yPos += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Terma & Syarat:", 14, yPos);
  yPos += 4;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const terms = [
    `• Pembayaran: ${poData.paymentTerms || '30 hari selepas penghantaran'}`,
    "• Sila sahkan penerimaan PO ini dalam masa 2 hari bekerja",
    "• Barang yang rosak atau tidak seperti yang dipesan boleh dikembalikan",
    "• Harga adalah tetap dan tidak boleh diubah tanpa persetujuan bertulis",
    "• Penghantaran hendaklah mengikut jadual yang ditetapkan"
  ];
  
  terms.forEach(term => {
    doc.text(term, 14, yPos);
    yPos += 4;
  });

  // ============ SIGNATURE SECTION ============
  yPos += 8;
  
  const sigWidth = 60;
  const leftSigX = 14;
  const rightSigX = pageWidth - sigWidth - 14;
  
  // Buyer/Requested By signature
  doc.setDrawColor(100, 100, 100);
  doc.line(leftSigX, yPos, leftSigX + sigWidth, yPos);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Disediakan Oleh:", leftSigX, yPos + 5);
  if (poData.requestedBy) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(poData.requestedBy, leftSigX, yPos + 10);
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Tarikh: ${poDate}`, leftSigX, yPos + 14);
  
  // Supplier Acknowledgment signature
  doc.line(rightSigX, yPos, rightSigX + sigWidth, yPos);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Disahkan Oleh (Supplier):", rightSigX, yPos + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Nama: _________________", rightSigX, yPos + 10);
  doc.text("Tarikh: ________________", rightSigX, yPos + 14);

  // ============ FOOTER ============
  const footerY = doc.internal.pageSize.height - 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY, pageWidth - 14, footerY);
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(`Dokumen ini dijana secara automatik. Untuk pertanyaan, sila hubungi ${business.phone || business.email || 'kami'}.`, pageWidth / 2, footerY + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`PO: ${poData.poNumber}`, 14, footerY + 8);
  doc.text(`Halaman 1`, pageWidth - 14, footerY + 8, { align: "right" });
  doc.setTextColor(0, 0, 0); // Reset color

  return doc;
}

// Helper function to download PDF
export function downloadPOPDF(poData: POData, businessInfo?: BusinessInfo) {
  const doc = generatePOPDF(poData, businessInfo);
  doc.save(`${poData.poNumber}.pdf`);
}

// Helper function to get PDF as blob (for email attachment)
export function getPOPDFBlob(poData: POData, businessInfo?: BusinessInfo): Blob {
  const doc = generatePOPDF(poData, businessInfo);
  return doc.output('blob');
}
