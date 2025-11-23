/**
 * WhatsApp Integration Utilities
 * Uses wa.me links to send pre-filled messages via WhatsApp Web
 */

export interface WhatsAppMessage {
  phone: string;
  message: string;
}

/**
 * Formats phone number for WhatsApp (removes spaces, dashes, adds country code if needed)
 * Malaysian format: 60XXXXXXXXX (without +)
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 60 (Malaysia)
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  }
  
  // If doesn't start with country code, add 60
  if (!cleaned.startsWith('60')) {
    cleaned = '60' + cleaned;
  }
  
  return cleaned;
}

/**
 * Opens WhatsApp with pre-filled message
 */
export function sendWhatsApp({ phone, message }: WhatsAppMessage): void {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
}

/**
 * Generate invoice message for WhatsApp
 */
export function generateInvoiceMessage(data: {
  vendorName: string;
  invoiceNumber: string;
  totalAmount: string;
  deliveryDate: string;
  items?: { name: string; quantity: number; price: string }[];
  businessName?: string;
}): string {
  const { vendorName, invoiceNumber, totalAmount, deliveryDate, items, businessName } = data;
  
  let message = `🧾 *INVOIS TUNTUTAN*\n\n`;
  message += `📋 No. Invois: ${invoiceNumber}\n`;
  message += `📅 Tarikh: ${deliveryDate}\n`;
  message += `🏪 Vendor: ${vendorName}\n\n`;
  
  if (items && items.length > 0) {
    message += `📦 *BUTIRAN PRODUK:*\n`;
    items.forEach(item => {
      message += `• ${item.name} x${item.quantity} - RM${item.price}\n`;
    });
    message += `\n`;
  }
  
  message += `💰 *JUMLAH KESELURUHAN: RM${totalAmount}*\n\n`;
  message += `Terima kasih atas kerjasama anda! 🙏\n\n`;
  
  if (businessName) {
    message += `_${businessName}_`;
  }
  
  return message;
}

/**
 * Generate delivery slip message for WhatsApp
 */
export function generateDeliveryMessage(data: {
  vendorName: string;
  deliveryDate: string;
  items: { name: string; quantity: number }[];
  totalAmount: string;
  businessName?: string;
}): string {
  const { vendorName, deliveryDate, items, totalAmount, businessName } = data;
  
  let message = `📦 *SLIP PENGHANTARAN*\n\n`;
  message += `🏪 Vendor: ${vendorName}\n`;
  message += `📅 Tarikh Hantar: ${deliveryDate}\n\n`;
  
  message += `📋 *PRODUK DIHANTAR:*\n`;
  items.forEach(item => {
    message += `• ${item.name} x${item.quantity}\n`;
  });
  
  message += `\n💰 Jumlah: RM${totalAmount}\n\n`;
  message += `Sila sahkan penerimaan. Terima kasih! 🙏\n\n`;
  
  if (businessName) {
    message += `_${businessName}_`;
  }
  
  return message;
}

/**
 * Generate payment reminder message
 */
export function generatePaymentReminder(data: {
  vendorName: string;
  amount: string;
  invoiceNumber: string;
  daysOverdue?: number;
  businessName?: string;
}): string {
  const { vendorName, amount, invoiceNumber, daysOverdue, businessName } = data;
  
  let message = `💰 *PERINGATAN PEMBAYARAN*\n\n`;
  message += `Assalamualaikum ${vendorName},\n\n`;
  message += `Ini peringatan mesra untuk pembayaran:\n\n`;
  message += `📋 Invois: ${invoiceNumber}\n`;
  message += `💵 Jumlah: RM${amount}\n`;
  
  if (daysOverdue && daysOverdue > 0) {
    message += `⏰ Tertunggak: ${daysOverdue} hari\n`;
  }
  
  message += `\nTerima kasih atas kerjasama anda! 🙏\n\n`;
  
  if (businessName) {
    message += `_${businessName}_`;
  }
  
  return message;
}

/**
 * Generate POS receipt message
 */
export function generateReceiptMessage(data: {
  receiptNumber: string;
  customerName?: string;
  items: { name: string; quantity: number; price: string }[];
  totalAmount: string;
  paymentMethod: string;
  date: string;
  businessName?: string;
}): string {
  const { receiptNumber, customerName, items, totalAmount, paymentMethod, date, businessName } = data;
  
  let message = `🧾 *RESIT JUALAN*\n\n`;
  message += `📋 No. Resit: ${receiptNumber}\n`;
  message += `📅 Tarikh: ${date}\n`;
  
  if (customerName) {
    message += `👤 Pelanggan: ${customerName}\n`;
  }
  
  message += `\n📦 *PEMBELIAN:*\n`;
  items.forEach(item => {
    message += `• ${item.name} x${item.quantity} - RM${item.price}\n`;
  });
  
  message += `\n💰 *JUMLAH: RM${totalAmount}*\n`;
  message += `💳 Bayaran: ${paymentMethod}\n\n`;
  message += `Terima kasih atas pembelian anda! 🙏\n\n`;
  
  if (businessName) {
    message += `_${businessName}_`;
  }
  
  return message;
}

/**
 * Generate low stock alert message
 */
export function generateLowStockAlert(data: {
  items: { name: string; currentStock: number; unit: string }[];
  businessName?: string;
}): string {
  const { items, businessName } = data;
  
  let message = `⚠️ *AMARAN STOK RENDAH*\n\n`;
  message += `Stok berikut perlu ditambah:\n\n`;
  
  items.forEach(item => {
    message += `🔴 ${item.name}: ${item.currentStock} ${item.unit}\n`;
  });
  
  message += `\nSila restock segera! 📦\n\n`;
  
  if (businessName) {
    message += `_${businessName}_`;
  }
  
  return message;
}

/**
 * Generate agent/reseller stock transfer message
 */
export function generateStockTransferMessage(data: {
  agentName: string;
  transferDate: string;
  items: { name: string; quantity: number; price: string }[];
  totalAmount: string;
  businessName?: string;
}): string {
  const { agentName, transferDate, items, totalAmount, businessName } = data;
  
  let message = `📦 *PEMINDAHAN STOK EJEN*\n\n`;
  message += `👤 Ejen: ${agentName}\n`;
  message += `📅 Tarikh: ${transferDate}\n\n`;
  
  message += `📋 *PRODUK DIPINDAH:*\n`;
  items.forEach(item => {
    message += `• ${item.name} x${item.quantity} - RM${item.price}\n`;
  });
  
  message += `\n💰 *JUMLAH: RM${totalAmount}*\n\n`;
  message += `Terima kasih! Semoga laris jualan! 🚀\n\n`;
  
  if (businessName) {
    message += `_${businessName}_`;
  }
  
  return message;
}
