export interface Client {
  id: string;
  fullName: string;
  companyName?: string;
  phoneNumber: string;
  emailAddress?: string;
  physicalAddress?: string;
  vatDetails?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientStats {
  totalQuotes: number;
  totalInvoices: number;
  outstandingAmount: number;
  paidAmount: number;
}
