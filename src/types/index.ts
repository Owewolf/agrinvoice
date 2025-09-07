export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export type ProductCategory = 'spraying' | 'granular' | 'travelling' | 'imaging' | 'accommodation';

export type PricingType = 'tiered' | 'flat' | 'per_km';

export interface PricingTier {
  id: string;
  threshold: number;
  rate: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  pricingType: PricingType;
  baseRate?: number; // For flat or per_km pricing
  discountThreshold: number;
  discountRate: number; // Percentage (e.g., 0.15 for 15%)
  description: string;
  sku: string;
  tiers?: PricingTier[]; // For tiered pricing
  unit: string; // e.g., 'ha', 'km', 'per service'
  isActive: boolean;
  createdAt: string;
}

export interface QuoteProduct {
  productId: string;
  product: import('./api').Product;
  quantity: number;
  appliedRate: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  // Additional fields for specific product types
  speed?: number; // For spraying/granular
  flowRate?: number; // For spraying/granular
  sprayWidth?: number; // For spraying/granular
  appRate?: number; // For spraying/granular
}

export interface Quote {
  id: string;
  userId: string;
  clientId: string;
  clientName?: string; // Legacy field for backward compatibility
  clientContact?: string; // Legacy field for backward compatibility
  products: QuoteProduct[];
  subtotal: number;
  totalDiscount: number;
  totalCharge: number;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  // Legacy fields for backward compatibility
  hectares?: number;
  speed?: number;
  flowRate?: number;
  sprayWidth?: number;
  appRate?: number;
  costPerHa?: number;
  discountAmount?: number;
}

export interface BankingDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  swiftCode: string;
  paymentInstructions: string;
}

export interface Settings {
  id: string;
  point1Lpha: number;
  point1Rate: number;
  point2Lpha: number;
  point2Rate: number;
  point3Lpha: number;
  point3Rate: number;
  discountThreshold: number;
  discountRate: number;
  currency: string;
  logoUrl: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  bankingDetails?: BankingDetails;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quoteId: string;
  clientId: string;
  clientName?: string; // Legacy field for backward compatibility
  clientContact?: string; // Legacy field for backward compatibility
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  // Quote snapshot data
  hectares?: number;
  speed?: number;
  flowRate?: number;
  sprayWidth?: number;
  appRate?: number;
  costPerHa?: number;
  totalCharge: number;
  // Multi-product support
  products?: QuoteProduct[];
  subtotal: number;
  totalDiscount: number;
}

export interface CalculationResult {
  appliedRate: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  // Legacy fields for backward compatibility
  appRate?: number;
  costPerHa?: number;
  totalCharge?: number;
}
