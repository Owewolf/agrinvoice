// User types
export interface UserRegistration {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
}

// Client types
export interface ClientAddress {
    street: string;
    city: string;
    province: string;
    postalCode: string;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    vatNumber: string;
    address: string | ClientAddress; // Can be string from backend or parsed object
    notes?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    totalQuotes?: number;
    totalInvoices?: number;
    outstandingAmount?: number;
}

// Product types
export interface Service {
    id: string;
    name: string;
    description?: string;
    unit: string;
    createdAt: string;
    updatedAt: string;
}

// Legacy category interface - kept for backward compatibility
export interface Category extends Service {}

export type ProductCategory = 'spraying' | 'granular' | 'travelling' | 'imaging' | 'accommodation';
export type PricingType = 'tiered' | 'flat' | 'per_km';

export interface ProductTier {
    id?: string;
    productId?: string;
    threshold: number;
    rate: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    category: ProductCategory | string; // Support both old string format and new Category name
    categoryId?: string; // New field for category ID
    serviceId?: string; // New field for service ID
    serviceName?: string; // Service name for display
    serviceUnit?: string; // Unit from the service
    pricingType: PricingType;
    baseRate: number;
    discountThreshold?: number;
    discountRate?: number;
    sku: string;
    unit: string; // Product's own unit field
    tiers?: ProductTier[];
    createdAt: string;
    updatedAt: string;
}

// Quote types
export interface QuoteItem {
    productId: string;
    quantity: number;
    speed?: number;
    flowRate?: number;
    sprayWidth?: number;
    appRate?: number;
    calculation: {
        appliedTier?: number;
        rate: number;
        subtotal: number;
        discount?: number;
        finalTotal: number;
    };
}

export interface Quote {
    id: string;
    quoteNumber: string;
    userId: string;
    clientId: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    subtotal?: number;
    totalDiscount?: number;
    totalCharge?: number;
    clientName?: string;
    items: QuoteItem[];
    createdAt: string;
    updatedAt: string;
}

// Invoice types
export interface InvoiceItem {
    id: string;
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    quoteId?: string;
    quoteNumber?: string;
    clientId?: string;
    clientName?: string;
    issueDate: string;
    dueDate: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    subtotal: number;
    totalDiscount: number;
    totalCharge: number;
    banking?: {
        accountName?: string;
        accountNumber?: string;
        bankName?: string;
        branchCode?: string;
    };
    client?: Client;
    items: QuoteItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoiceData {
    quoteId: string;
    issueDate: string;
    dueDate: string;
    bankingDetails?: {
        accountName?: string;
        accountNumber?: string;
        bankName?: string;
        branchCode?: string;
    };
}

// Settings types
export interface Settings {
    currency: string;
    language: string;
    branding: {
        companyName: string;
        website?: string;
        contactInfo: {
            email: string;
            phone: string;
            address: string;
        };
    };
    payments: {
        accountName: string;
        accountNumber: string;
        bankName: string;
        branchCode: string;
    };
}
