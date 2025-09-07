import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Mail, Edit, FileText } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { productStorageService } from '@/lib/productStorage';
import { invoiceStorageService } from '@/lib/invoiceStorage';
import { apiService } from '@/lib/api';
import { Quote, Settings, Product, Invoice, CreateInvoiceData } from '@/types/api';
import { toast } from 'sonner';

interface QuotePreviewProps {
  onNavigate: (page: string, params?: { invoiceId?: string; quoteId?: string }) => void;
  quoteId?: string;
}

export default function QuotePreview({ onNavigate, quoteId }: QuotePreviewProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from now
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (quoteId) {
          // Load quote
          const quotes = await storageService.getQuotes();
          const foundQuote = quotes.find(q => q.id === quoteId);
          if (foundQuote) {
            setQuote(foundQuote);
          } else {
            console.error('Quote not found:', quoteId);
          }
        }

        // Load settings and products
        const [currentSettings, allProducts] = await Promise.all([
          storageService.getSettings(),
          productStorageService.getProducts()
        ]);
        
        setSettings(currentSettings);
        setProducts(allProducts);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [quoteId]);

  const handleStatusUpdate = async (newStatus: 'draft' | 'sent' | 'accepted' | 'rejected') => {
    if (!quote) return;
    
    try {
      // Update status in database via API
      await apiService.updateQuoteStatus(quote.id, newStatus);
      setQuote(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Show success message
      toast.success(`Quote status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error('Failed to update quote status');
    }
  };

  const handleCreateInvoice = async () => {
    if (!quote || !settings) return;

    const invoiceData: CreateInvoiceData = {
      quoteId: quote.id,
      issueDate,
      dueDate,
      bankingDetails: settings.payments || {}
    };

    try {
      const createdInvoice = await invoiceStorageService.saveInvoice(invoiceData);
      setShowInvoiceDialog(false);
      onNavigate('invoice-preview', { invoiceId: createdInvoice.id });
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleDownloadPDF = () => {
    const printContent = generatePrintableQuote();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendEmail = () => {
    if (!quote || !settings) return;
    
    const subject = `Quote ${quote.quoteNumber} from ${settings.branding?.companyName || 'Your Company'}`;
    const body = `Dear ${quote.clientName},

Please find attached your quote for agricultural services.

Quote Number: ${quote.quoteNumber}
Total Amount: R ${(quote.totalCharge || 0).toLocaleString()}

If you have any questions, please don't hesitate to contact us.

Best regards,
${settings.branding?.companyName || 'Your Company'}
${settings.branding?.contactInfo?.email || ''}
${settings.branding?.contactInfo?.phone || ''}`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const generatePrintableQuote = () => {
    if (!quote || !settings) return '';

    const subtotal = quote.subtotal || 0;
    const totalDiscount = quote.totalDiscount || 0;
    const totalCharge = quote.totalCharge || 0;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quote - ${quote.clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info { flex: 1; }
            .company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .company-details { font-size: 14px; line-height: 1.6; color: #666; }
            .quote-info { text-align: right; flex: 1; }
            .quote-title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .quote-number { font-size: 18px; color: #2563eb; margin-bottom: 5px; }
            .section { margin: 25px 0; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-left: 4px solid #2563eb; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }
            .detail-item { padding: 8px 0; border-bottom: 1px solid #eee; }
            .cost-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .cost-table th, .cost-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .cost-table th { background-color: #2563eb; color: white; font-weight: bold; }
            .cost-table .text-right { text-align: right; }
            .cost-table tbody tr:nth-child(even) { background-color: #f8f9fa; }
            .total-section { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row.final { font-size: 18px; font-weight: bold; border-top: 2px solid #2563eb; padding-top: 12px; }
            .discount-text { color: #059669; }
            .payment-info { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
            .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="company-name">${settings.branding?.companyName || 'Your Company'}</div>
              <div class="company-details">
                ${settings.branding?.contactInfo?.address ? `<div>${settings.branding.contactInfo.address}</div>` : ''}
                ${settings.branding?.contactInfo?.phone ? `<div>Phone: ${settings.branding.contactInfo.phone}</div>` : ''}
                ${settings.branding?.contactInfo?.email ? `<div>Email: ${settings.branding.contactInfo.email}</div>` : ''}
              </div>
            </div>
            <div class="quote-info">
              <div class="quote-title">QUOTE</div>
              <div class="quote-number">#${quote.quoteNumber}</div>
              <div>Date: ${new Date(quote.createdAt).toLocaleDateString()}</div>
              <div>Status: <strong>${quote.status.toUpperCase()}</strong></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Quote Information</div>
            <div class="details-grid">
              <div class="detail-item"><strong>Quote Number:</strong> ${quote.quoteNumber}</div>
              <div class="detail-item"><strong>Date Issued:</strong> ${new Date(quote.createdAt).toLocaleDateString()}</div>
              <div class="detail-item"><strong>Client:</strong> ${quote.clientName || 'N/A'}</div>
              <div class="detail-item"><strong>Status:</strong> ${quote.status.toUpperCase()}</div>
            </div>
          </div>

          ${quote.items && quote.items.length > 0 ? `
            <div class="section">
              <div class="section-title">Agricultural Services</div>
              <table class="cost-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Description</th>
                    <th class="text-right">Applied Rate</th>
                    <th class="text-right">Quantity (ha)</th>
                    <th class="text-right">Subtotal</th>
                    <th class="text-right">Discount</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${quote.items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const rate = item.calculation?.rate || item.appRate || 0;
                    const itemSubtotal = item.calculation?.subtotal || 0;
                    const itemDiscount = item.calculation?.discount || 0;
                    const itemTotal = item.calculation?.finalTotal || itemSubtotal - itemDiscount;
                    
                    return `
                      <tr>
                        <td><strong>${product?.name || 'Unknown Service'}</strong></td>
                        <td>${product?.description || 'Agricultural drone service'}</td>
                        <td class="text-right">R ${rate.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}/ha</td>
                        <td class="text-right">${item.quantity}</td>
                        <td class="text-right">R ${itemSubtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td class="text-right">${itemDiscount > 0 ? `R ${itemDiscount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '-'}</td>
                        <td class="text-right">R ${itemTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>R ${subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
            ${totalDiscount > 0 ? `
              <div class="total-row discount-text">
                <span>Total Discount:</span>
                <span>-R ${totalDiscount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div class="total-row final">
              <span>Total Amount:</span>
              <span>R ${totalCharge.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing ${settings.branding?.companyName || 'our services'}!</p>
            <p>This quote is valid for 30 days from the date of issue.</p>
            <p><em>Banking details will be provided upon acceptance of this quote.</em></p>
          </div>
        </body>
      </html>
    `;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'accepted': return 'destructive';
      case 'rejected': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Loading quote...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Quote not found</p>
              <Button onClick={() => onNavigate('quote-history')} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quote History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => onNavigate('quote-history')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowInvoiceDialog(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Convert to Invoice
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigate('new-quote', { quoteId: quote?.id })}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Quote
            </Button>
          </div>
        </div>

        {/* Quote Details */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Quote #{quote.quoteNumber}</CardTitle>
                <CardDescription>
                  Created on {new Date(quote.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant={getStatusColor(quote.status)}>
                {quote.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Information */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {quote.clientName || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Quote Items */}
            {quote.items && quote.items.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Quote Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Applied Rate (R/ha)</TableHead>
                      <TableHead className="text-right">Quantity (ha)</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Discount</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.items.map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{product?.sku || 'N/A'}</TableCell>
                          <TableCell>{product?.name || 'Unknown Product'}</TableCell>
                          <TableCell>{product?.description || 'N/A'}</TableCell>
                          <TableCell className="text-right">R {item.calculation?.rate || 0}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">R {item.calculation?.subtotal || 0}</TableCell>
                          <TableCell className="text-right">
                            {(item.calculation?.discount || 0) > 0 ? `R ${item.calculation?.discount}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">R {item.calculation?.finalTotal || 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Quote Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Quote Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R {(quote.subtotal || 0).toLocaleString()}</span>
                </div>
                {(quote.totalDiscount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Total Discount:</span>
                    <span>-R {(quote.totalDiscount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>R {(quote.totalCharge || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="flex space-x-2">
              <Button 
                variant={quote.status === 'draft' ? 'default' : 'outline'}
                onClick={() => handleStatusUpdate('draft')}
                size="sm"
              >
                Mark as Draft
              </Button>
              <Button 
                variant={quote.status === 'sent' ? 'default' : 'outline'}
                onClick={() => handleStatusUpdate('sent')}
                size="sm"
              >
                Mark as Sent
              </Button>
              <Button 
                variant={quote.status === 'accepted' ? 'default' : 'outline'}
                onClick={() => handleStatusUpdate('accepted')}
                size="sm"
              >
                Mark as Accepted
              </Button>
              <Button 
                variant={quote.status === 'rejected' ? 'default' : 'outline'}
                onClick={() => handleStatusUpdate('rejected')}
                size="sm"
              >
                Mark as Rejected
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Convert to Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convert Quote to Invoice</DialogTitle>
            <DialogDescription>
              Set the issue date and due date for the new invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issue-date" className="text-right">
                Issue Date
              </Label>
              <Input
                id="issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="due-date" className="text-right">
                Due Date
              </Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
