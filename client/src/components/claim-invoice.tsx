import { useQuery } from "@tanstack/react-query";

interface ClaimInvoiceProps {
  claim: {
    id: string;
    vendorId: string;
    vendorName: string;
    claimNumber: string;
    claimDate: string;
    periodFrom: string;
    periodTo: string;
    deliveryInvoices: string[]; // Array of invoice numbers
    items: Array<{
      productName: string;
      deliveredQty: number;
      soldQty: number;
      expiredQty: number;
      returnedQty: number;
      unitPrice: string;
      claimAmount: string;
    }>;
    totalDelivered: string;
    totalClaim: string;
    status: string;
  };
}

export function ClaimInvoice({ claim }: ClaimInvoiceProps) {
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
      id="claim-invoice"
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

      {/* Document Title */}
      <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
        TUNTUTAN BAYARAN
      </div>

      {/* Claim Info */}
      <div style={{ marginBottom: '10px', fontSize: '11px' }}>
        <div>Kepada: <strong>{claim.vendorName}</strong></div>
        <div>No Tuntutan: {claim.claimNumber}</div>
        <div>Tarikh Tuntutan: {new Date(claim.claimDate).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
        <div>Tempoh: {new Date(claim.periodFrom).toLocaleDateString('ms-MY')} - {new Date(claim.periodTo).toLocaleDateString('ms-MY')}</div>
      </div>

      {/* Referenced Invoices */}
      {claim.deliveryInvoices && claim.deliveryInvoices.length > 0 && (
        <div style={{ marginBottom: '10px', fontSize: '10px', color: '#666' }}>
          <div style={{ fontWeight: 'bold' }}>Invois Rujukan:</div>
          <div>{claim.deliveryInvoices.join(', ')}</div>
        </div>
      )}

      {/* Items Table */}
      <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', paddingTop: '5px', paddingBottom: '5px', marginBottom: '5px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>
          <div>Produk</div>
          <div style={{ textAlign: 'right' }}>Tuntutan</div>
        </div>
        
        {claim.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60% 40%' }}>
              <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
              <div style={{ textAlign: 'right' }}>RM {parseFloat(item.claimAmount).toFixed(2)}</div>
            </div>
            <div style={{ fontSize: '9px', color: '#666', paddingLeft: '5px', marginTop: '2px' }}>
              <div>Dihantar: {item.deliveredQty} unit</div>
              <div style={{ color: '#16a34a' }}>✓ Terjual: {item.soldQty} unit @ RM {parseFloat(item.unitPrice).toFixed(2)}</div>
              {item.expiredQty > 0 && <div style={{ color: '#dc2626' }}>✗ Expired: {item.expiredQty} unit</div>}
              {item.returnedQty > 0 && <div style={{ color: '#ea580c' }}>↩ Pulangan: {item.returnedQty} unit</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ borderTop: '2px solid black', paddingTop: '5px', marginTop: '5px', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', marginBottom: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Jumlah Dihantar:</div>
            <div>RM {parseFloat(claim.totalDelivered).toFixed(2)}</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', borderTop: '1px solid black', paddingTop: '5px', marginTop: '3px' }}>
          <div>JUMLAH TUNTUTAN:</div>
          <div>RM {parseFloat(claim.totalClaim).toFixed(2)}</div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ borderTop: '1px dashed black', paddingTop: '8px', marginBottom: '10px' }}>
        <div style={{ fontSize: '9px', marginBottom: '5px' }}>
          * Harga sudah ditolak komisyen vendor
        </div>
        <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>NOTA:</div>
        <div style={{ fontSize: '9px', lineHeight: '1.4', textAlign: 'justify' }}>
          Tuntutan ini adalah berdasarkan jualan sebenar dalam tempoh yang dinyatakan. 
          Jumlah ini perlu dijelaskan mengikut terma pembayaran yang dipersetujui.
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '15px' }}>
              Disediakan Oleh:
            </div>
            <div style={{ borderBottom: '1px solid black', marginBottom: '5px', marginTop: '20px' }}></div>
            <div style={{ fontSize: '9px' }}>({businessName})</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '15px' }}>
              Disahkan Oleh:
            </div>
            <div style={{ borderBottom: '1px solid black', marginBottom: '5px', marginTop: '20px' }}></div>
            <div style={{ fontSize: '9px' }}>({claim.vendorName})</div>
          </div>
        </div>
        <div style={{ fontSize: '10px', marginTop: '10px', textAlign: 'center' }}>Tarikh: __________</div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', borderTop: '2px dashed black', paddingTop: '8px', fontSize: '11px' }}>
        Terima kasih atas kerjasama!
      </div>
    </div>
  );
}
