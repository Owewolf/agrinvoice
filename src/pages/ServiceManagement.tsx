import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react';
import { Service } from '@/types/api';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface ServiceManagementProps {
  onNavigate: (page: string) => void;
}

export default function ServiceManagement({ onNavigate }: ServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({ name: '', description: '', unit: 'unit' });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const loadedServices = await apiService.getServices();
      setServices(loadedServices);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    setServiceLoading(true);
    try {
      const createdService = await apiService.createService(newService);
      setServices([...services, createdService]);
      setNewService({ name: '', description: '', unit: 'unit' });
      setIsAddServiceOpen(false);
      toast.success('Service added successfully!');
    } catch (error) {
      toast.error('Failed to add service');
    } finally {
      setServiceLoading(false);
    }
  };

  const handleEditService = async () => {
    if (!editingService || !editingService.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    setServiceLoading(true);
    try {
      const updatedService = await apiService.updateService(editingService.id, {
        name: editingService.name,
        description: editingService.description,
        unit: editingService.unit
      });
      setServices(services.map(srv => srv.id === updatedService.id ? updatedService : srv));
      setEditingService(null);
      setIsEditServiceOpen(false);
      toast.success('Service updated successfully!');
    } catch (error) {
      toast.error('Failed to update service');
    } finally {
      setServiceLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone and may affect existing products.')) {
      return;
    }

    setServiceLoading(true);
    try {
      await apiService.deleteService(serviceId);
      setServices(services.filter(srv => srv.id !== serviceId));
      toast.success('Service deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete service. It may be in use by existing products.');
    } finally {
      setServiceLoading(false);
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
                onClick={() => onNavigate('admin-settings')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin Settings
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Service Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceName">Service Name</Label>
                      <Input
                        id="serviceName"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        placeholder="e.g., Drone Spraying Services"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceDescription">Description</Label>
                      <Textarea
                        id="serviceDescription"
                        value={newService.description}
                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                        placeholder="Brief description of this service"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceUnit">Unit</Label>
                      <Select
                        value={newService.unit}
                        onValueChange={(value) => setNewService({ ...newService, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hectares">Hectares</SelectItem>
                          <SelectItem value="liters/ha">Liters per Hectare</SelectItem>
                          <SelectItem value="kg/ha">Kilograms per Hectare</SelectItem>
                          <SelectItem value="km">Kilometers</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="nights">Nights</SelectItem>
                          <SelectItem value="unit">Units</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddService} disabled={serviceLoading}>
                        {serviceLoading ? 'Adding...' : 'Add Service'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Service Management</span>
            </CardTitle>
            <CardDescription>
              Manage services for your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No services found. Add your first service to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="font-medium">{service.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {service.description || 'No description provided'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{service.unit}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingService(service);
                              setIsEditServiceOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Service Dialog */}
        <Dialog open={isEditServiceOpen} onOpenChange={setIsEditServiceOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editServiceName">Service Name</Label>
                <Input
                  id="editServiceName"
                  value={editingService?.name || ''}
                  onChange={(e) => setEditingService(editingService ? { ...editingService, name: e.target.value } : null)}
                  placeholder="e.g., Drone Spraying Services"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editServiceDescription">Description</Label>
                <Textarea
                  id="editServiceDescription"
                  value={editingService?.description || ''}
                  onChange={(e) => setEditingService(editingService ? { ...editingService, description: e.target.value } : null)}
                  placeholder="Brief description of this service"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editServiceUnit">Unit</Label>
                <Select
                  value={editingService?.unit || 'unit'}
                  onValueChange={(value) => setEditingService(editingService ? { ...editingService, unit: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hectares">Hectares</SelectItem>
                    <SelectItem value="liters/ha">Liters per Hectare</SelectItem>
                    <SelectItem value="kg/ha">Kilograms per Hectare</SelectItem>
                    <SelectItem value="km">Kilometers</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="nights">Nights</SelectItem>
                    <SelectItem value="unit">Units</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditServiceOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditService} disabled={serviceLoading}>
                  {serviceLoading ? 'Updating...' : 'Update Service'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
