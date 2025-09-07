import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Eye, Trash2, Plus, Edit } from 'lucide-react';
import { authService } from '@/lib/auth';
import { storageService } from '@/lib/storage';
import { clientStorageService } from '@/lib/clientStorage';
import { Quote, User, Settings, QuoteItem } from '@/types/api';

interface QuoteHistoryProps {
  onNavigate: (page: string, params?: { invoiceId?: string; quoteId?: string }) => void;
}

// Extended type for API response with joined client data
interface QuoteWithClient extends Omit<Quote, 'items'> {
  client_name?: string;
  quote_number?: string;
  items?: QuoteItem[];
}

export default function QuoteHistory({ onNavigate }: QuoteHistoryProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const currentSettings = await storageService.getSettings();
        setUser(currentUser);
        setSettings(currentSettings);
        
        const allQuotes = await storageService.getQuotes();
        let userQuotes = allQuotes;
        
        if (currentUser?.role !== 'admin') {
          userQuotes = allQuotes.filter(q => q.userId === currentUser?.id);
        }
        
        // Sort by creation date (newest first)
        userQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setQuotes(userQuotes);
        setFilteredQuotes(userQuotes);
      } catch (error) {
        console.error('Failed to load quotes:', error);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    let filtered = quotes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(quote =>
        (quote.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.quoteNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    setFilteredQuotes(filtered);
  }, [quotes, searchTerm, statusFilter]);

  const handleDeleteQuote = async (quoteId: string) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        await storageService.deleteQuote(quoteId);
        const updatedQuotes = quotes.filter(q => q.id !== quoteId);
        setQuotes(updatedQuotes);
      } catch (error) {
        console.error('Failed to delete quote:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'paid': return 'destructive';
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
              <h1 className="text-xl font-bold text-gray-900">Quote History</h1>
            </div>
            <Button onClick={() => onNavigate('new-quote')}>
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Quotes</CardTitle>
            <CardDescription>
              Manage and track all your quotes
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by client name or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quotes Table */}
            {filteredQuotes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Area (ha)</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotes.map((quote) => {
                      // Calculate total area from quote items
                      const totalArea = quote.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                      
                      return (
                        <TableRow key={quote.id}>
                          <TableCell className="font-medium">
                            {quote.clientName || 'N/A'}
                          </TableCell>
                          <TableCell>Contact Info</TableCell>
                          <TableCell>{totalArea} ha</TableCell>
                          <TableCell>
                            R {(quote.totalCharge || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(quote.status)}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigate('quote-preview', { quoteId: quote.id })}
                                title="View Quote"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onNavigate('new-quote', { quoteId: quote.id })}
                                title="Edit Quote"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteQuote(quote.id)}
                                title="Delete Quote"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No quotes match your filters' 
                    : 'No quotes found'
                  }
                </div>
                <Button onClick={() => onNavigate('new-quote')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Quote
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
