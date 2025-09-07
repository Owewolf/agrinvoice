import { Invoice, CreateInvoiceData } from '@/types/api';
import apiService from './api';

class InvoiceStorageService {
  async getInvoices(): Promise<Invoice[]> {
    try {
      return await apiService.getInvoices();
    } catch (error) {
      console.error('Failed to get invoices:', error);
      return [];
    }
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      return await apiService.getInvoice(id);
    } catch (error) {
      console.error(`Failed to get invoice ${id}:`, error);
      return null;
    }
  }

  async saveInvoice(invoice: Invoice | CreateInvoiceData): Promise<Invoice> {
    try {
      if ('id' in invoice && invoice.id) {
        // When updating, we need to omit fields that shouldn't be updated
        const { id, createdAt, updatedAt, ...updateData } = invoice;
        return await apiService.updateInvoice(id, updateData);
      } else {
        // When creating, use the CreateInvoiceData type
        return await apiService.createInvoice(invoice as CreateInvoiceData);
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await apiService.deleteInvoice(id);
    } catch (error) {
      console.error(`Failed to delete invoice ${id}:`, error);
      throw error;
    }
  }

  async updateInvoiceStatuses(): Promise<void> {
    try {
      const invoices = await this.getInvoices();
      const currentDate = new Date();
      const updatePromises: Promise<Invoice>[] = [];

      for (const invoice of invoices) {
        if (invoice.status !== 'paid' && invoice.dueDate) {
          const dueDate = new Date(invoice.dueDate);
          if (currentDate > dueDate && invoice.status !== 'overdue') {
            updatePromises.push(
              apiService.updateInvoiceStatus(invoice.id, 'overdue')
            );
          }
        }
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error('Failed to update invoice statuses:', error);
    }
  }

  async getInvoicesByStatus(status: Invoice['status']): Promise<Invoice[]> {
    const invoices = await this.getInvoices();
    return invoices.filter(invoice => invoice.status === status);
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    await this.updateInvoiceStatuses();
    return this.getInvoicesByStatus('overdue');
  }
}

export const invoiceStorageService = new InvoiceStorageService();