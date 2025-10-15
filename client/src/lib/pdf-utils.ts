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
  doc.text(`No. Invois: ${delivery.invoiceNumber || delivery.id.substring(0, 8).toUpperCase()}`, leftCol, yPos);
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
  
  // Items table with Retail Price column
  const tableData = delivery.items?.map((item: any) => {
    const row = [
      item.productName,
      item.quantity.toString(),
      item.retailPrice ? `RM ${parseFloat(item.retailPrice).toFixed(2)}` : '-', // Retail Price for reference
      `RM ${parseFloat(item.unitPrice).toFixed(2)}`, // Price to vendor
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
    head: [['Produk', 'Qty', 'Harga Jualan', 'Harga', 'Jumlah', 'Tolakan']],
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
      0: { cellWidth: 50 },  // Product name - narrower
      1: { cellWidth: 15, halign: 'center' },  // Qty
      2: { cellWidth: 25, halign: 'right' },   // RP (Retail Price)
      3: { cellWidth: 25, halign: 'right' },   // Harga (Price to vendor)
      4: { cellWidth: 25, halign: 'right' },   // Jumlah (Total)
      5: { cellWidth: 30, halign: 'center', textColor: [200, 100, 50] }  // Tolakan
    },
    styles: { 
      font: 'helvetica',
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
  });
  
  // Commission Breakdown Section
  const finalY = (doc as any).lastAutoTable.finalY || yPos;
  yPos = finalY + 10;
  
  // Breakdown box - right aligned
  const breakdownX = 100;
  const breakdownWidth = 90;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('RINGKASAN:', breakdownX, yPos);
  yPos += 7;
  
  // Line items
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Jumlah Kasar (Gross)
  doc.text('Jumlah Kasar:', breakdownX, yPos);
  doc.text(`RM ${delivery.grossAmount || '0.00'}`, breakdownX + breakdownWidth, yPos, { align: 'right' });
  yPos += 5;
  
  // Tolakan (Rejection)
  if (parseFloat(delivery.rejectedAmount || '0') > 0) {
    doc.setTextColor(200, 100, 50);
    doc.text('Tolakan:', breakdownX, yPos);
    doc.text(`- RM ${delivery.rejectedAmount}`, breakdownX + breakdownWidth, yPos, { align: 'right' });
    doc.setTextColor(0);
    yPos += 5;
  }
  
  // Jumlah Bersih (Net)
  doc.text('Jumlah Bersih:', breakdownX, yPos);
  doc.text(`RM ${delivery.netAmount || '0.00'}`, breakdownX + breakdownWidth, yPos, { align: 'right' });
  yPos += 5;
  
  // Komisyen (Commission)
  if (parseFloat(delivery.commission || '0') > 0) {
    doc.setTextColor(100, 100, 200);
    doc.text('Komisyen:', breakdownX, yPos);
    doc.text(`- RM ${delivery.commission}`, breakdownX + breakdownWidth, yPos, { align: 'right' });
    doc.setTextColor(0);
    yPos += 7;
  } else {
    yPos += 2;
  }
  
  // Separator line
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(breakdownX, yPos, breakdownX + breakdownWidth, yPos);
  yPos += 7;
  
  // Jumlah Boleh Dituntut (Claimable Amount) - highlighted
  doc.setFillColor(217, 97, 118, 0.1);
  doc.rect(breakdownX - 2, yPos - 6, breakdownWidth + 4, 10, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 97, 118);
  doc.text('JUMLAH BOLEH DITUNTUT:', breakdownX, yPos);
  doc.text(`RM ${delivery.claimableAmount || '0.00'}`, breakdownX + breakdownWidth, yPos, { align: 'right' });
  
  // Footer
  yPos += 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Terima kasih atas perniagaan anda!', 20, yPos);
  doc.text('Nota: Tuntutan tertakluk kepada jualan sebenar dan keadaan produk.', 20, yPos + 5);
  
  // Save
  const invoiceNum = delivery.invoiceNumber || delivery.id.substring(0, 8);
  doc.save(`invois-${delivery.vendorName}-${invoiceNum}.pdf`);
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
  doc.text(`No: ${delivery.invoiceNumber || delivery.id.substring(0, 8).toUpperCase()}`, 10, yPos);
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
  
  // Iterate through each delivery and show per-item breakdown
  deliveries.forEach((delivery: any, index: number) => {
    // Check for page break
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Invoice header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 97, 118);
    const invNum = delivery.invoiceNumber || delivery.id.substring(0, 8).toUpperCase();
    doc.text(`Invois ${invNum}`, 20, yPos);
    
    const paymentStatusMap: {[key: string]: string} = {
      'pending': 'Belum Bayar',
      'partial': 'Sebahagian',
      'settled': 'Selesai'
    };
    const status = paymentStatusMap[delivery.paymentStatus] || 'Belum Bayar';
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')} | ${status}`, 20, yPos + 5);
    yPos += 10;
    
    // Items table with commission breakdown
    const itemsData = delivery.items?.map((item: any) => {
      const hasCommission = item.itemGross && item.itemNet && item.itemClaimable;
      
      if (hasCommission) {
        // Show detailed commission breakdown
        const rejectedQty = item.rejectedQty || item.rejectedQuantity || 0;
        const hasRejection = parseFloat(item.itemRejected || '0') > 0;
        
        return [
          `${item.productName}\n${item.quantity}x @ RM ${parseFloat(item.unitPrice).toFixed(2)}`,
          `Kasar: RM ${item.itemGross}\n` + 
            (hasRejection ? `Tolakan (${rejectedQty}): -RM ${item.itemRejected}\n` : '') +
            `Bersih: RM ${item.itemNet}` + 
            (parseFloat(item.itemCommission || '0') > 0 ? `\nKomisyen: -RM ${item.itemCommission}` : ''),
          `RM ${item.itemClaimable}`
        ];
      } else {
        // Fallback for old items without commission data
        return [
          `${item.productName}\n${item.quantity}x @ RM ${parseFloat(item.unitPrice).toFixed(2)}`,
          '',
          `RM ${parseFloat(item.totalPrice).toFixed(2)}`
        ];
      }
    }) || [];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Produk', 'Pengiraan', 'Boleh Dituntut']],
      body: itemsData,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 60 },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      },
      styles: { 
        font: 'helvetica',
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
        cellPadding: 2
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 5;
    
    // Delivery claimable total
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    const deliveryClaimable = delivery.claimableAmount || delivery.totalAmount;
    doc.text(`Boleh Dituntut Invois: RM ${parseFloat(deliveryClaimable).toFixed(2)}`, 130, yPos, { align: 'right' });
    yPos += 8;
  });
  
  // Calculate totals using claimable amounts
  yPos += 5;
  
  const totalAmount = deliveries.reduce((sum, d) => sum + parseFloat(d.claimableAmount || d.totalAmount), 0);
  const settledAmount = deliveries
    .filter(d => d.paymentStatus === 'settled')
    .reduce((sum, d) => sum + parseFloat(d.claimableAmount || d.totalAmount), 0);
  const partialAmount = deliveries
    .filter(d => d.paymentStatus === 'partial')
    .reduce((sum, d) => sum + parseFloat(d.claimableAmount || d.totalAmount), 0);
  const pendingAmount = deliveries
    .filter(d => d.paymentStatus === 'pending')
    .reduce((sum, d) => sum + parseFloat(d.claimableAmount || d.totalAmount), 0);
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
  
  // Bank account details (if available)
  if (businessProfile?.bankName || businessProfile?.accountNumber) {
    yPos += 15;
    
    // Payment instruction box
    doc.setFillColor(255, 250, 240);
    doc.rect(20, yPos - 5, 170, 20, 'F');
    doc.setDrawColor(217, 97, 118);
    doc.setLineWidth(0.5);
    doc.rect(20, yPos - 5, 170, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 97, 118);
    doc.text('Maklumat Pembayaran:', 25, yPos + 2);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    
    let bankInfo = '';
    if (businessProfile.bankName) bankInfo += `Bank: ${businessProfile.bankName}`;
    if (businessProfile.accountNumber) {
      if (bankInfo) bankInfo += '  |  ';
      bankInfo += `No. Akaun: ${businessProfile.accountNumber}`;
    }
    if (businessProfile.accountName) {
      if (bankInfo) bankInfo += '  |  ';
      bankInfo += `Nama: ${businessProfile.accountName}`;
    }
    
    doc.setFontSize(9);
    doc.text(bankInfo, 25, yPos + 9);
  }
  
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

