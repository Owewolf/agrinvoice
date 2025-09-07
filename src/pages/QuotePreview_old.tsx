import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Mail, MessageCircle, Save, Edit, FileText } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { invoiceStorageService } from '@/lib/invoiceStorage';
import { Quote, Settings, Invoice } from '@/types/api';

interface QuotePreviewProps {
  onNavigate: (page: string, params?: { invoiceId?: string; quoteId?: string }) => void;
  quoteId?: string;
}

export default function QuotePreview({ onNavigate, quoteId }: QuotePreviewProps) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    const loadQuote = async () => {
      if (quoteId) {
        try {
          const quotes = await storageService.getQuotes();
          const foundQuote = quotes.find(q => q.id === quoteId);
          if (foundQuote) {
            setQuote(foundQuote);
          } else {
            console.error('Quote not found:', quoteId);
          }
        } catch (error) {
          console.error('Error loading quote:', error);
        }
      }
    };

    const loadSettings = async () => {
      try {
        const currentSettings = await storageService.getSettings();
        setSettings(currentSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadQuote();
    loadSettings();
  }, [quoteId]);

  const handleStatusUpdate = async (newStatus: 'draft' | 'sent' | 'accepted' | 'rejected') => {
    if (!quote) return;
    
    try {
      const updatedQuote = { ...quote, status: newStatus };
      setQuote(updatedQuote);
      await storageService.saveQuote(updatedQuote);
    } catch (error) {
      console.error('Error updating quote status:', error);
    }
  };    const handleCreateInvoice = async () => {
    if (!quote || !settings) return;

    // Calculate total quantities for invoice
    const totalQuantity = quote.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: `INV-${Date.now()}`, // Simple invoice number generation
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      clientId: quote.clientId,
      clientName: quote.clientName,
      issueDate,
      dueDate,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: quote.items || [],
    };

    try {
      await invoiceStorageService.saveInvoice(invoice);
      setShowInvoiceDialog(false);
      onNavigate('invoice-preview', { invoiceId: invoice.id });
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  // Check if quote has the new structure with items
  const hasItems = quote && quote.items && quote.items.length > 0;

  const handleDownloadPDF = () => {
    // Create a printable version
    const printContent = generatePrintableQuote();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
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
            body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .quote-title { font-size: 20px; margin-top: 10px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; padding: 10px; background: #f3f4f6; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
            .detail-item { padding: 5px 0; }
            .cost-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .cost-table th, .cost-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .cost-table th { background-color: #f8f9fa; font-weight: bold; }
            .cost-table .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #f0f9ff; }
            .discount-text { color: #059669; }
            .product-details { font-size: 12px; color: #666; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${settings.companyName}</div>
            <div class="quote-title">SPRAYING QUOTE</div>
            <div>Date: ${new Date(quote.createdAt).toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Client Information</div>
            <div class="details-grid">
              <div class="detail-item"><strong>Client:</strong> ${quote.clientName}</div>
              <div class="detail-item"><strong>Contact:</strong> ${quote.clientContact}</div>
            </div>
          </div>

          ${!isLegacyQuote ? `
          <div class="section">
            <div class="section-title">Services & Products</div>
            <table class="cost-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Subtotal</th>
                  <th class="text-right">Discount</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${quote.products.map(quoteProduct => `
                <tr>
                  <td>
                    <strong>${quoteProduct.product.name}</strong>
                    <div class="product-details">
                      ${quoteProduct.product.category} • ${quoteProduct.product.sku}
                      ${quoteProduct.appRate ? `<br>App Rate: ${quoteProduct.appRate} ${quoteProduct.product.category === 'granular' ? 'kg/ha' : 'L/ha'}` : ''}
                    </div>
                  </td>
                  <td class="text-right">${quoteProduct.quantity} ${quoteProduct.product.unit}</td>
                  <td class="text-right">${settings.currency} ${quoteProduct.appliedRate}</td>
                  <td class="text-right">${settings.currency} ${quoteProduct.subtotal.toFixed(2)}</td>
                  <td class="text-right ${quoteProduct.discountAmount > 0 ? 'discount-text' : ''}">
                    ${quoteProduct.discountAmount > 0 ? `-${settings.currency} ${quoteProduct.discountAmount.toFixed(2)}` : '-'}
                  </td>
                  <td class="text-right"><strong>${settings.currency} ${quoteProduct.total.toFixed(2)}</strong></td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Total Summary</div>
            <table class="cost-table">
              <tbody>
                <tr>
                  <td><strong>Subtotal</strong></td>
                  <td class="text-right"><strong>${settings.currency} ${quote.subtotal.toFixed(2)}</strong></td>
                </tr>
                ${quote.totalDiscount && quote.totalDiscount > 0 ? `
                <tr class="discount-text">
                  <td><strong>Total Discounts</strong></td>
                  <td class="text-right"><strong>-${settings.currency} ${quote.totalDiscount.toFixed(2)}</strong></td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td><strong>FINAL AMOUNT DUE</strong></td>
                  <td class="text-right"><strong>${settings.currency} ${quote.totalCharge.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : `
          <div class="section">
            <div class="section-title">Job Details</div>
            <div class="details-grid">
              <div class="detail-item"><strong>Total Area:</strong> ${quote.hectares || 0} ha</div>
              <div class="detail-item"><strong>Drone Speed:</strong> ${quote.speed || 0} m/s</div>
              <div class="detail-item"><strong>Flow Rate:</strong> ${quote.flowRate || 0} L/min</div>
              <div class="detail-item"><strong>Spray Width:</strong> ${quote.sprayWidth || 0} m</div>
              <div class="detail-item"><strong>Application Rate:</strong> ${quote.appRate || 0} L/ha</div>
              <div class="detail-item"><strong>Rate per Hectare:</strong> ${settings.currency} ${quote.costPerHa || 0}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Cost Breakdown</div>
            <table class="cost-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(quote.hectares || 0) <= settings.discountThreshold ? `
                <tr>
                  <td>${quote.hectares || 0} ha @ ${settings.currency} ${quote.costPerHa || 0}/ha</td>
                  <td class="text-right">${settings.currency} ${subtotal.toFixed(2)}</td>
                </tr>
                ` : `
                <tr>
                  <td>First ${settings.discountThreshold.toFixed(2)} ha @ ${settings.currency} ${quote.costPerHa || 0}/ha</td>
                  <td class="text-right">${settings.currency} ${(settings.discountThreshold * (quote.costPerHa || 0)).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Next ${((quote.hectares || 0) - settings.discountThreshold).toFixed(2)} ha @ ${settings.currency} ${((quote.costPerHa || 0) * (1 - settings.discountRate)).toFixed(2)}/ha</td>
                  <td class="text-right">${settings.currency} ${(((quote.hectares || 0) - settings.discountThreshold) * (quote.costPerHa || 0) * (1 - settings.discountRate)).toFixed(2)}</td>
                </tr>
                `}
                <tr class="total-row">
                  <td><strong>FINAL AMOUNT DUE</strong></td>
                  <td class="text-right"><strong>${settings.currency} ${quote.totalCharge.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          `}

          <div class="section">
            <div class="section-title">Terms & Conditions</div>
            <p>• Payment due within 30 days of service completion</p>
            <p>• Weather conditions may affect scheduling</p>
            <p>• Quote valid for 30 days from issue date</p>
          </div>
        </body>
      </html>
    `;
  };

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-600">Quote not found</h2>
          <Button onClick={() => onNavigate('dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Quote Preview</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={quote.status === 'draft' ? 'secondary' : quote.status === 'sent' ? 'default' : 'destructive'}>
                {quote.status}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quote Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="text-center border-b">
                <CardTitle className="text-2xl text-blue-600">
                  {settings?.companyName || 'AgriHover Drone Services'}
                </CardTitle>
                <CardDescription className="text-lg">SPRAYING QUOTE</CardDescription>
                <p className="text-sm text-gray-500">
                  Date: {new Date(quote.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Client Information */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Client Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Client:</span> {quote.clientName}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {quote.clientContact}
                    </div>
                  </div>
                </div>

                <Separator />

                {isLegacyQuote ? (
                  // Legacy single-product display
                  <>
                    {/* Job Details */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Job Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Area:</span> {quote.hectares} ha
                        </div>
                        <div>
                          <span className="font-medium">Drone Speed:</span> {quote.speed} m/s
                        </div>
                        <div>
                          <span className="font-medium">Flow Rate:</span> {quote.flowRate} L/min
                        </div>
                        <div>
                          <span className="font-medium">Spray Width:</span> {quote.sprayWidth} m
                        </div>
                        <div>
                          <span className="font-medium">Application Rate:</span> {quote.appRate} L/ha
                        </div>
                        <div>
                          <span className="font-medium">Rate per Hectare:</span> {settings?.currency} {quote.costPerHa}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Legacy Cost Breakdown */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Cost Breakdown</h3>
                      <div className="space-y-2">
                        {quote.hectares! <= (settings?.discountThreshold || 100) ? (
                          <div className="flex justify-between">
                            <span>{quote.hectares} ha @ {settings?.currency} {quote.costPerHa}/ha</span>
                            <span>{settings?.currency} {(quote.hectares! * quote.costPerHa!).toFixed(2)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>First {settings?.discountThreshold || 100} ha @ {settings?.currency} {quote.costPerHa}/ha</span>
                              <span>{settings?.currency} {((settings?.discountThreshold || 100) * quote.costPerHa!).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Next {(quote.hectares! - (settings?.discountThreshold || 100)).toFixed(2)} ha @ {settings?.currency} {(quote.costPerHa! * (1 - (settings?.discountRate || 0.15))).toFixed(2)}/ha</span>
                              <span>{settings?.currency} {((quote.hectares! - (settings?.discountThreshold || 100)) * quote.costPerHa! * (1 - (settings?.discountRate || 0.15))).toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between text-lg font-bold bg-blue-50 p-3 rounded">
                          <span>FINAL AMOUNT DUE</span>
                          <span>{settings?.currency} {quote.totalCharge.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Multi-product display
                  <>
                    {/* Services & Products */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Services & Products</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left py-2 px-3 border border-gray-200">Product</th>
                              <th className="text-right py-2 px-3 border border-gray-200">Qty</th>
                              <th className="text-right py-2 px-3 border border-gray-200">Rate</th>
                              <th className="text-right py-2 px-3 border border-gray-200">Subtotal</th>
                              <th className="text-right py-2 px-3 border border-gray-200">Discount</th>
                              <th className="text-right py-2 px-3 border border-gray-200">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quote.products!.map((quoteProduct, index) => (
                              <tr key={index}>
                                <td className="py-3 px-3 border border-gray-200">
                                  <div>
                                    <div className="font-medium">{quoteProduct.product.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {quoteProduct.product.category} • {quoteProduct.product.sku}
                                    </div>
                                    {quoteProduct.appRate && (
                                      <div className="text-xs text-gray-500">
                                        App Rate: {quoteProduct.appRate} {quoteProduct.product.category === 'granular' ? 'kg/ha' : 'L/ha'}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200">
                                  {quoteProduct.quantity} {quoteProduct.product.unit}
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200">
                                  {settings?.currency} {quoteProduct.appliedRate}
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200">
                                  {settings?.currency} {quoteProduct.subtotal.toFixed(2)}
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200">
                                  {quoteProduct.discountAmount > 0 ? (
                                    <span className="text-green-600">-{settings?.currency} {quoteProduct.discountAmount.toFixed(2)}</span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200 font-medium">
                                  {settings?.currency} {quoteProduct.total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Separator />

                    {/* Multi-product Total Summary */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Total Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{settings?.currency} {quote.subtotal.toFixed(2)}</span>
                        </div>
                        
                        {quote.totalDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Total Discounts</span>
                            <span>-{settings?.currency} {quote.totalDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between text-lg font-bold bg-blue-50 p-3 rounded">
                          <span>FINAL AMOUNT DUE</span>
                          <span>{settings?.currency} {quote.totalCharge.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Terms */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Terms & Conditions</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Payment due within 30 days of service completion</li>
                    <li>• Weather conditions may affect scheduling</li>
                    <li>• Quote valid for 30 days from issue date</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleDownloadPDF} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                
                <Button onClick={() => setShowInvoiceDialog(true)} className="w-full" variant="default">
                  <FileText className="h-4 w-4 mr-2" />
                  Convert to Invoice
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send via Email
                </Button>
                
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col space-y-2">
                  <Button
                    variant={quote.status === 'draft' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('draft')}
                  >
                    Mark as Draft
                  </Button>
                  <Button
                    variant={quote.status === 'sent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('sent')}
                  >
                    Mark as Sent
                  </Button>
                  <Button
                    variant={quote.status === 'paid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('paid')}
                  >
                    Mark as Paid
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Convert to Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Quote to Invoice</DialogTitle>
            <DialogDescription>
              This will create a new invoice based on this quote. You can set the issue and due dates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvertToInvoice}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}