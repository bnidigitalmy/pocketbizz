import html2canvas from 'html2canvas';

/**
 * Convert HTML element to image and share via WhatsApp
 */
export async function shareInvoiceViaWhatsApp(
  elementId: string,
  vendorPhone: string,
  vendorName: string,
  invoiceNumber: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice element not found');
  }

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
    });

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image'));
      }, 'image/png');
    });

    // Create file for sharing
    const file = new File([blob], `invoice-${invoiceNumber}.png`, { type: 'image/png' });

    // Check if Web Share API is available (mobile browsers)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      // Use native share (mobile)
      await navigator.share({
        title: `Invois ${invoiceNumber}`,
        text: `Invois penghantaran untuk ${vendorName}`,
        files: [file],
      });
    } else {
      // Fallback: Download image and open WhatsApp web
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.png`;
      link.click();

      // Open WhatsApp with message (without image - user needs to attach manually)
      const message = encodeURIComponent(
        `Salam ${vendorName},\n\nInvois penghantaran ${invoiceNumber} telah dijana.\n\nTerima kasih!`
      );
      const whatsappUrl = `https://wa.me/${vendorPhone.replace(/[^0-9]/g, '')}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }
  } catch (error) {
    console.error('Error sharing invoice:', error);
    throw error;
  }
}

/**
 * Open print dialog with thermal-optimized layout
 */
export function printThermalInvoice(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice element not found');
  }

  // Clone the element
  const printContent = element.cloneNode(true) as HTMLElement;

  // Create print window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  // Write HTML with print styles
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Print Invoice</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          @media print {
            body {
              width: 80mm;
            }
            
            /* Hide browser print elements */
            button, .no-print {
              display: none !important;
            }
          }
          
          /* Button for manual print trigger */
          .print-button {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
          }
          
          .print-button:hover {
            background: #45a049;
          }
          
          @media print {
            .print-button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">🖨️ Print</button>
        ${printContent.outerHTML}
        <script>
          // Auto-open print dialog after page loads
          window.onload = function() {
            // Small delay to ensure content is rendered
            setTimeout(function() {
              window.print();
            }, 250);
          };
          
          // Close window after printing (optional)
          window.onafterprint = function() {
            // Uncomment to auto-close after print
            // setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Generate invoice data URL for preview/download
 */
export async function generateInvoiceImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Invoice element not found');
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    logging: false,
  });

  return canvas.toDataURL('image/png');
}
