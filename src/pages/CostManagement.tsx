import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Edit, Trash2, Plus, DollarSign, Package, Settings, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { ProductCost, OverheadCost, Service, Product } from '@/types/api';
import { apiService } from '@/lib/api';

interface CostManagementProps {
  onNavigate: (page: string) => void;
}

export default function CostManagement({ onNavigate }: CostManagementProps) {
  const [productCosts, setProductCosts] = useState<ProductCost[]>([]);
  const [overheadCosts, setOverheadCosts] = useState<OverheadCost[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newProductCost, setNewProductCost] = useState({
    product_id: '',
    cost_name: '',
    cost_per_unit: '',
    unit: '',
    description: '',
    is_active: true
  });

  const [newOverheadCost, setNewOverheadCost] = useState({
    cost_name: '',
    cost_type: 'fixed_amount' as 'fixed_amount' | 'percentage',
    cost_value: '',
    applies_to: 'all' as 'all' | 'revenue' | 'direct_costs',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading cost management data...');
      const [servicesData, productsData, productCostsData, overheadCostsData] = await Promise.all([
        apiService.getServices(),
        apiService.getProducts(),
        apiService.getProductCosts(),
        apiService.getOverheadCosts()
      ]);

      console.log('✅ Services loaded:', servicesData);
      console.log('✅ Products loaded:', productsData);
      console.log('✅ Product costs loaded:', productCostsData);
      console.log('✅ Overhead costs loaded:', overheadCostsData);

      setServices(servicesData);
      setProducts(productsData);
      setProductCosts(productCostsData);
      setOverheadCosts(overheadCostsData);
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      toast.error('Failed to load cost data');
    } finally {
      setLoading(false);
    }
  };

  // Product Cost Functions
  const saveProductCost = async () => {
    try {
      const costData = {
        product_id: newProductCost.product_id,
        cost_name: newProductCost.cost_name,
        cost_per_unit: parseFloat(newProductCost.cost_per_unit),
        unit: newProductCost.unit,
        description: newProductCost.description,
        is_active: newProductCost.is_active
      };

      await apiService.createProductCost(costData);
      toast.success('Product cost added successfully');
      
      // Reset form
      setNewProductCost({
        product_id: '',
        cost_name: '',
        cost_per_unit: '',
        unit: '',
        description: '',
        is_active: true
      });
      
      loadData();
    } catch (error) {
      console.error('Failed to save product cost:', error);
      toast.error('Failed to save product cost');
    }
  };

  const deleteProductCost = async (id: string) => {
    try {
      await apiService.deleteProductCost(id);
      toast.success('Product cost deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete product cost:', error);
      toast.error('Failed to delete product cost');
    }
  };

  // Overhead Cost Functions
  const saveOverheadCost = async () => {
    try {
      const costData = {
        cost_name: newOverheadCost.cost_name,
        cost_type: newOverheadCost.cost_type,
        cost_value: parseFloat(newOverheadCost.cost_value),
        applies_to: newOverheadCost.applies_to,
        description: newOverheadCost.description,
        is_active: newOverheadCost.is_active
      };

      await apiService.createOverheadCost(costData);
      toast.success('Overhead cost added successfully');
      
      // Reset form
      setNewOverheadCost({
        cost_name: '',
        cost_type: 'fixed_amount',
        cost_value: '',
        applies_to: 'all',
        description: '',
        is_active: true
      });
      
      loadData();
    } catch (error) {
      console.error('Failed to save overhead cost:', error);
      toast.error('Failed to save overhead cost');
    }
  };

  const deleteOverheadCost = async (id: string) => {
    try {
      await apiService.deleteOverheadCost(id);
      toast.success('Overhead cost deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete overhead cost:', error);
      toast.error('Failed to delete overhead cost');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading cost data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cost Management</h1>
              <p className="text-gray-600">Manage product costs and overhead expenses. Costs can also be defined when creating products.</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Product Costs</span>
            </TabsTrigger>
            <TabsTrigger value="overhead" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Overhead Costs</span>
            </TabsTrigger>
          </TabsList>

          {/* Product Costs Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add Product Cost</span>
                </CardTitle>
                <CardDescription>
                  Define costs for products that don't have cost information yet. Most costs should be defined when creating products.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product">Product</Label>
                    <Select 
                      value={newProductCost.product_id} 
                      onValueChange={(value) => {
                        const selectedProduct = products.find(p => p.id === value);
                        setNewProductCost({
                          ...newProductCost, 
                          product_id: value,
                          unit: selectedProduct?.unit || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => {
                          const service = services.find(s => s.id === product.serviceId);
                          return (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku}) - {service?.name || 'Unknown Service'} - {product.unit}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost-name">Cost Name</Label>
                    <Input
                      id="cost-name"
                      value={newProductCost.cost_name}
                      onChange={(e) => setNewProductCost({...newProductCost, cost_name: e.target.value})}
                      placeholder="e.g., Diesel fuel, Herbicide, Equipment rental"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost-per-unit">Cost per Unit (R)</Label>
                    <Input
                      id="cost-per-unit"
                      type="number"
                      step="0.01"
                      value={newProductCost.cost_per_unit}
                      onChange={(e) => setNewProductCost({...newProductCost, cost_per_unit: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit (auto-populated)</Label>
                    <Input
                      id="unit"
                      value={newProductCost.unit}
                      onChange={(e) => setNewProductCost({...newProductCost, unit: e.target.value})}
                      placeholder="e.g., liter, kg, hour"
                      className={newProductCost.product_id ? 'bg-gray-50' : ''}
                    />
                    {newProductCost.product_id && (
                      <p className="text-xs text-gray-500">Unit auto-filled from selected product. You can still edit if needed.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={newProductCost.description}
                      onChange={(e) => setNewProductCost({...newProductCost, description: e.target.value})}
                      placeholder="Additional details"
                    />
                  </div>
                </div>

                <Button onClick={saveProductCost} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Add Product Cost
                </Button>
              </CardContent>
            </Card>

            {/* Product Costs List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Product Costs</CardTitle>
                <CardDescription>
                  {productCosts.length} product costs configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productCosts.map(cost => {
                    const product = products.find(p => p.id === cost.product_id);
                    const service = services.find(s => s.id === product?.serviceId);
                    return (
                      <div key={cost.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h4 className="font-medium">{cost.cost_name}</h4>
                              <p className="text-sm text-gray-600">
                                Product: {product?.name || 'Unknown'} ({product?.sku || 'No SKU'})
                              </p>
                              <p className="text-xs text-gray-500">
                                Service: {service?.name || 'Unknown'} - {product?.unit || cost.unit}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="font-medium">R{(typeof cost.cost_per_unit === 'string' ? parseFloat(cost.cost_per_unit) : cost.cost_per_unit).toFixed(2)} / {cost.unit}</p>
                            {cost.description && <p className="text-sm text-gray-600">{cost.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => deleteProductCost(cost.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {productCosts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No product costs configured yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products Without Costs Warning */}
            {(() => {
              const productsWithoutCosts = products.filter(product => 
                !productCosts.some(cost => cost.product_id === product.id)
              );
              
              if (productsWithoutCosts.length > 0) {
                return (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-orange-800">
                        <Calculator className="h-5 w-5" />
                        <span>Products Missing Cost Information</span>
                      </CardTitle>
                      <CardDescription className="text-orange-700">
                        These products don't have cost information configured. Add costs to enable profit tracking.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {productsWithoutCosts.map(product => {
                          const service = services.find(s => s.id === product.serviceId);
                          return (
                            <div key={product.id} className="flex items-center justify-between p-3 bg-white rounded border border-orange-200">
                              <div>
                                <h5 className="font-medium text-gray-900">{product.name}</h5>
                                <p className="text-sm text-gray-600">
                                  SKU: {product.sku} | Service: {service?.name || 'Unknown'} | Unit: {product.unit}
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setNewProductCost({
                                    ...newProductCost,
                                    product_id: product.id,
                                    unit: product.unit
                                  });
                                  // Focus on the cost name field
                                  document.querySelector('#cost-name')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                              >
                                Add Cost
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
              return null;
            })()}
          </TabsContent>

          {/* Overhead Costs Tab */}
          <TabsContent value="overhead" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add Overhead Cost</span>
                </CardTitle>
                <CardDescription>
                  Define general business overhead expenses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost-name">Cost Name</Label>
                    <Input
                      id="cost-name"
                      value={newOverheadCost.cost_name}
                      onChange={(e) => setNewOverheadCost({...newOverheadCost, cost_name: e.target.value})}
                      placeholder="e.g., Office rent, Insurance"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost-type">Cost Type</Label>
                    <Select 
                      value={newOverheadCost.cost_type} 
                      onValueChange={(value: 'fixed_amount' | 'percentage') => 
                        setNewOverheadCost({...newOverheadCost, cost_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cost type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost-value">
                      {newOverheadCost.cost_type === 'percentage' ? 'Percentage (%)' : 'Amount (R)'}
                    </Label>
                    <Input
                      id="cost-value"
                      type="number"
                      step={newOverheadCost.cost_type === 'percentage' ? '0.01' : '0.01'}
                      value={newOverheadCost.cost_value}
                      onChange={(e) => setNewOverheadCost({...newOverheadCost, cost_value: e.target.value})}
                      placeholder={newOverheadCost.cost_type === 'percentage' ? '15.0' : '0.00'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="applies-to">Applies To</Label>
                    <Select 
                      value={newOverheadCost.applies_to} 
                      onValueChange={(value: 'all' | 'revenue' | 'direct_costs') => 
                        setNewOverheadCost({...newOverheadCost, applies_to: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select what it applies to" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All transactions</SelectItem>
                        <SelectItem value="revenue">Revenue only</SelectItem>
                        <SelectItem value="direct_costs">Direct costs only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={newOverheadCost.description}
                      onChange={(e) => setNewOverheadCost({...newOverheadCost, description: e.target.value})}
                      placeholder="Additional details"
                    />
                  </div>
                </div>

                <Button onClick={saveOverheadCost} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Add Overhead Cost
                </Button>
              </CardContent>
            </Card>

            {/* Overhead Costs List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Overhead Costs</CardTitle>
                <CardDescription>
                  {overheadCosts.length} overhead costs configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overheadCosts.map(cost => (
                    <div key={cost.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium">{cost.cost_name}</h4>
                            <p className="text-sm text-gray-600">
                              Applies to: {cost.applies_to ? cost.applies_to.replace('_', ' ') : 'all'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              cost.cost_type === 'fixed_amount' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {cost.cost_type === 'fixed_amount' ? 'Fixed Amount' : 'Percentage'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          {cost.cost_type === 'percentage' ? (
                            <p className="font-medium">{(typeof cost.cost_value === 'string' ? parseFloat(cost.cost_value) : cost.cost_value).toFixed(2)}%</p>
                          ) : (
                            <p className="font-medium">R{(typeof cost.cost_value === 'string' ? parseFloat(cost.cost_value) : cost.cost_value).toFixed(2)}</p>
                          )}
                          {cost.description && <p className="text-sm text-gray-600">{cost.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => deleteOverheadCost(cost.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {overheadCosts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No overhead costs configured yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
