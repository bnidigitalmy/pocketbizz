import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Shared letterhead renderer for professional invoices
export function renderLetterhead(doc: jsPDF, businessProfile?: any, compact: boolean = false): number {
  if (!businessProfile) {
    // Fallback to simple header if no business profile
    doc.setFontSize(compact ? 16 : 24);
    doc.setTextColor(217, 97, 118);
    doc.text('ManisBizz', compact ? 10 : 20, compact ? 12 : 20);
    return compact ? 25 : 35;
  }

  const margin = compact ? 10 : 20;
  let yPos = compact ? 10 : 15;

  // Business name
  doc.setFontSize(compact ? 16 : 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 97, 118);
  doc.text(businessProfile.businessName || 'ManisBizz', margin, yPos);
  yPos += compact ? 5 : 7;

  // Tagline (if available)
  if (businessProfile.tagline && !compact) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text(businessProfile.tagline, margin, yPos);
    yPos += 5;
  }

  // Contact information block
  doc.setFontSize(compact ? 7 : 9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  
  if (businessProfile.address) {
    doc.text(businessProfile.address, margin, yPos);
    yPos += compact ? 3 : 4;
  }
  
  if (businessProfile.phone || businessProfile.email) {
    let contact = '';
    if (businessProfile.phone) contact += `Tel: ${businessProfile.phone}`;
    if (businessProfile.phone && businessProfile.email) contact += '  |  ';
    if (businessProfile.email) contact += `Email: ${businessProfile.email}`;
    doc.text(contact, margin, yPos);
    yPos += compact ? 3 : 4;
  }
  
  if (businessProfile.registrationNumber && !compact) {
    doc.text(`No. Pendaftaran: ${businessProfile.registrationNumber}`, margin, yPos);
    yPos += 4;
  }

  // Separator line
  yPos += compact ? 2 : 3;
  doc.setLineWidth(compact ? 0.3 : 0.5);
  doc.setDrawColor(217, 97, 118);
  doc.line(margin, yPos, doc.internal.pageSize.width - margin, yPos);
  yPos += compact ? 5 : 8;

  return yPos;
}

export function generateInvoicePDF(delivery: any, businessProfile?: any) {
  const doc = new jsPDF();
  
  // Render letterhead
  let yPos = renderLetterhead(doc, businessProfile, false);
  
  // Document title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('INVOIS PENGHANTARAN', 20, yPos);
  yPos += 10;
  
  // Two-column layout: Invoice details (left) and Vendor details (right)
  const leftCol = 20;
  const rightCol = 110;
  
  // Left: Invoice metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. Invois: ${delivery.id.substring(0, 8).toUpperCase()}`, leftCol, yPos);
  doc.text(`Tarikh: ${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')}`, leftCol, yPos + 5);
  
  // Payment status indicator
  const paymentStatusMap: {[key: string]: string} = {
    'pending': 'Belum Dibayar',
    'partial': 'Bayaran Separa',
    'settled': 'Telah Dibayar'
  };
  const paymentStatus = paymentStatusMap[delivery.paymentStatus] || 'Belum Dibayar';
  doc.text(`Status Bayaran: ${paymentStatus}`, leftCol, yPos + 10);
  
  // Right: Vendor (Bill To)
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada:', rightCol, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(delivery.vendorName, rightCol, yPos + 5);
  
  yPos += 20;
  
  // Items table
  const tableData = delivery.items?.map((item: any) => {
    const row = [
      item.productName,
      item.quantity.toString(),
      `RM ${parseFloat(item.unitPrice).toFixed(2)}`,
      `RM ${parseFloat(item.totalPrice).toFixed(2)}`
    ];
    
    // Add rejection info if exists
    if (item.rejectedQty && item.rejectedQty > 0) {
      row.push(`${item.rejectedQty} ditolak`);
    } else {
      row.push('-');
    }
    
    return row;
  }) || [];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Produk', 'Kuantiti', 'Harga/Unit', 'Jumlah', 'Tolakan']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [217, 97, 118],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'center', textColor: [200, 100, 50] }
    },
    styles: { 
      font: 'helvetica',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
  });
  
  // Total section
  const finalY = (doc as any).lastAutoTable.finalY || yPos;
  yPos = finalY + 10;
  
  // Total box
  doc.setFillColor(245, 245, 245);
  doc.rect(110, yPos - 5, 80, 15, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(110, yPos - 5, 80, 15);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('JUMLAH KESELURUHAN:', 115, yPos + 3);
  doc.setTextColor(217, 97, 118);
  doc.text(`RM ${parseFloat(delivery.totalAmount).toFixed(2)}`, 115, yPos + 9, { align: 'left' });
  
  // Footer
  yPos += 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Terima kasih atas perniagaan anda!', 20, yPos);
  doc.text('Sila buat pembayaran dalam tempoh 7 hari dari tarikh invois ini.', 20, yPos + 5);
  
  // Save
  doc.save(`invois-${delivery.vendorName}-${delivery.id.substring(0, 8)}.pdf`);
}