// 58mm Thermal Printer Format for Invoice
export function generateThermalInvoicePDF(delivery: any, businessProfile?: any) {
  // 58mm width thermal printer (actual printable area ~48mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, 200] // Width x Initial Height (will auto-expand)
  });
  
  const margin = 2;
  const contentWidth = 54; // 58 - 4mm margins
  let yPos = 3;
  
  // Business name (centered)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  const businessName = businessProfile?.businessName || 'ManisBizz';
  doc.text(businessName, 29, yPos, { align: 'center' });
  yPos += 5;
  
  // Tagline (if available)
  if (businessProfile?.tagline) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80);
    doc.text(businessProfile.tagline, 29, yPos, { align: 'center' });
    yPos += 4;
  }
  
  // Contact info (centered)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  if (businessProfile?.phone) {
    doc.text(businessProfile.phone, 29, yPos, { align: 'center' });
    yPos += 3;
  }
  
  // Separator
  yPos += 1;
  doc.setLineWidth(0.2);
  doc.setDrawColor(0);
  doc.line(margin, yPos, 58 - margin, yPos);
  yPos += 4;
  
  // Document title (centered)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOIS', 29, yPos, { align: 'center' });
  yPos += 5;
  
  // Invoice details
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`No: ${delivery.invoiceNumber || delivery.id.substring(0, 8).toUpperCase()}`, margin, yPos);
  yPos += 4;
  doc.text(`Tarikh: ${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')}`, margin, yPos);
  yPos += 4;
  doc.text(`Kepada: ${delivery.vendorName}`, margin, yPos);
  yPos += 5;
  
  // Separator
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, 58 - margin, yPos);
  yPos += 4;
  
  // Items header
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUK', margin, yPos);
  yPos += 4;
  
  // Items list
  doc.setFont('helvetica', 'normal');
  delivery.items?.forEach((item: any) => {
    // Product name
    const productName = item.productName.length > 25 
      ? item.productName.substring(0, 25) + '...'
      : item.productName;
    doc.text(productName, margin, yPos);
    yPos += 4;
    
    // Quantity x Price = Total
    const itemLine = `  ${item.quantity} x RM${parseFloat(item.unitPrice).toFixed(2)} = RM${parseFloat(item.totalPrice).toFixed(2)}`;
    doc.text(itemLine, margin, yPos);
    yPos += 4;
    
    // Rejection info (if exists)
    if (item.rejectedQty && item.rejectedQty > 0) {
      doc.setTextColor(200, 100, 0);
      doc.setFontSize(7);
      doc.text(`  ${item.rejectedQty} ditolak`, margin, yPos);
      doc.setTextColor(0);
      doc.setFontSize(8);
      yPos += 4;
    }
    
    yPos += 1; // Small gap between items
  });
  
  // Separator
  yPos += 1;
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, 58 - margin, yPos);
  yPos += 5;
  
  // Total
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('JUMLAH:', margin, yPos);
  doc.text(`RM ${parseFloat(delivery.totalAmount).toFixed(2)}`, 58 - margin, yPos, { align: 'right' });
  yPos += 6;
  
  // Payment status
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const paymentStatusMap: {[key: string]: string} = {
    'pending': 'Belum Dibayar',
    'partial': 'Bayaran Separa',
    'settled': 'Telah Dibayar'
  };
  const paymentStatus = paymentStatusMap[delivery.paymentStatus] || 'Belum Dibayar';
  doc.text(`Status: ${paymentStatus}`, 29, yPos, { align: 'center' });
  yPos += 5;
  
  // Bank details (if available)
  if (businessProfile?.bankName || businessProfile?.accountNumber) {
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, 58 - margin, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text('BAYARAN:', margin, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    if (businessProfile.bankName) {
      doc.text(`Bank: ${businessProfile.bankName}`, margin, yPos);
      yPos += 3;
    }
    if (businessProfile.accountNumber) {
      doc.text(`No: ${businessProfile.accountNumber}`, margin, yPos);
      yPos += 3;
    }
    if (businessProfile.accountName) {
      doc.text(`Nama: ${businessProfile.accountName}`, margin, yPos);
      yPos += 3;
    }
    yPos += 2;
  }
  
  // Footer
  yPos += 2;
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('Terima kasih!', 29, yPos, { align: 'center' });
  
  // Save
  const invoiceNum = delivery.invoiceNumber || delivery.id.substring(0, 8);
  doc.save(`thermal-${delivery.vendorName}-${invoiceNum}.pdf`);
}

