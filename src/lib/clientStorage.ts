import { Client } from '@/types/api';
import { ClientStats } from '@/types/client';
import apiService from './api';
import { invoiceStorageService } from './invoiceStorage';
import { storageService } from './storage';

class ClientStorageService {
  async getClients(): Promise<Client[]> {
    return await apiService.getClients();
  }

  async saveClient(client: Partial<Client> & { id?: string }): Promise<Client> {
    if (client.id) {
      return await apiService.updateClient(client.id, client);
    } else {
      return await apiService.createClient(client as Omit<Client, 'id' | 'createdAt' | 'updatedAt'>);
    }
  }

  async getClient(id: string): Promise<Client | null> {
    try {
      return await apiService.getClient(id);
    } catch (error) {
      return null;
    }
  }

  async deleteClient(id: string): Promise<void> {
    await apiService.deleteClient(id);
  }

  async searchClients(query: string): Promise<Client[]> {
    try {
      const clients = await this.getClients();
      const lowercaseQuery = query.toLowerCase();
      
      return clients.filter(client => 
        client.name.toLowerCase().includes(lowercaseQuery) ||
        client.email?.toLowerCase().includes(lowercaseQuery) ||
        client.phone.includes(query) ||
        client.vatNumber?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Failed to search clients:', error);
      return [];
    }
  }

  async getClientStats(clientId: string): Promise<ClientStats> {
    try {
      const [quotes, invoices] = await Promise.all([
        storageService.getQuotes(),
        invoiceStorageService.getInvoices()
      ]);

      const clientQuotes = quotes.filter(q => q.clientId === clientId);
      const clientInvoices = invoices.filter(i => i.clientId === clientId);
      
      const outstandingAmount = clientInvoices
        .filter(i => i.status === 'sent' || i.status === 'overdue')
        .reduce((sum, i) => sum + (i.items?.reduce((itemSum, item) => itemSum + (item.calculation?.finalTotal || 0), 0) || 0), 0);
      
      const paidAmount = clientInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.items?.reduce((itemSum, item) => itemSum + (item.calculation?.finalTotal || 0), 0) || 0), 0);
      
      return {
        totalQuotes: clientQuotes.length,
        totalInvoices: clientInvoices.length,
        outstandingAmount,
        paidAmount
      };
    } catch (error) {
      console.error(`Failed to get stats for client ${clientId}:`, error);
      return {
        totalQuotes: 0,
        totalInvoices: 0,
        outstandingAmount: 0,
        paidAmount: 0
      };
    }
  }

  async getClientsWithOutstanding(): Promise<Array<Client & { outstandingAmount: number }>> {
    try {
      const clients = await this.getClients();
      const clientsWithStats = await Promise.all(
        clients.map(async client => {
          const stats = await this.getClientStats(client.id);
          return {
            ...client,
            outstandingAmount: stats.outstandingAmount
          };
        })
      );
      
      return clientsWithStats.filter(client => client.outstandingAmount > 0);
    } catch (error) {
      console.error('Failed to get clients with outstanding amounts:', error);
      return [];
    }
  }

  async validateUniquePhone(phone: string, excludeId?: string): Promise<boolean> {
    try {
      const clients = await this.getClients();
      return !clients.some(client => 
        client.phone === phone && client.id !== excludeId
      );
    } catch (error) {
      console.error('Failed to validate phone uniqueness:', error);
      return false;
    }
  }

  async validateUniqueEmail(email: string, excludeId?: string): Promise<boolean> {
    if (!email) return true;
    try {
      const clients = await this.getClients();
      return !clients.some(client => 
        client.email === email && client.id !== excludeId
      );
    } catch (error) {
      console.error('Failed to validate email uniqueness:', error);
      return false;
    }
  }
}

export const clientStorageService = new ClientStorageService();