export function generateMiniInvoicePDF(delivery: any, businessProfile?: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });
  
  // Render compact letterhead
  let yPos = renderLetterhead(doc, businessProfile, true);
  
  // Document title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('RESIT PENGHANTARAN', 10, yPos);
  yPos += 6;
  
  // Invoice details - compact
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`No: ${delivery.id.substring(0, 8).toUpperCase()}`, 10, yPos);
  doc.text(`Tarikh: ${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')}`, 10, yPos + 4);
  doc.text(`Kepada: ${delivery.vendorName}`, 10, yPos + 8);
  
  yPos += 15;
  
  // Items table - compact
  const tableData = delivery.items?.map((item: any) => {
    const row = [
      item.productName,
      item.quantity.toString(),
      `RM ${parseFloat(item.unitPrice).toFixed(2)}`,
      `RM ${parseFloat(item.totalPrice).toFixed(2)}`
    ];
    return row;
  }) || [];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Produk', 'Qty', 'Harga', 'Jumlah']],
    body: tableData,
    theme: 'grid',
    margin: { left: 10, right: 10 },
    headStyles: { 
      fillColor: [217, 97, 118],
      fontSize: 8,
      cellPadding: 1.5
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' }
    },
    styles: { 
      font: 'helvetica',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
  });
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY || yPos;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`JUMLAH: RM ${parseFloat(delivery.totalAmount).toFixed(2)}`, 10, finalY + 8);
  
  // Footer - compact
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text('Terima kasih!', 10, finalY + 16);
  
  // Save
  doc.save(`resit-${delivery.vendorName}-${delivery.id.substring(0, 8)}.pdf`);
}