// 58mm Thermal Printer Format for Claim Statement
export function generateThermalClaimStatementPDF(
  vendorName: string,
  deliveries: any[],
  dateFrom: string,
  dateTo: string,
  businessProfile?: any
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, 250] // Width x Initial Height
  });
  
  const margin = 2;
  let yPos = 3;
  
  // Business name (centered)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  const businessName = businessProfile?.businessName || 'ManisBizz';
  doc.text(businessName, 29, yPos, { align: 'center' });
  yPos += 5;
  
  // Contact
  if (businessProfile?.phone) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(businessProfile.phone, 29, yPos, { align: 'center' });
    yPos += 3;
  }
  
  // Separator
  yPos += 1;
  doc.setLineWidth(0.2);
  doc.setDrawColor(0);
  doc.line(margin, yPos, 58 - margin, yPos);
  yPos += 4;
  
  // Document title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PENYATA TUNTUTAN', 29, yPos, { align: 'center' });
  yPos += 5;
  
  // Vendor name
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VENDOR:', margin, yPos);
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(vendorName, margin, yPos);
  yPos += 5;
  
  // Period
  doc.setFontSize(7);
  doc.text(`Tempoh: ${new Date(dateFrom).toLocaleDateString('ms-MY')}`, margin, yPos);
  yPos += 3;
  doc.text(`hingga ${new Date(dateTo).toLocaleDateString('ms-MY')}`, margin, yPos);
  yPos += 5;
  
  // Separator
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, 58 - margin, yPos);
  yPos += 4;
  
  // Deliveries list
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SENARAI INVOIS:', margin, yPos);
  yPos += 4;
  
  doc.setFont('helvetica', 'normal');
  deliveries.forEach((delivery: any, index: number) => {
    // Invoice number header
    doc.setFont('helvetica', 'bold');
    const invNum = delivery.invoiceNumber || delivery.id.substring(0, 8).toUpperCase();
    doc.text(`${index + 1}. ${invNum}`, margin, yPos);
    yPos += 3.5;
    
    // Date and status on same line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const statusMap: {[key: string]: string} = {
      'pending': 'Belum',
      'partial': 'Separa',
      'settled': 'Selesai'
    };
    const status = statusMap[delivery.paymentStatus] || 'Belum';
    doc.text(`${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')} [${status}]`, margin + 3, yPos);
    yPos += 3.5;
    
    // Items with commission breakdown
    if (delivery.items && delivery.items.length > 0) {
      doc.setFontSize(6);
      delivery.items.forEach((item: any) => {
        const hasCommission = item.itemGross && item.itemClaimable;
        
        // Product name
        doc.setFont('helvetica', 'bold');
        doc.text(`  ${item.productName}`, margin + 3, yPos);
        yPos += 2.5;
        
        doc.setFont('helvetica', 'normal');
        
        if (hasCommission) {
          // Show commission breakdown
          const rejectedQty = item.rejectedQty || item.rejectedQuantity || 0;
          
          doc.text(`    ${item.quantity}x @ RM ${parseFloat(item.unitPrice).toFixed(2)}`, margin + 3, yPos);
          yPos += 2.5;
          
          if (rejectedQty > 0) {
            doc.text(`    Tolak: ${rejectedQty} = -RM ${item.itemRejected}`, margin + 3, yPos);
            yPos += 2.5;
          }
          
          if (parseFloat(item.itemCommission || '0') > 0) {
            doc.text(`    Komisyen: -RM ${item.itemCommission}`, margin + 3, yPos);
            yPos += 2.5;
          }
          
          doc.setFont('helvetica', 'bold');
          doc.text(`    Boleh dituntut: RM ${item.itemClaimable}`, margin + 3, yPos);
          doc.setFont('helvetica', 'normal');
          yPos += 3;
        } else {
          // Simple fallback
          doc.text(`    ${item.quantity}x @ RM ${parseFloat(item.unitPrice).toFixed(2)} = RM ${parseFloat(item.totalPrice).toFixed(2)}`, margin + 3, yPos);
          yPos += 3;
        }
      });
    }
    
    // Invoice claimable total
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const deliveryClaimable = delivery.claimableAmount || delivery.totalAmount;
    doc.text(`  Boleh dituntut: RM ${parseFloat(deliveryClaimable).toFixed(2)}`, margin + 3, yPos);
    yPos += 4;
    
    doc.setFontSize(8);
  });
  
  // Separator
  yPos += 1;
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, 58 - margin, yPos);
  yPos += 5;
  
  // Summary using claimable amounts
  const totalAmount = deliveries.reduce((sum, d) => sum + parseFloat(d.claimableAmount || d.totalAmount), 0);
  const settledAmount = deliveries
    .filter(d => d.paymentStatus === 'settled')
    .reduce((sum, d) => sum + parseFloat(d.claimableAmount || d.totalAmount), 0);
  const outstandingAmount = totalAmount - settledAmount;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Jumlah:', margin, yPos);
  doc.text(`RM ${totalAmount.toFixed(2)}`, 58 - margin, yPos, { align: 'right' });
  yPos += 4;
  
  doc.text('Dibayar:', margin, yPos);
  doc.setTextColor(0, 150, 0);
  doc.text(`RM ${settledAmount.toFixed(2)}`, 58 - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('BAKI:', margin, yPos);
  doc.setTextColor(200, 0, 0);
  doc.text(`RM ${outstandingAmount.toFixed(2)}`, 58 - margin, yPos, { align: 'right' });
  yPos += 6;
  
  // Bank details (if available)
  if (businessProfile?.bankName || businessProfile?.accountNumber) {
    doc.setTextColor(0);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, 58 - margin, yPos);
    yPos += 4;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BAYARAN:', margin, yPos);
    yPos += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    if (businessProfile.bankName) {
      doc.text(`Bank: ${businessProfile.bankName}`, margin, yPos);
      yPos += 3;
    }
    if (businessProfile.accountNumber) {
      doc.text(`No: ${businessProfile.accountNumber}`, margin, yPos);
      yPos += 3;
    }
    if (businessProfile.accountName) {
      doc.text(`Nama: ${businessProfile.accountName}`, margin, yPos);
      yPos += 3;
    }
    yPos += 2;
  }
  
  // Footer
  yPos += 2;
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('Terima kasih!', 29, yPos, { align: 'center' });
  
  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`thermal-penyata-${vendorName.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.pdf`);
}
