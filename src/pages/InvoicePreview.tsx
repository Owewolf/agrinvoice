import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Mail, MessageCircle } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { invoiceStorageService } from '@/lib/invoiceStorage';
import { Invoice, Settings } from '@/types/api';

interface InvoicePreviewProps {
  onNavigate: (page: string) => void;
  invoiceId?: string;
}

export default function InvoicePreview({ onNavigate, invoiceId }: InvoicePreviewProps) {
  const [invoice, setInvoice] = useState<any>(null);  // eslint-disable-line @typescript-eslint/no-explicit-any
  const [settings, setSettings] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    const loadData = async () => {
      if (invoiceId) {
        try {
          const foundInvoice = await invoiceStorageService.getInvoice(invoiceId);
          if (foundInvoice) {
            setInvoice(foundInvoice);
          }
        } catch (error) {
          console.error('Error loading invoice:', error);
        }
      }
      
      try {
        const currentSettings = await storageService.getSettings();
        setSettings(currentSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadData();
  }, [invoiceId]);

  const handleStatusChange = (newStatus: 'draft' | 'sent' | 'paid' | 'overdue') => {
    if (invoice) {
      const updatedInvoice = { ...invoice, status: newStatus };
      setInvoice(updatedInvoice);
      invoiceStorageService.saveInvoice(updatedInvoice);
    }
  };

  // Add loading state check
  if (!invoice || !settings) {
    return <div className="p-6">Loading...</div>;
  }

  // Handle both legacy and new invoice formats
  const isLegacyInvoice = !invoice || !invoice.items || invoice.items.length === 0;

  const handleDownloadPDF = () => {
    const printContent = generatePrintableInvoice();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrintableInvoice = () => {
    if (!invoice || !settings) return '';

    const subtotal = isLegacyInvoice ? ((invoice.hectares || 0) * (invoice.costPerHa || 0)) : invoice.subtotal;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice.clientName}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .invoice-title { font-size: 20px; margin-top: 10px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; padding: 10px; background: #f3f4f6; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
            .detail-item { padding: 5px 0; }
            .cost-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .cost-table th, .cost-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .cost-table th { background-color: #f8f9fa; font-weight: bold; }
            .cost-table .text-right { text-align: right; }
            .total-row { font-weight: bold; background-color: #fef2f2; }
            .discount-text { color: #059669; }
            .product-details { font-size: 12px; color: #666; margin-top: 4px; }
            .banking-section { background: #f8f9fa; padding: 15px; border: 1px solid #ddd; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${settings.branding?.companyName || 'Company Name'}</div>
            ${settings.branding?.contactInfo?.email || settings.branding?.contactInfo?.phone || settings.branding?.contactInfo?.address ? `
              <div style="margin: 10px 0; font-size: 14px;">
                ${settings.branding?.contactInfo?.email ? `<div>Email: ${settings.branding.contactInfo.email}</div>` : ''}
                ${settings.branding?.contactInfo?.phone ? `<div>Phone: ${settings.branding.contactInfo.phone}</div>` : ''}
                ${settings.branding?.contactInfo?.address ? `<div>Address: ${settings.branding.contactInfo.address}</div>` : ''}
              </div>
            ` : ''}
            <div class="invoice-title">INVOICE</div>
            <div><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
            <div><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</div>
            <div><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Client Information</div>
            <div class="details-grid">
              <div class="detail-item"><strong>Client:</strong> ${invoice.clientName}</div>
              <div class="detail-item"><strong>Contact:</strong> ${invoice.clientContact}</div>
            </div>
          </div>

          ${!isLegacyInvoice ? `
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
                ${(invoice.items || []).map(quoteItem => `
                <tr>
                  <td>
                    <strong>${quoteItem.name || `Item ${quoteItem.productId}`}</strong>
                  </td>
                  <td class="text-right">${quoteItem.quantity}</td>
                  <td class="text-right">${settings.currency || 'R'} ${(quoteItem.calculation?.rate || 0)}</td>
                  <td class="text-right">${settings.currency || 'R'} ${(quoteItem.calculation?.subtotal || 0).toFixed(2)}</td>
                  <td class="text-right ${(quoteItem.calculation?.discount || 0) > 0 ? 'discount-text' : ''}">
                    ${(quoteItem.calculation?.discount || 0) > 0 ? `-${settings.currency || 'R'} ${(quoteItem.calculation?.discount || 0).toFixed(2)}` : '-'}
                  </td>
                  <td class="text-right"><strong>${settings.currency || 'R'} ${(quoteItem.calculation?.finalTotal || 0).toFixed(2)}</strong></td>
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
                  <td class="text-right"><strong>${settings.currency} ${invoice.subtotal.toFixed(2)}</strong></td>
                </tr>
                ${invoice.totalDiscount && invoice.totalDiscount > 0 ? `
                <tr class="discount-text">
                  <td><strong>Total Discounts</strong></td>
                  <td class="text-right"><strong>-${settings.currency} ${invoice.totalDiscount.toFixed(2)}</strong></td>
                </tr>
                ` : ''}
                <tr class="total-row">
                  <td><strong>TOTAL AMOUNT DUE</strong></td>
                  <td class="text-right"><strong>${settings.currency} ${invoice.totalCharge.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : `
          <div class="section">
            <div class="section-title">Job Details</div>
            <div class="details-grid">
              <div class="detail-item"><strong>Total Area:</strong> ${invoice.hectares || 0} ha</div>
              <div class="detail-item"><strong>Drone Speed:</strong> ${invoice.speed || 0} m/s</div>
              <div class="detail-item"><strong>Flow Rate:</strong> ${invoice.flowRate || 0} L/min</div>
              <div class="detail-item"><strong>Spray Width:</strong> ${invoice.sprayWidth || 0} m</div>
              <div class="detail-item"><strong>Application Rate:</strong> ${invoice.appRate || 0} L/ha</div>
              <div class="detail-item"><strong>Rate per Hectare:</strong> ${settings.currency} ${invoice.costPerHa || 0}</div>
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
                ${(invoice.hectares || 0) <= settings.discountThreshold ? `
                <tr>
                  <td>${invoice.hectares || 0} ha @ ${settings.currency} ${invoice.costPerHa || 0}/ha</td>
                  <td class="text-right">${settings.currency} ${subtotal.toFixed(2)}</td>
                </tr>
                ` : `
                <tr>
                  <td>First ${settings.discountThreshold.toFixed(2)} ha @ ${settings.currency} ${invoice.costPerHa || 0}/ha</td>
                  <td class="text-right">${settings.currency} ${(settings.discountThreshold * (invoice.costPerHa || 0)).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Next ${((invoice.hectares || 0) - settings.discountThreshold).toFixed(2)} ha @ ${settings.currency} ${((invoice.costPerHa || 0) * (1 - settings.discountRate)).toFixed(2)}/ha</td>
                  <td class="text-right">${settings.currency} ${(((invoice.hectares || 0) - settings.discountThreshold) * (invoice.costPerHa || 0) * (1 - settings.discountRate)).toFixed(2)}</td>
                </tr>
                `}
                <tr class="total-row">
                  <td><strong>TOTAL AMOUNT DUE</strong></td>
                  <td class="text-right"><strong>${settings.currency} ${invoice.totalCharge.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          `}

          ${settings.payments?.bankName || settings.payments?.accountNumber ? `
          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="banking-section">
              ${settings.payments?.bankName ? `<div><strong>Bank:</strong> ${settings.payments.bankName}</div>` : ''}
              ${settings.payments?.accountName ? `<div><strong>Account Name:</strong> ${settings.payments.accountName}</div>` : ''}
              ${settings.payments?.accountNumber ? `<div><strong>Account Number:</strong> ${settings.payments.accountNumber}</div>` : ''}
              ${settings.payments?.branchCode ? `<div><strong>Branch Code:</strong> ${settings.payments.branchCode}</div>` : ''}
              <div><strong>Payment Reference:</strong> ${invoice.invoiceNumber}</div>
              <div style="margin-top: 10px;"><em>Please use the invoice number as payment reference.</em></div>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Terms & Conditions</div>
            <p>• Payment due by ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <p>• Late payments may incur additional charges</p>
            <p>• Please quote invoice number in all correspondence</p>
            <p style="margin-top: 15px;"><em>Thank you for choosing ${settings.branding?.companyName || 'our services'}!</em></p>
          </div>
        </body>
      </html>
    `;
  };

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-600">Invoice not found</h2>
          <Button onClick={() => onNavigate('dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'paid': return 'destructive';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

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
              <h1 className="text-xl font-bold text-gray-900">Invoice Preview</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="text-center border-b">
                <CardTitle className="text-2xl text-blue-600">
                  {settings?.branding?.companyName || 'Company Name'}
                </CardTitle>
                {settings?.branding?.contactInfo && (
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    {settings.branding.contactInfo.email && (
                      <p>Email: {settings.branding.contactInfo.email}</p>
                    )}
                    {settings.branding.contactInfo.phone && (
                      <p>Phone: {settings.branding.contactInfo.phone}</p>
                    )}
                    {settings.branding.contactInfo.address && (
                      <p>Address: {settings.branding.contactInfo.address}</p>
                    )}
                  </div>
                )}
                <CardDescription className="text-lg mt-4">INVOICE</CardDescription>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                  <p><strong>Issue Date:</strong> {new Date(invoice.issueDate).toLocaleDateString()}</p>
                  <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Client Information */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Client Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Client:</span> {invoice.clientName}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {invoice.clientContact}
                    </div>
                  </div>
                </div>

                <Separator />

                {isLegacyInvoice ? (
                  // Legacy single-product display
                  <>
                    {/* Job Details */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Job Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total Area:</span> {invoice.hectares} ha
                        </div>
                        <div>
                          <span className="font-medium">Drone Speed:</span> {invoice.speed} m/s
                        </div>
                        <div>
                          <span className="font-medium">Flow Rate:</span> {invoice.flowRate} L/min
                        </div>
                        <div>
                          <span className="font-medium">Spray Width:</span> {invoice.sprayWidth} m
                        </div>
                        <div>
                          <span className="font-medium">Application Rate:</span> {invoice.appRate} L/ha
                        </div>
                        <div>
                          <span className="font-medium">Rate per Hectare:</span> {settings?.currency} {invoice.costPerHa}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Legacy Cost Breakdown */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Cost Breakdown</h3>
                      <div className="space-y-2">
                        {invoice.hectares! <= (settings?.discountThreshold || 100) ? (
                          <div className="flex justify-between">
                            <span>{invoice.hectares} ha @ {settings?.currency} {invoice.costPerHa}/ha</span>
                            <span>{settings?.currency} {(invoice.hectares! * invoice.costPerHa!).toFixed(2)}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>First {settings?.discountThreshold || 100} ha @ {settings?.currency} {invoice.costPerHa}/ha</span>
                              <span>{settings?.currency} {((settings?.discountThreshold || 100) * invoice.costPerHa!).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Next {(invoice.hectares! - (settings?.discountThreshold || 100)).toFixed(2)} ha @ {settings?.currency} {(invoice.costPerHa! * (1 - (settings?.discountRate || 0.15))).toFixed(2)}/ha</span>
                              <span>{settings?.currency} {((invoice.hectares! - (settings?.discountThreshold || 100)) * invoice.costPerHa! * (1 - (settings?.discountRate || 0.15))).toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between text-lg font-bold bg-red-50 p-3 rounded">
                          <span>TOTAL AMOUNT DUE</span>
                          <span>{settings?.currency} {invoice.totalCharge.toFixed(2)}</span>
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
                            {(invoice.items || []).map((quoteItem, index) => (
                              <tr key={index}>
                                <td className="py-3 px-3 border border-gray-200">
                                  <div>
                                    <div className="font-medium">{quoteItem.name || `Item ${quoteItem.productId}`}</div>
                                  </div>
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200">
                                  {quoteItem.quantity}
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200">
                                  {settings?.currency} {quoteItem.calculation?.rate || 0}
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200">
                                  {settings?.currency} {(quoteItem.calculation?.subtotal || 0).toFixed(2)}
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200">
                                  {(quoteItem.calculation?.discount || 0) > 0 ? (
                                    <span className="text-green-600">-{settings?.currency} {(quoteItem.calculation?.discount || 0).toFixed(2)}</span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="text-right py-3 px-3 border border-gray-200 font-medium">
                                  {settings?.currency} {(quoteItem.calculation?.finalTotal || 0).toFixed(2)}
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
                          <span>{settings?.currency} {invoice.subtotal.toFixed(2)}</span>
                        </div>
                        
                        {invoice.totalDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Total Discounts</span>
                            <span>-{settings?.currency} {invoice.totalDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between text-lg font-bold bg-red-50 p-3 rounded">
                          <span>TOTAL AMOUNT DUE</span>
                          <span>{settings?.currency} {invoice.totalCharge.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Banking Details */}
                {settings?.payments && (settings.payments.bankName || settings.payments.accountNumber) && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        {settings.payments.bankName && (
                          <div><span className="font-medium">Bank:</span> {settings.payments.bankName}</div>
                        )}
                        {settings.payments.accountName && (
                          <div><span className="font-medium">Account Name:</span> {settings.payments.accountName}</div>
                        )}
                        {settings.payments.accountNumber && (
                          <div><span className="font-medium">Account Number:</span> {settings.payments.accountNumber}</div>
                        )}
                        {settings.payments.branchCode && (
                          <div><span className="font-medium">Branch Code:</span> {settings.payments.branchCode}</div>
                        )}
                        <div><span className="font-medium">Payment Reference:</span> {invoice.invoiceNumber}</div>
                        <div className="mt-2 text-gray-600 italic">Please use the invoice number as payment reference.</div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Terms */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Terms & Conditions</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Payment due by {new Date(invoice.dueDate).toLocaleDateString()}</li>
                    <li>• Late payments may incur additional charges</li>
                    <li>• Please quote invoice number in all correspondence</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-3 italic">
                    Thank you for choosing {settings?.branding?.companyName || 'our services'}!
                  </p>
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
                    variant={invoice.status === 'draft' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('draft')}
                  >
                    Mark as Draft
                  </Button>
                  <Button
                    variant={invoice.status === 'sent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('sent')}
                  >
                    Mark as Sent
                  </Button>
                  <Button
                    variant={invoice.status === 'paid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange('paid')}
                  >
                    Mark as Paid
                  </Button>
                  {invoice.status === 'overdue' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled
                    >
                      Overdue
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}