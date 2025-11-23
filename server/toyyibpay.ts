// ToyyibPay API Integration
import axios from 'axios';

const TOYYIBPAY_API_URL = 'https://toyyibpay.com/index.php/api';

export interface CreateBillParams {
  billName: string;
  billDescription: string;
  billAmount: number; // Amount in cents (RM 50.00 = 5000)
  billTo: string; // Customer name
  billEmail: string;
  billPhone: string;
  billExternalReferenceNo: string; // Your internal order ID
  billReturnUrl: string;
  billCallbackUrl: string;
  billExpiryDays?: number; // Optional: days until expiry
}

export interface ToyyibPayResponse {
  BillCode?: string;
  error?: string;
}

export async function createBill(params: CreateBillParams): Promise<ToyyibPayResponse> {
  const userSecretKey = process.env.TOYYIBPAY_USER_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;

  if (!userSecretKey || !categoryCode) {
    throw new Error('ToyyibPay credentials not configured');
  }

  const formData = new URLSearchParams({
    userSecretKey,
    categoryCode,
    billName: params.billName,
    billDescription: params.billDescription,
    billPriceSetting: '1', // Fixed amount
    billPayorInfo: '1', // Require payer info
    billAmount: params.billAmount.toString(),
    billReturnUrl: params.billReturnUrl,
    billCallbackUrl: params.billCallbackUrl,
    billExternalReferenceNo: params.billExternalReferenceNo,
    billTo: params.billTo,
    billEmail: params.billEmail,
    billPhone: params.billPhone,
    billPaymentChannel: '0', // All payment methods (FPX, cards, e-wallets)
    billDisplayMerchant: '1', // Show merchant info
    billChargeToCustomer: '1', // FPX owner pays, CC customer pays
  });

  if (params.billExpiryDays) {
    formData.append('billExpiryDays', params.billExpiryDays.toString());
  }

  try {
    const response = await axios.post<ToyyibPayResponse[]>(
      `${TOYYIBPAY_API_URL}/createBill`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // ToyyibPay returns array with single object
    const result = response.data[0];
    
    if (result.error) {
      throw new Error(`ToyyibPay Error: ${result.error}`);
    }

    return result;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`ToyyibPay API Error: ${error.response.data?.error || error.message}`);
    }
    throw error;
  }
}

export function getBillUrl(billCode: string): string {
  return `https://toyyibpay.com/${billCode}`;
}

// Helper: Convert RM to cents (ToyyibPay uses cents)
export function rmToCents(rm: number): number {
  return Math.round(rm * 100);
}

// Helper: Convert cents to RM
export function centsToRm(cents: number): number {
  return cents / 100;
}

// Get bill transactions (for verification)
export async function getBillTransactions(billCode: string, status?: string): Promise<any[]> {
  const formData = new URLSearchParams({
    billCode,
  });

  if (status) {
    formData.append('billpaymentStatus', status);
  }

  try {
    const response = await axios.post(
      `${TOYYIBPAY_API_URL}/getBillTransactions`,
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data || [];
  } catch (error: any) {
    console.error('ToyyibPay getBillTransactions error:', error.message);
    return [];
  }
}
