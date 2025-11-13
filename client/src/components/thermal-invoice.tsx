import { useQuery } from "@tanstack/react-query";

interface ThermalInvoiceProps {
  vendor: {
    name: string;
    address?: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    rejectedQty?: number;
    rejectionReason?: string;
    itemGross?: string;
    itemRejected?: string;
    itemNet?: string;
    itemCommission?: string;
    itemClaimable?: string;
  }>;
  invoiceNumber: string;
  deliveryDate: string;
  totalAmount: string;
}

export function ThermalInvoice({ vendor, items, invoiceNumber, deliveryDate, totalAmount }: ThermalInvoiceProps) {
  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile"],
  });

  const businessName = (businessProfile as any)?.businessName || "PocketBizz";
  const businessAddress = (businessProfile as any)?.address || "";
  const businessPhone = (businessProfile as any)?.phone || "";
  const bankName = (businessProfile as any)?.bankName || "";
  const accountNumber = (businessProfile as any)?.accountNumber || "";
  const accountName = (businessProfile as any)?.accountName || "";
  const paymentQrCode = (businessProfile as any)?.paymentQrCode || "";

  return (
    <div 
      id="thermal-invoice"
      style={{
        width: '80mm',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '10mm 5mm',
        backgroundColor: 'white',
        color: 'black',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px dashed black', paddingBottom: '10px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{businessName}</div>
        {businessAddress && <div style={{ fontSize: '10px', marginTop: '3px' }}>{businessAddress}</div>}
        {businessPhone && <div style={{ fontSize: '10px', marginTop: '2px' }}>Tel: {businessPhone}</div>}
      </div>

      {/* Invoice Info */}
      <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
        INVOIS PENGHANTARAN
      </div>

      <div style={{ marginBottom: '10px', fontSize: '11px' }}>
        <div>Kepada: <strong>{vendor.name}</strong></div>
        {vendor.address && <div style={{ fontSize: '10px', color: '#666' }}>{vendor.address}</div>}
        <div>Tarikh: {new Date(deliveryDate).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        <div>No: {invoiceNumber}</div>
      </div>

      {/* Items Table */}
      <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', paddingTop: '5px', paddingBottom: '5px', marginBottom: '5px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60% 15% 25%', fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>
          <div>Produk</div>
          <div style={{ textAlign: 'right' }}>Qty</div>
          <div style={{ textAlign: 'right' }}>Harga*</div>
        </div>
        
        {items.map((item, index) => {
          const unitPrice = parseFloat(item.unitPrice);
          const total = parseFloat(item.totalPrice);
          const hasRejected = item.rejectedQty && item.rejectedQty > 0;
          const grossAmount = parseFloat(item.itemGross || item.totalPrice);
          const rejectedAmount = parseFloat(item.itemRejected || '0');
          const netAmount = parseFloat(item.itemNet || item.totalPrice);
          
          return (
            <div key={index} style={{ marginBottom: '10px', fontSize: '11px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60% 15% 25%' }}>
                <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                <div style={{ textAlign: 'right' }}>{item.quantity}</div>
                <div style={{ textAlign: 'right' }}>{grossAmount.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: '9px', color: '#666', paddingLeft: '5px' }}>
                @ RM {unitPrice.toFixed(2)}/unit
              </div>
              
              {hasRejected && (
                <div style={{ fontSize: '9px', color: '#d97706', paddingLeft: '5px', marginTop: '2px' }}>
                  <div>❌ Rosak: {item.rejectedQty} unit</div>
                  {item.rejectionReason && <div>Sebab: {item.rejectionReason}</div>}
                  <div>Tolakan: -RM {rejectedAmount.toFixed(2)}</div>
                  <div style={{ fontWeight: 'bold' }}>Bersih: RM {netAmount.toFixed(2)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div style={{ borderTop: '2px solid black', paddingTop: '5px', marginTop: '5px', marginBottom: '10px' }}>
        {(() => {
          const totalRejected = items.reduce((sum, item) => sum + parseFloat(item.itemRejected || '0'), 0);
          const totalCommission = items.reduce((sum, item) => sum + parseFloat(item.itemCommission || '0'), 0);
          const hasRejected = totalRejected > 0;
          const hasCommission = totalCommission > 0;
          const grossTotal = items.reduce((sum, item) => sum + parseFloat(item.itemGross || item.totalPrice), 0);
          
          return (
            <div style={{ fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <div>Jumlah Kasar:</div>
                <div>RM {grossTotal.toFixed(2)}</div>
              </div>
              
              {/* Always show Tolak Rosak line */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: hasRejected ? '#d97706' : '#666' }}>
                <div>Tolak Rosak:</div>
                <div>{hasRejected ? `- RM ${totalRejected.toFixed(2)}` : 'Tiada'}</div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', borderTop: '1px dashed black', paddingTop: '3px' }}>
                <div>Jumlah Bersih:</div>
                <div>RM {(grossTotal - totalRejected).toFixed(2)}</div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderTop: '1px solid black', paddingTop: '5px', marginTop: '3px' }}>
                <div>JUMLAH KESELURUHAN:</div>
                <div>RM {(grossTotal - totalRejected).toFixed(2)}</div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Notes */}
      <div style={{ borderTop: '1px dashed black', paddingTop: '8px', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', marginBottom: '5px' }}>
          * Harga yang dipaparkan sudah ditolak komisyen vendor
        </div>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>NOTA:</div>
        <div style={{ fontSize: '9px', lineHeight: '1.4', textAlign: 'justify' }}>
          Ini adalah rekod penghantaran sahaja. Untuk tuntutan bayaran, sila rujuk dokumen "Tuntutan Bayaran" yang berasingan.
        </div>
      </div>

      {/* Payment Info */}
      {(bankName || paymentQrCode) && (
        <div style={{ borderTop: '1px dashed black', paddingTop: '8px', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '5px', textAlign: 'center' }}>
            MAKLUMAT PEMBAYARAN
          </div>
          
          {paymentQrCode && (
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <img 
                src={paymentQrCode} 
                alt="QR Payment" 
                style={{ width: '120px', height: '120px', margin: '0 auto' }}
              />
              <div style={{ fontSize: '9px', marginTop: '3px' }}>Scan untuk bayar</div>
            </div>
          )}
          
          {bankName && (
            <div style={{ fontSize: '10px', textAlign: 'center' }}>
              <div><strong>{bankName}</strong></div>
              {accountNumber && <div>{accountNumber}</div>}
              {accountName && <div style={{ fontSize: '9px' }}>{accountName}</div>}
            </div>
          )}
        </div>
      )}

      {/* Signature */}
      <div style={{ borderTop: '1px dashed black', paddingTop: '10px', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '15px' }}>
          Diterima Oleh:
        </div>
        <div style={{ borderBottom: '1px solid black', width: '60%', marginBottom: '5px', marginTop: '20px' }}></div>
        <div style={{ fontSize: '10px' }}>Nama Wakil Kedai</div>
        <div style={{ fontSize: '10px', marginTop: '10px' }}>Tarikh: __________</div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '2px dashed black', paddingTop: '8px', fontSize: '11px' }}>
        Terima kasih atas kerjasama!
      </div>
    </div>
  );
}

// ESC/POS Commands for thermal printing
export function generateESCPOSCommands(invoice: ThermalInvoiceProps, businessProfile: any): Uint8Array {
  const encoder = new TextEncoder();
  const commands: number[] = [];
  
  const pushText = (text: string) => {
    commands.push(...Array.from(encoder.encode(text)));
  };
  
  // Initialize printer
  commands.push(0x1B, 0x40); // ESC @ - Initialize
  
  // Set alignment center
  commands.push(0x1B, 0x61, 0x01); // ESC a 1 - Center
  
  // Business name (bold, double height)
  commands.push(0x1B, 0x45, 0x01); // Bold ON
  commands.push(0x1D, 0x21, 0x11); // Double height+width
  pushText(businessProfile?.companyName || "PocketBizz");
  commands.push(0x0A); // Line feed
  commands.push(0x1D, 0x21, 0x00); // Normal size
  commands.push(0x1B, 0x45, 0x00); // Bold OFF
  
  if (businessProfile?.address) {
    pushText(businessProfile.address);
    commands.push(0x0A);
  }
  
  if (businessProfile?.phone) {
    pushText(`Tel: ${businessProfile.phone}`);
    commands.push(0x0A);
  }
  
  // Separator
  pushText("================================");
  commands.push(0x0A, 0x0A);
  
  // Invoice title
  commands.push(0x1B, 0x45, 0x01); // Bold ON
  pushText("INVOIS PENGHANTARAN");
  commands.push(0x1B, 0x45, 0x00); // Bold OFF
  commands.push(0x0A, 0x0A);
  
  // Left align for details
  commands.push(0x1B, 0x61, 0x00); // ESC a 0 - Left
  
  pushText(`Kepada: ${invoice.vendor.name}`);
  commands.push(0x0A);
  pushText(`Tarikh: ${new Date(invoice.deliveryDate).toLocaleDateString('ms-MY')}`);
  commands.push(0x0A);
  pushText(`No: ${invoice.invoiceNumber}`);
  commands.push(0x0A, 0x0A);
  
  // Items header
  pushText("--------------------------------");
  commands.push(0x0A);
  pushText("Produk            Qty    Harga");
  commands.push(0x0A);
  pushText("--------------------------------");
  commands.push(0x0A);
  
  // Items
  invoice.items.forEach(item => {
    const line = `${item.productName.substring(0, 16).padEnd(16)} ${item.quantity.toString().padStart(3)} ${parseFloat(item.totalPrice).toFixed(2).padStart(8)}`;
    pushText(line);
    commands.push(0x0A);
    pushText(`  @ RM ${parseFloat(item.unitPrice).toFixed(2)}/unit`);
    commands.push(0x0A);
  });
  
  // Total
  pushText("--------------------------------");
  commands.push(0x0A);
  commands.push(0x1B, 0x45, 0x01); // Bold ON
  const totalLine = `JUMLAH:${`RM ${parseFloat(invoice.totalAmount).toFixed(2)}`.padStart(24)}`;
  pushText(totalLine);
  commands.push(0x1B, 0x45, 0x00); // Bold OFF
  commands.push(0x0A);
  pushText("================================");
  commands.push(0x0A, 0x0A);
  
  // Notes
  pushText("* Harga sudah tolak komisyen");
  commands.push(0x0A, 0x0A);
  pushText("NOTA: Jumlah akhir tertakluk");
  commands.push(0x0A);
  pushText("kepada kuantiti sebenar yang");
  commands.push(0x0A);
  pushText("berjaya dijual oleh kedai.");
  commands.push(0x0A, 0x0A);
  
  // Signature space
  pushText("Diterima Oleh:");
  commands.push(0x0A, 0x0A, 0x0A);
  pushText("____________________");
  commands.push(0x0A);
  pushText("Nama Wakil Kedai");
  commands.push(0x0A, 0x0A);
  pushText("Tarikh: __________");
  commands.push(0x0A, 0x0A);
  
  // Footer
  commands.push(0x1B, 0x61, 0x01); // Center
  pushText("================================");
  commands.push(0x0A);
  pushText("Terima kasih atas kerjasama!");
  commands.push(0x0A);
  pushText("================================");
  commands.push(0x0A, 0x0A, 0x0A, 0x0A);
  
  // Cut paper
  commands.push(0x1D, 0x56, 0x00); // GS V 0 - Full cut
  
  return new Uint8Array(commands);
}
