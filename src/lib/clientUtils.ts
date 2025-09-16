import { Client } from '@/types/client';

export const validatePhoneNumber = (phone: string): boolean => {
  // South African phone number validation
  const saPhoneRegex = /^(?:\+27|0)[1-9][0-9]{8}$/;
  return saPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with 0, replace with +27
  if (cleaned.startsWith('0')) {
    cleaned = '+27' + cleaned.slice(1);
  }
  
  // If starts with 27, add +
  if (cleaned.startsWith('27')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateClientDisplayName = (client: Client): string => {
  if (client.companyName) {
    return `${client.fullName} (${client.companyName})`;
  }
  return client.fullName;
};

export const getClientInitials = (client: Client): string => {
  const nameParts = client.fullName.split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

export const formatCurrency = (amount: number, currency: string = 'R'): string => {
  // For South African Rand, use simple R prefix format
  if (currency === 'R') {
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  // For other currencies, use standard Intl formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'R' ? 'ZAR' : currency,
  }).format(amount);
};

export const sortClients = (clients: Client[], sortBy: 'name' | 'company' | 'date', sortOrder: 'asc' | 'desc'): Client[] => {
  return [...clients].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case 'company':
        comparison = (a.companyName || '').localeCompare(b.companyName || '');
        break;
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

export const filterClients = (
  clients: Client[],
  filters: {
    search?: string;
    hasOutstanding?: boolean;
    hasCompany?: boolean;
  }
): Client[] => {
  let filtered = clients;
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(client =>
      client.fullName.toLowerCase().includes(searchLower) ||
      client.companyName?.toLowerCase().includes(searchLower) ||
      client.phoneNumber.includes(filters.search) ||
      client.emailAddress?.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.hasCompany !== undefined) {
    filtered = filtered.filter(client =>
      filters.hasCompany ? !!client.companyName : !client.companyName
    );
  }
  
  return filtered;
};

export const exportClientsToCSV = (clients: Client[]): string => {
  const headers = ['Full Name', 'Company Name', 'Phone Number', 'Email Address', 'Physical Address', 'VAT Details', 'Notes', 'Created Date'];
  
  const rows = clients.map(client => [
    client.fullName,
    client.companyName || '',
    client.phoneNumber,
    client.emailAddress || '',
    client.physicalAddress || '',
    client.vatDetails || '',
    client.notes || '',
    new Date(client.createdAt).toLocaleDateString()
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
