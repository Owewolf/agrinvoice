import { apiService } from './api';
import { Quote, Invoice, Settings } from '@/types/api';

export interface DashboardStats {
  totalQuotes: number;
  totalInvoices: number;
  totalHectares: number;
  conversionRate: number;
  quoteRevenue: number;
  invoiceRevenue: number;
  outstandingPayments: number;
  overdueCount: number;
  avgQuoteValue: number;
  avgInvoiceValue: number;
  topCustomers: Array<{ name: string; revenue: number; quoteCount: number }>;
  monthlyTrends: Array<{ month: string; quotes: number; invoices: number; revenue: number }>;
  recentActivity: {
    quotesThisMonth: number;
    invoicesThisMonth: number;
    paidThisMonth: number;
  };
  quoteStatusBreakdown: {
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
  };
}

export interface ConversionTrend {
  month: string;
  quotes: number;
  invoices: number;
  conversionRate: number;
}

class DashboardAnalyticsService {
  private async getQuotes(): Promise<Quote[]> {
    try {
      return await apiService.getQuotes();
    } catch (error) {
      console.error('Failed to get quotes for analytics:', error);
      return [];
    }
  }

  private async getInvoices(): Promise<Invoice[]> {
    try {
      return await apiService.getInvoices();
    } catch (error) {
      console.error('Failed to get invoices for analytics:', error);
      return [];
    }
  }

  private async getSettings(): Promise<Settings> {
    try {
      return await apiService.getSettings();
    } catch (error) {
      console.error('Failed to get settings for analytics:', error);
      // Return a default settings object
      return {
        currency: 'R',
        language: 'en',
        branding: {
          companyName: 'AgriHover',
          website: 'https://www.agrihover.com',
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
    }
  }

  calculateConversionRate(quotes: Quote[], invoices: Invoice[]): number {
    if (quotes.length === 0) return 0;
    return Math.round((invoices.length / quotes.length) * 100);
  }

  getTopCustomers(quotes: Quote[], invoices: Invoice[], limit: number = 3): Array<{ name: string; revenue: number; quoteCount: number }> {
    const customerMap = new Map<string, { revenue: number; quoteCount: number }>();

    // For now, return empty array since we don't have client name directly in Invoice/Quote
    // This would need to be implemented with proper client lookups
    return [];
  }

  async getMonthlyTrends(quotes: Quote[], invoices: Invoice[], months: number = 6): Promise<Array<{ month: string; quotes: number; invoices: number; revenue: number }>> {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = targetDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthQuotes = quotes.filter(quote => {
        const quoteDate = new Date(quote.createdAt);
        return quoteDate.getMonth() === targetDate.getMonth() && 
               quoteDate.getFullYear() === targetDate.getFullYear();
      });

      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate.getMonth() === targetDate.getMonth() && 
               invoiceDate.getFullYear() === targetDate.getFullYear();
      });

      const revenue = monthInvoices.reduce((sum, invoice) => 
        sum + (invoice.items?.reduce((itemSum, item) => itemSum + (item.calculation?.finalTotal || 0), 0) || 0), 0);

      trends.push({
        month: monthKey,
        quotes: monthQuotes.length,
        invoices: monthInvoices.length,
        revenue
      });
    }

    return trends;
  }

  getRecentActivity(quotes: Quote[], invoices: Invoice[]): { quotesThisMonth: number; invoicesThisMonth: number; paidThisMonth: number } {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const quotesThisMonth = quotes.filter(quote => {
      const quoteDate = new Date(quote.createdAt);
      return quoteDate.getMonth() === currentMonth && quoteDate.getFullYear() === currentYear;
    }).length;

    const invoicesThisMonth = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    }).length;

    const paidThisMonth = invoices.filter(invoice => {
      if (invoice.status !== 'paid') return false;
      const invoiceDate = new Date(invoice.createdAt);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    }).length;

    return { quotesThisMonth, invoicesThisMonth, paidThisMonth };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [quotes, invoices] = await Promise.all([
      this.getQuotes(),
      this.getInvoices()
    ]);
    
    // Basic counts
    const totalQuotes = quotes.length;
    const totalInvoices = invoices.length;
    
    // Revenue calculations
    const quoteRevenue = quotes.reduce((sum, quote) => {
      if (quote.items && quote.items.length > 0) {
        return sum + quote.items.reduce((itemSum, item) => itemSum + (item.calculation?.finalTotal || 0), 0);
      }
      return sum;
    }, 0);
    const invoiceRevenue = invoices.reduce((sum, invoice) => 
      sum + (invoice.items?.reduce((itemSum, item) => itemSum + (item.calculation?.finalTotal || 0), 0) || 0), 0);
    
    // Outstanding payments (sent + overdue invoices)
    const outstandingPayments = invoices
      .filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + (invoice.items?.reduce((itemSum, item) => itemSum + (item.calculation?.finalTotal || 0), 0) || 0), 0);
    
    // Overdue count
    const overdueCount = invoices.filter(invoice => invoice.status === 'overdue').length;
    
        // Total hectares from quotes (simplified - using quantity from items)
    const totalHectares = quotes.reduce((sum, quote) => {
      if (quote.items && quote.items.length > 0) {
        return sum + quote.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
      }
      return sum;
    }, 0);
    
    // Averages
    const avgQuoteValue = totalQuotes > 0 ? quoteRevenue / totalQuotes : 0;
    const avgInvoiceValue = totalInvoices > 0 ? invoiceRevenue / totalInvoices : 0;
    
    // Conversion rate
    const conversionRate = this.calculateConversionRate(quotes, invoices);
    
    // Top customers
    const topCustomers = this.getTopCustomers(quotes, invoices);
    
    // Monthly trends
    const monthlyTrends = await this.getMonthlyTrends(quotes, invoices);
    
    // Recent activity
    const recentActivity = this.getRecentActivity(quotes, invoices);

    // Quote status breakdown
    const quoteStatusBreakdown = {
      draft: quotes.filter(q => q.status === 'draft').length,
      sent: quotes.filter(q => q.status === 'sent').length,
      accepted: quotes.filter(q => q.status === 'accepted').length,
      rejected: quotes.filter(q => q.status === 'rejected').length
    };

    return {
      totalQuotes,
      totalInvoices,
      totalHectares,
      conversionRate,
      quoteRevenue,
      invoiceRevenue,
      outstandingPayments,
      overdueCount,
      avgQuoteValue,
      avgInvoiceValue,
      topCustomers,
      monthlyTrends,
      recentActivity,
      quoteStatusBreakdown
    };
  }

  async getConversionTrends(months: number = 6): Promise<ConversionTrend[]> {
    const [quotes, invoices] = await Promise.all([
      this.getQuotes(),
      this.getInvoices()
    ]);
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = targetDate.toLocaleDateString('en-US', { month: 'short' });
      
      const monthQuotes = quotes.filter(quote => {
        const quoteDate = new Date(quote.createdAt);
        return quoteDate.getMonth() === targetDate.getMonth() && 
               quoteDate.getFullYear() === targetDate.getFullYear();
      }).length;

      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate.getMonth() === targetDate.getMonth() && 
               invoiceDate.getFullYear() === targetDate.getFullYear();
      }).length;

      const conversionRate = monthQuotes > 0 ? Math.round((monthInvoices / monthQuotes) * 100) : 0;

      trends.push({
        month: monthKey,
        quotes: monthQuotes,
        invoices: monthInvoices,
        conversionRate
      });
    }

    return trends;
  }
}

export const dashboardAnalytics = new DashboardAnalyticsService();