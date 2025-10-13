import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(delivery: any) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(217, 97, 118); // Primary color
  doc.text('ManisBizz', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Invois Penghantaran', 20, 28);
  
  // Invoice details
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Invois #: ${delivery.id.substring(0, 8).toUpperCase()}`, 20, 45);
  doc.text(`Tarikh: ${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')}`, 20, 52);
  doc.text(`Vendor: ${delivery.vendorName}`, 20, 59);
  
  // Status
  doc.setFontSize(10);
  const statusText = delivery.status === 'claimed' ? 'DIBAYAR' : 
                    delivery.status === 'pending' ? 'PENDING' : 
                    delivery.status === 'rejected' ? 'DITOLAK' : 'DIHANTAR';
  doc.text(`Status: ${statusText}`, 150, 45);
  
  // Items table
  const tableData = delivery.items?.map((item: any) => [
    item.productName,
    item.quantity.toString(),
    `RM ${parseFloat(item.unitPrice).toFixed(2)}`,
    `RM ${parseFloat(item.totalPrice).toFixed(2)}`
  ]) || [];
  
  autoTable(doc, {
    startY: 70,
    head: [['Produk', 'Kuantiti', 'Harga/Unit', 'Jumlah']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [217, 97, 118] },
    styles: { font: 'helvetica' },
  });
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 70;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Jumlah Keseluruhan: RM ${parseFloat(delivery.totalAmount).toFixed(2)}`, 20, finalY + 15);
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text('Terima kasih atas perniagaan anda!', 20, finalY + 30);
  
  // Save
  doc.save(`invois-${delivery.vendorName}-${delivery.id.substring(0, 8)}.pdf`);
}

export function generateMiniInvoicePDF(delivery: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5'
  });
  
  // Compact header
  doc.setFontSize(16);
  doc.setTextColor(217, 97, 118);
  doc.text('ManisBizz', 10, 12);
  
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Resit Penghantaran', 10, 18);
  
  // Invoice details - compact
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text(`#${delivery.id.substring(0, 8).toUpperCase()}`, 10, 28);
  doc.text(`${new Date(delivery.deliveryDate).toLocaleDateString('ms-MY')}`, 10, 33);
  doc.text(`${delivery.vendorName}`, 10, 38);
  
  // Status badge
  doc.setFontSize(7);
  const statusText = delivery.status === 'claimed' ? 'DIBAYAR' : 
                    delivery.status === 'pending' ? 'PENDING' : 
                    delivery.status === 'rejected' ? 'DITOLAK' : 'DIHANTAR';
  doc.text(`Status: ${statusText}`, 10, 43);
  
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
    startY: 48,
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
  const finalY = (doc as any).lastAutoTable.finalY || 48;
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
