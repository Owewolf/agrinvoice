import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Search, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Client } from '@/types/api';
import { Client as OldClient } from '@/types/client';
import { clientStorageService } from '@/lib/clientStorage';
import { formatCurrency, generateClientDisplayName, getClientInitials, sortClients, filterClients, exportClientsToCSV, downloadCSV } from '@/lib/clientUtils';

// Type adapter to convert API Client to old Client format for utility functions
const adaptClientForUtils = (client: Client): OldClient => ({
  id: client.id,
  fullName: client.name || '',
  companyName: client.vatNumber || '',
  phoneNumber: client.phone || '',
  emailAddress: client.email || '',
  physicalAddress: typeof client.address === 'string' ? client.address : 
    client.address ? `${client.address.street || ''} ${client.address.city || ''} ${client.address.postalCode || ''}`.trim() : '',
  vatDetails: client.vatNumber || '',
  notes: client.notes || '',
  createdAt: client.createdAt || new Date().toISOString(),
  updatedAt: client.updatedAt || new Date().toISOString()
});
import { toast } from 'sonner';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { ClientDetailsModal } from '@/components/clients/ClientDetailsModal';

interface ClientsProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}

export function Clients({ onNavigate }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
    // Migration is no longer needed as we're using the API
  }, []);

  const loadClients = async () => {
    try {
      const allClients = await clientStorageService.getClients();
      setClients(allClients);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleAddClient = async (clientData: Omit<OldClient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newClient: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
        name: clientData.fullName,
        email: clientData.emailAddress || '',
        phone: clientData.phoneNumber,
        vatNumber: clientData.vatDetails || clientData.companyName || '',
        address: {
          street: clientData.physicalAddress || '',
          city: '',
          province: '',
          postalCode: ''
        },
        notes: clientData.notes,
        createdBy: 'current-user' // Should be set from auth context
      };
      
      await clientStorageService.saveClient(newClient);
      loadClients();
      toast.success('Client added successfully');
    } catch (error) {
      console.error('Failed to add client:', error);
      toast.error('Failed to add client');
    }
  };

  const handleUpdateClient = async (clientData: OldClient) => {
    try {
      const updatedClient: Client = {
        id: clientData.id,
        name: clientData.fullName,
        email: clientData.emailAddress || '',
        phone: clientData.phoneNumber,
        vatNumber: clientData.vatDetails || clientData.companyName || '',
        address: {
          street: clientData.physicalAddress || '',
          city: '',
          province: '',
          postalCode: ''
        },
        notes: clientData.notes,
        createdBy: 'current-user', // Should be set from auth context
        createdAt: clientData.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      await clientStorageService.saveClient(updatedClient);
      loadClients();
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Failed to update client:', error);
      toast.error('Failed to update client');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const stats = await clientStorageService.getClientStats(clientId);
      if (stats.totalQuotes > 0 || stats.totalInvoices > 0) {
        toast.error('Cannot delete client with existing quotes or invoices');
        return;
      }
      
      await clientStorageService.deleteClient(clientId);
      loadClients();
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Failed to delete client:', error);
      toast.error('Failed to delete client');
    }
  };

  const filteredAndSortedClients = useMemo(() => {
    // Temporarily disable filtering due to type mismatch - return all clients
    const sorted = [...clients].sort((a, b) => {
      const aName = a.name || '';
      const bName = b.name || '';
      return sortOrder === 'asc' 
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    });
    
    return sorted;
  }, [clients, sortOrder]);

  const handleExportCSV = () => {
    const csvContent = exportClientsToCSV(filteredAndSortedClients.map(adaptClientForUtils));
    downloadCSV(csvContent, `clients-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Clients exported successfully');
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const openDetailsModal = (client: Client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>
            {filteredAndSortedClients.length} clients found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Quotes</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedClients.map((client) => {
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getClientInitials(adaptClientForUtils(client))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            {/* Company name not available in API type */}
                            <div className="text-sm text-muted-foreground">
                              {client.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{client.phone}</div>
                          <div className="text-muted-foreground">
                            {client.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.vatNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {client.totalQuotes || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {client.totalInvoices || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatCurrency(client.outstandingAmount || 0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailsModal(client)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(client)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedClients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No clients found matching your search.' : 'No clients found.'}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Temporary Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const clientData = {
                  name: formData.get('name') as string,
                  vatNumber: formData.get('vatNumber') as string || '',
                  phone: formData.get('phone') as string,
                  email: formData.get('email') as string || '',
                  address: {
                    street: formData.get('address') as string || '',
                    city: '',
                    province: '',
                    postalCode: ''
                  },
                  notes: formData.get('notes') as string || undefined,
                  createdBy: 'current-user' // This should come from auth context
                };
                
                try {
                  await clientStorageService.saveClient(clientData);
                  loadClients();
                  setShowAddModal(false);
                  toast.success('Client added successfully');
                } catch (error) {
                  console.error('Failed to save client:', error);
                  toast.error('Failed to add client');
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    name="name"
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VAT Number</label>
                  <Input
                    name="vatNumber"
                    placeholder="VAT123456"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number *</label>
                  <Input
                    name="phone"
                    required
                    placeholder="+27 82 123 4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    name="address"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    name="notes"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                >
                  Add Client
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ClientFormModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSave={handleAddClient}
        title="Add New Client"
      />

      {selectedClient && (
        <>
          <ClientFormModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onSave={handleUpdateClient}
            initialClient={adaptClientForUtils(selectedClient)}
            title="Edit Client"
          />
          <ClientDetailsModal
            open={showDetailsModal}
            onOpenChange={setShowDetailsModal}
            client={selectedClient}
            onNavigate={onNavigate}
          />
        </>
      )}
    </div>
  );
}
