// External API service for static hosting
// This will use external services instead of Next.js API routes

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://your-api-service.com';

export interface ExchangeRateResponse {
  success: boolean;
  rate: number | null;
  error?: string;
}

export interface TransactionResponse {
  success: boolean;
  referenceCode?: string;
  recordId?: string;
  error?: string;
  details?: string;
}

// Fetch exchange rate from external service
export async function fetchExchangeRate(): Promise<ExchangeRateResponse> {
  try {
    // For now, return a mock rate - you'll need to set up an external API
    // You can use services like:
    // - Vercel Functions (free tier)
    // - Netlify Functions (free tier)
    // - Railway (free tier)
    // - Supabase Edge Functions (free tier)
    
    return {
      success: true,
      rate: 1.85 // Mock rate - replace with actual API call
    };
  } catch (error) {
    return {
      success: false,
      rate: null,
      error: 'Failed to fetch rate'
    };
  }
}

// Submit transaction to external service
export async function submitTransaction(formData: FormData): Promise<TransactionResponse> {
  try {
    // Mock response - replace with actual API call
    const referenceCode = 'REF' + Date.now();
    const recordId = 'REC' + Date.now();
    
    return {
      success: true,
      referenceCode,
      recordId
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to submit transaction'
    };
  }
} 