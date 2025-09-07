import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Check } from 'lucide-react';
import { Client } from '@/types/api';
import { Client as OldClient } from '@/types/client';
import { clientStorageService } from '@/lib/clientStorage';
import { generateClientDisplayName, getClientInitials } from '@/lib/clientUtils';

// Type adapter for utility functions
const adaptClientForUtils = (client: Client): OldClient => ({
  id: client.id!,
  fullName: client.name,
  companyName: client.vatNumber || '',
  phoneNumber: client.phone,
  emailAddress: client.email || '',
  physicalAddress: typeof client.address === 'string' ? client.address : 
    client.address ? `${client.address.street || ''} ${client.address.city || ''} ${client.address.postalCode || ''}`.trim() : '',
  vatDetails: client.vatNumber || '',
  notes: client.notes || '',
  createdAt: client.createdAt || new Date().toISOString(),
  updatedAt: client.updatedAt || new Date().toISOString()
});
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ClientDropdownProps {
  value: string | null;
  onChange: (clientId: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function ClientDropdown({ value, onChange, placeholder = "Select client...", className }: ClientDropdownProps) {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const allClients = await clientStorageService.getClients();
      setClients(allClients);
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.vatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const selectedClient = value ? clients.find(c => c.id === value) : null;

  const handleSelectClient = (clientId: string) => {
    onChange(clientId);
    setOpen(false);
  };

  const handleAddNewClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    try {
      const newClient: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
        ...clientData,
        createdBy: 'current-user' // This should be set from authentication context
      };
      
      const savedClient = await clientStorageService.saveClient(newClient);
      loadClients();
      onChange(savedClient.id!);
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to save client:', error);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {selectedClient ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getClientInitials(adaptClientForUtils(selectedClient))}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{generateClientDisplayName(adaptClientForUtils(selectedClient))}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder="Search clients..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No clients found</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddModal(true)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Client
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelectClient(client.id)}
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getClientInitials(adaptClientForUtils(client))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{client.name}</div>
                      {client.vatNumber && (
                        <div className="text-sm text-muted-foreground">
                          {client.vatNumber}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {client.phone}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Client</h3>
            <form
              onSubmit={(e) => {
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
                };
                handleAddNewClient(clientData);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <input
                    name="name"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VAT Number</label>
                  <input
                    name="vatNumber"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="ABC123456"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone Number *</label>
                  <input
                    name="phone"
                    required
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="+27 82 123 4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <input
                    name="address"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <input
                    name="notes"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
