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
  }>;
  invoiceNumber: string;
  deliveryDate: string;
  totalAmount: string;
}

export function ThermalInvoice({ vendor, items, invoiceNumber, deliveryDate, totalAmount }: ThermalInvoiceProps) {
  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile"],
  });

  const businessName = (businessProfile as any)?.companyName || "PocketBizz";
  const businessAddress = (businessProfile as any)?.address || "";
  const businessPhone = (businessProfile as any)?.phone || "";

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
          
          return (
            <div key={index} style={{ marginBottom: '8px', fontSize: '11px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60% 15% 25%' }}>
                <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                <div style={{ textAlign: 'right' }}>{item.quantity}</div>
                <div style={{ textAlign: 'right' }}>{total.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: '9px', color: '#666', paddingLeft: '5px' }}>
                @ RM {unitPrice.toFixed(2)}/unit
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div style={{ borderTop: '2px solid black', paddingTop: '5px', marginTop: '5px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
          <div>JUMLAH:</div>
          <div>RM {parseFloat(totalAmount).toFixed(2)}</div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ borderTop: '1px dashed black', paddingTop: '8px', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', marginBottom: '5px' }}>
          * Harga sudah termasuk tolakan komisyen
        </div>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>NOTA PENTING:</div>
        <div style={{ fontSize: '9px', lineHeight: '1.4', textAlign: 'justify' }}>
          Jumlah akhir bayaran tertakluk kepada kuantiti sebenar produk yang berjaya dijual oleh kedai. 
          Produk yang expired, rosak, atau tidak terjual akan ditolak dari jumlah bayaran.
        </div>
      </div>

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
