import axios from 'axios';
import {
  User,
  UserLogin,
  UserRegistration,
  Client,
  Product,
  Quote,
  Invoice,
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
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API request with token:', token.substring(0, 20) + '...');
  } else {
    console.log('No JWT token found in localStorage');
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Authentication failed - token may be expired');
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('current_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth
  login: async (data: UserLogin): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: UserRegistration): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    const response = await api.get('/products');
    return response.data;
  },

  createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const response = await api.post('/products', product);
    return response.data;
  },

  updateProduct: async (id: string, product: Product): Promise<Product> => {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  // Clients
  getClients: async (): Promise<Client[]> => {
    const response = await api.get('/clients');
    return response.data;
  },

  createClient: async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    const response = await api.post('/clients', client);
    return response.data;
  },

  updateClient: async (id: string, client: Client): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, client);
    return response.data;
  },

  deleteClient: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  // Quotes
  getQuotes: async (): Promise<Quote[]> => {
    const response = await api.get('/quotes');
    return response.data;
  },

  createQuote: async (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> => {
    const response = await api.post('/quotes', quote);
    return response.data;
  },

  updateQuote: async (id: string, quote: Quote): Promise<Quote> => {
    const response = await api.put(`/quotes/${id}`, quote);
    return response.data;
  },

  deleteQuote: async (id: string): Promise<void> => {
    await api.delete(`/quotes/${id}`);
  },

  // Invoices
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await api.get('/invoices');
    return response.data;
  },

  createInvoice: async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
    const response = await api.post('/invoices', invoice);
    return response.data;
  },

  updateInvoice: async (id: string, invoice: Invoice): Promise<Invoice> => {
    const response = await api.put(`/invoices/${id}`, invoice);
    return response.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },

  // Settings
  getSettings: async (): Promise<Settings> => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (settings: Settings): Promise<Settings> => {
    const response = await api.put('/settings', settings);
    return response.data;
  }
};

export default apiService;
