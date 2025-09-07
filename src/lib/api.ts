import axios from 'axios';
import { authService } from './auth';
import {
  User,
  UserLogin,
  UserRegistration,
  Client,
  Product,
  Quote,
  Invoice,
  CreateInvoiceData,
  Settings
} from '@/types/api';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ API request with token:', token.substring(0, 20) + '...');
      console.log('📤 Request details:', {
        method: config.method,
        url: config.url,
        data: config.data
      });
    } else {
      console.warn('⚠️ No JWT token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ API request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('❌ Authentication error - user needs to login first');
      // Clear invalid tokens
      authService.logout();
      // Optionally redirect to login page
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth
  login: async (credentials: UserLogin) => {
    const response = await api.post<{ token: string; user: User }>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
    }
    return response.data;
  },

  register: async (userData: UserRegistration) => {
    const response = await api.post<{ token: string; user: User }>('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
    }
    return response.data;
  },

  // Clients
  getClients: async () => {
    const response = await api.get<Client[]>('/clients');
    return response.data;
  },

  getClient: async (id: string) => {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  createClient: async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Client>('/clients', clientData);
    return response.data;
  },

  updateClient: async (id: string, clientData: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const response = await api.put<Client>(`/clients/${id}`, clientData);
    return response.data;
  },

  deleteClient: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },

  // Products
  getProducts: async () => {
    const response = await api.get<Product[]>('/products');
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Product>('/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const response = await api.put<Product>(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Quotes
  getQuotes: async () => {
    const response = await api.get<Quote[]>('/quotes');
    return response.data;
  },

  getQuote: async (id: string) => {
    const response = await api.get<Quote>(`/quotes/${id}`);
    return response.data;
  },

  createQuote: async (quoteData: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<Quote>('/quotes', quoteData);
    return response.data;
  },

  updateQuoteStatus: async (id: string, status: Quote['status']) => {
    const response = await api.patch<Quote>(`/quotes/${id}/status`, { status });
    return response.data;
  },

  deleteQuote: async (id: string) => {
    const response = await api.delete(`/quotes/${id}`);
    return response.data;
  },

  // Invoices
  getInvoices: async () => {
    const response = await api.get<Invoice[]>('/invoices');
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (invoiceData: CreateInvoiceData) => {
    const response = await api.post<Invoice>('/invoices', invoiceData);
    return response.data;
  },

  updateInvoiceStatus: async (id: string, status: Invoice['status']) => {
    const response = await api.patch<Invoice>(`/invoices/${id}/status`, { status });
    return response.data;
  },

  updateInvoice: async (id: string, invoiceData: Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const response = await api.put<Invoice>(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  deleteInvoice: async (id: string) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await api.get<Settings>('/settings');
    return response.data;
  },

  updateSettings: async (settingsData: Partial<Settings>) => {
    const response = await api.put<Settings>('/settings', settingsData);
    return response.data;
  },
};

export default apiService;