export function generateClaimStatementPDF(
  vendorName: string,
  deliveries: any[],
  dateFrom: string,
  dateTo: string,
  businessProfile?: any
) {
  const doc = new jsPDF();
  
  // Render letterhead
  let yPos = renderLetterhead(doc, businessProfile, false);
  
  // Document title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('PENYATA TUNTUTAN', 20, yPos);
  yPos += 10;
  
  // Statement metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Penyata No: ST-${new Date().getTime().toString().substring(5)}`, 20, yPos);
  doc.text(`Tarikh Jana: ${new Date().toLocaleDateString('ms-MY')}`, 20, yPos + 5);
  doc.text(`Tempoh: ${new Date(dateFrom).toLocaleDateString('ms-MY')} - ${new Date(dateTo).toLocaleDateString('ms-MY')}`, 20, yPos + 10);
  
  // Vendor info
  doc.setFont('helvetica', 'bold');
  doc.text('Vendor:', 110, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(vendorName, 110, yPos + 5);
  
  yPos += 20;
  
  // Statement table
  const tableData = deliveries.map((delivery: any) => {
    const paymentStatusMap: {[key: string]: string} = {
      'pending': 'Belum Bayar',
      'partial': 'Sebahagian',
      'settled': 'Selesai'
    };
    
    return [
      delivery.id.substring(0, 8).toUpperCase(),
      new Date(delivery.deliveryDate).toLocaleDateString('ms-MY'),
      `RM ${parseFloat(delivery.totalAmount).toFixed(2)}`,
      paymentStatusMap[delivery.paymentStatus] || 'Belum Bayar'
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['No. Invois', 'Tarikh', 'Jumlah', 'Status Bayaran']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [217, 97, 118],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 50, halign: 'center' }
    },
    styles: { 
      font: 'helvetica',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
  });
  
  // Calculate totals
  const finalY = (doc as any).lastAutoTable.finalY || yPos;
  yPos = finalY + 10;
  
  const totalAmount = deliveries.reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);
  const settledAmount = deliveries
    .filter(d => d.paymentStatus === 'settled')
    .reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);
  const partialAmount = deliveries
    .filter(d => d.paymentStatus === 'partial')
    .reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);
  const pendingAmount = deliveries
    .filter(d => d.paymentStatus === 'pending')
    .reduce((sum, d) => sum + parseFloat(d.totalAmount), 0);
  // Outstanding = total - fully settled (partial + pending still owed)
  const outstandingAmount = totalAmount - settledAmount;
  
  // Summary box
  doc.setFillColor(250, 250, 250);
  doc.rect(20, yPos - 5, 170, 35, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, yPos - 5, 170, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  
  doc.text(`Jumlah Keseluruhan:`, 25, yPos + 2);
  doc.text(`RM ${totalAmount.toFixed(2)}`, 100, yPos + 2);
  
  doc.text(`Telah Dibayar:`, 25, yPos + 8);
  doc.setTextColor(0, 150, 0);
  doc.text(`RM ${settledAmount.toFixed(2)}`, 100, yPos + 8);
  
  doc.setTextColor(0);
  doc.text(`Bayaran Separa:`, 25, yPos + 14);
  doc.setTextColor(200, 100, 0);
  doc.text(`RM ${partialAmount.toFixed(2)}`, 100, yPos + 14);
  
  doc.setTextColor(0);
  doc.text(`Belum Dibayar:`, 25, yPos + 20);
  doc.setTextColor(200, 0, 0);
  doc.text(`RM ${pendingAmount.toFixed(2)}`, 100, yPos + 20);
  
  // Outstanding total
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 97, 118);
  doc.text(`Baki Tertunggak:`, 25, yPos + 28);
  doc.text(`RM ${outstandingAmount.toFixed(2)}`, 100, yPos + 28);
  
  // Footer
  yPos += 45;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Sila buat pembayaran baki tertunggak dalam tempoh 7 hari dari tarikh penyata ini.', 20, yPos);
  doc.text('Hubungi kami jika terdapat sebarang percanggahan dalam penyata ini.', 20, yPos + 5);
  
  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`penyata-${vendorName.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.pdf`);
}

export function generateProfitLossReport(reportData: any, topProducts: any[], topVendors: any[]) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(217, 97, 118);
  doc.text('ManisBizz', 20, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Laporan Untung Rugi', 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Tarikh: ${new Date().toLocaleDateString('ms-MY')}`, 20, 38);
  
  // Summary
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Jumlah Jualan: RM ${reportData.totalSales}`, 20, 55);
  doc.text(`Jumlah Kos: RM ${reportData.totalCosts}`, 20, 63);
  doc.setFont('helvetica', 'bold');
  doc.text(`Untung Bersih: RM ${reportData.netProfit}`, 20, 71);
  doc.text(`Margin: ${reportData.profitMargin}%`, 20, 79);
  doc.setFont('helvetica', 'normal');
  
  // Top Products
  if (topProducts && topProducts.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Produk Paling Untung', 20, 95);
    doc.setFont('helvetica', 'normal');
    
    const productData = topProducts.slice(0, 5).map((p: any) => [
      p.name,
      p.totalSold?.toString() || '0',
      `RM ${p.totalProfit}`
    ]);
    
    autoTable(doc, {
      startY: 100,
      head: [['Produk', 'Terjual', 'Untung']],
      body: productData,
      theme: 'striped',
      headStyles: { fillColor: [217, 97, 118] },
    });
  }
  
  // Top Vendors
  if (topVendors && topVendors.length > 0) {
    const vendorStartY = (doc as any).lastAutoTable?.finalY || 130;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendor Paling Aktif', 20, vendorStartY + 15);
    doc.setFont('helvetica', 'normal');
    
    const vendorData = topVendors.slice(0, 5).map((v: any) => [
      v.name,
      v.totalDeliveries?.toString() || '0',
      `RM ${v.totalAmount}`
    ]);
    
    autoTable(doc, {
      startY: vendorStartY + 20,
      head: [['Vendor', 'Penghantaran', 'Jumlah']],
      body: vendorData,
      theme: 'striped',
      headStyles: { fillColor: [217, 97, 118] },
    });
  }
  
  // Save
  doc.save(`laporan-untung-rugi-${new Date().toISOString().split('T')[0]}.pdf`);
}
