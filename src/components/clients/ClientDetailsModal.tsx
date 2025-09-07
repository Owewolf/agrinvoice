import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, getClientInitials } from '@/lib/clientUtils';
import { Client } from '@/types/client';
import { clientStorageService } from '@/lib/clientStorage';
import { storageService } from '@/lib/storage';
import { invoiceStorageService } from '@/lib/invoiceStorage';
import { Quote } from '@/types';
import { Invoice } from '@/types';
import { Calendar, Phone, Mail, MapPin, FileText, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface ClientDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export function ClientDetailsModal({ open, onOpenChange, client, onNavigate }: ClientDetailsModalProps) {
  const [clientStats, setClientStats] = useState({
    totalQuotes: 0,
    totalInvoices: 0,
    outstandingAmount: 0,
    paidAmount: 0
  });
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (client) {
      loadClientData();
    }
  }, [client]);

  const loadClientData = () => {
    const stats = clientStorageService.getClientStats(client.id);
    setClientStats(stats);

    const clientQuotes = storageService.getQuotes().filter(q => q.clientId === client.id);
    const clientInvoices = invoiceStorageService.getInvoices().filter(i => i.clientId === client.id);

    setQuotes(clientQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setInvoices(clientInvoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleCreateQuote = () => {
    onOpenChange(false);
    onNavigate('new-quote', { clientId: client.id });
  };

  const handleViewQuote = (quoteId: string) => {
    onOpenChange(false);
    onNavigate('quote-preview', { quoteId });
  };

  const handleViewInvoice = (invoiceId: string) => {
    onOpenChange(false);
    onNavigate('invoice-preview', { invoiceId });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
          <DialogDescription>
            View client information and transaction history
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Client Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">
                    {getClientInitials(client)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl font-semibold">{client.fullName}</div>
                  {client.companyName && (
                    <div className="text-sm text-muted-foreground">{client.companyName}</div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{client.phoneNumber}</span>
                  </div>
                  {client.emailAddress && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{client.emailAddress}</span>
                    </div>
                  )}
                  {client.physicalAddress && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{client.physicalAddress}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {client.vatDetails && (
                    <div>
                      <span className="text-sm text-muted-foreground">VAT Number:</span>
                      <div>{client.vatDetails}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Client Since:</span>
                    <div>{format(new Date(client.createdAt), 'MMMM d, yyyy')}</div>
                  </div>
                </div>
              </div>
              {client.notes && (
                <div className="mt-4">
                  <span className="text-sm text-muted-foreground">Notes:</span>
                  <p className="text-sm mt-1">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{clientStats.totalQuotes}</div>
                  <div className="text-sm text-muted-foreground">Total Quotes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{clientStats.totalInvoices}</div>
                  <div className="text-sm text-muted-foreground">Total Invoices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(clientStats.paidAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Paid</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(clientStats.outstandingAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Quotes and Invoices */}
          <Tabs defaultValue="quotes" className="w-full">
            <TabsList>
              <TabsTrigger value="quotes">Quotes ({quotes.length})</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="quotes">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Quote History</CardTitle>
                    <Button onClick={handleCreateQuote} size="sm">
                      Create New Quote
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {quotes.length > 0 ? (
                    <div className="space-y-3">
                      {quotes.map((quote) => (
                        <div
                          key={quote.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleViewQuote(quote.id)}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                Quote #{quote.id.slice(-6)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {formatCurrency(quote.totalCharge)}
                            </span>
                            {getStatusBadge(quote.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No quotes found for this client</p>
                      <Button onClick={handleCreateQuote} size="sm">
                        Create First Quote
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className="space-y-3">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {invoice.invoiceNumber}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium">
                              {formatCurrency(invoice.totalCharge)}
                            </span>
                            {getStatusBadge(invoice.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No invoices found for this client</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
