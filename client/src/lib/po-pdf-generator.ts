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

  // ============ TOTAL SECTION ============
  const totalBoxX = pageWidth - 70;
  const totalBoxY = yPos;
  const totalBoxWidth = 56;

  doc.setFillColor(245, 245, 245);
  doc.rect(totalBoxX, totalBoxY, totalBoxWidth, 12, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("JUMLAH KESELURUHAN:", totalBoxX + 2, totalBoxY + 8);
  doc.setFontSize(12);
  doc.text(`RM ${parseFloat(poData.totalAmount).toFixed(2)}`, totalBoxX + totalBoxWidth - 2, totalBoxY + 8, { align: "right" });

  yPos = totalBoxY + 20;

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

  // ============ TERMS & CONDITIONS ============
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Terma & Syarat:", 14, yPos);
  yPos += 4;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("• Pembayaran dalam masa 30 hari selepas penghantaran", 14, yPos);
  yPos += 4;
  doc.text("• Sila sahkan penerimaan PO ini dalam masa 2 hari bekerja", 14, yPos);
  yPos += 4;
  doc.text("• Barang yang rosak atau tidak seperti yang dipesan boleh dikembalikan", 14, yPos);

  // ============ FOOTER ============
  const footerY = doc.internal.pageSize.height - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY, pageWidth - 14, footerY);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`PO Number: ${poData.poNumber}`, 14, footerY + 5);
  doc.text(`Page 1`, pageWidth - 14, footerY + 5, { align: "right" });
  doc.text("Generated by PocketBizz", pageWidth / 2, footerY + 5, { align: "center" });

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
