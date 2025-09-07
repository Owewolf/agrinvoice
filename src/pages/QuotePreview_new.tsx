import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Mail, Edit } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { productStorageService } from '@/lib/productStorage';
import { apiService } from '@/lib/api';
import { Quote, Settings, Product } from '@/types/api';
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
      const updatedQuote = await apiService.updateQuoteStatus(quote.id, newStatus);
      setQuote(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Show success message
      toast.success(`Quote status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast.error('Failed to update quote status');
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
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
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline" size="sm">
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
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Flow Rate</TableHead>
                      <TableHead>Spray Width</TableHead>
                      <TableHead>App Rate</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{getProductName(item.productId)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.speed || 'N/A'}</TableCell>
                        <TableCell>{item.flowRate || 'N/A'}</TableCell>
                        <TableCell>{item.sprayWidth || 'N/A'}</TableCell>
                        <TableCell>{item.appRate || 'N/A'}</TableCell>
                        <TableCell className="text-right">{settings?.currency} {item.calculation?.rate || 0}</TableCell>
                        <TableCell className="text-right">{settings?.currency} {item.calculation?.subtotal || 0}</TableCell>
                        <TableCell className="text-right">{settings?.currency} {item.calculation?.finalTotal || 0}</TableCell>
                      </TableRow>
                    ))}
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
                  <span>{settings?.currency} {(quote.subtotal || 0).toLocaleString()}</span>
                </div>
                {(quote.totalDiscount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Total Discount:</span>
                    <span>-{settings?.currency} {(quote.totalDiscount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{settings?.currency} {(quote.totalCharge || 0).toLocaleString()}</span>
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
    </div>
  );
}
