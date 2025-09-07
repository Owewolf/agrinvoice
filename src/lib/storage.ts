import { Quote, Settings } from '@/types/api';
import apiService from './api';

export const storageService = {
  // Quotes
  getQuotes: async (): Promise<Quote[]> => {
    return await apiService.getQuotes();
  },

  saveQuote: async (quote: Partial<Quote> & { id?: string }): Promise<Quote> => {
    if (quote.id) {
      if (quote.status) {
        await apiService.updateQuoteStatus(quote.id, quote.status);
      }
      return await apiService.getQuote(quote.id);
    } else {
      return await apiService.createQuote(quote as Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'>);
    }
  },

  deleteQuote: async (id: string): Promise<void> => {
    await apiService.deleteQuote(id);
  },

  // Settings
  getSettings: async (): Promise<Settings> => {
    try {
      const settings = await apiService.getSettings();
      if (!settings) {
        const defaultSettings: Settings = {
          currency: 'ZAR',
          language: 'en',
          branding: {
            companyName: 'AgriHover Drone Services',
            contactInfo: {
              email: '',
              phone: '',
              address: ''
            }
          },
          payments: {
            accountName: '',
            accountNumber: '',
            bankName: '',
            branchCode: ''
          }
        };
        return await storageService.saveSettings(defaultSettings);
      }
      return settings;
    } catch (error) {
      console.error('Failed to get settings:', error);
      throw error;
    }
  },

  saveSettings: async (settings: Partial<Settings>): Promise<Settings> => {
    try {
      return await apiService.updateSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }
};