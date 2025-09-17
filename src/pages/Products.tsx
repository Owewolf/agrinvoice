import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, Settings, X } from 'lucide-react';
import { Product, ProductTier, ProductCategory, PricingType, Category } from '@/types/api';
import { productStorageService } from '@/lib/productStorage';
import { authService } from '@/lib/auth';
import { PRODUCT_CATEGORIES, PRICING_TYPES, getUnitForCategory, createDefaultProduct, getProductCategories } from '@/lib/products';
import { apiService } from '@/lib/api';

interface ProductsProps {
  onNavigate: (page: string) => void;
}

export default function Products({ onNavigate }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('all');

  useEffect(() => {
    loadProducts();
    loadCategories();
    // Load current user
    const currentUser = authService.getCurrentUser();
  }, []);

  const loadCategories = async () => {
    try {
      const loadedCategories = await getProductCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const loadedProducts = await productStorageService.getProducts();
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      await productStorageService.saveProduct(product);
      await loadProducts();
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Failed to save product:', error);
      if (error instanceof Error && error.message.includes('404')) {
        alert('Authentication error: Please refresh the page and login again.');
      } else {
        alert('Failed to save product. Please try again.');
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productStorageService.deleteProduct(productId);
        await loadProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const filteredProducts = selectedService === 'all' 
    ? products 
    : selectedService === 'uncategorized'
    ? products.filter(p => !p.category) // Show products without categories
    : products.filter(p => {
        // Handle both old string-based services and new service IDs
        if (typeof p.category === 'string') {
          // For old string categories, match against category name
          const selectedCat = categories.find(c => c.id === selectedService);
          return selectedCat && p.category === selectedCat.name.toLowerCase();
        } else {
          // For new category IDs, direct match
          return p.category === selectedService;
        }
      });

  const productsByCategory = categories.reduce((acc, category) => {
    acc[category.name] = products.filter(p => {
      // Handle both old string-based categories and new category IDs
      return typeof p.category === 'string' 
        ? p.category === category.name.toLowerCase()
        : p.category === category.id;
    });
    return acc;
  }, {} as Record<string, Product[]>);

  // Add uncategorized products
  const uncategorizedProducts = products.filter(p => !p.category);
  if (uncategorizedProducts.length > 0) {
    productsByCategory['Uncategorized'] = uncategorizedProducts;
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
              <h1 className="text-xl font-bold text-gray-900">Products Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedService} onValueChange={(value) => setSelectedService(value)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name} ({productsByCategory[category.name]?.length || 0})
              </TabsTrigger>
            ))}
            {uncategorizedProducts.length > 0 && (
              <TabsTrigger value="uncategorized">
                Uncategorized ({uncategorizedProducts.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={selectedService}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedService === 'all' 
                    ? 'All Products' 
                    : selectedService === 'uncategorized'
                    ? 'Uncategorized Products'
                    : categories.find(c => c.id === selectedService)?.name || 'Products'
                  }
                </CardTitle>
                <CardDescription>
                  Manage your service products, pricing, and discount rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 mb-4">No products found</p>
                    <Button onClick={handleAddProduct}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {(() => {
                                // Handle both old string-based categories and new category IDs
                                if (typeof product.category === 'string') {
                                  // Try to find by name first
                                  const categoryByName = categories.find(c => c.name.toLowerCase() === product.category);
                                  if (categoryByName) return categoryByName.name;
                                  
                                  // Fallback to old hardcoded categories
                                  const oldCategory = PRODUCT_CATEGORIES.find(c => c.value === product.category);
                                  return oldCategory?.label || product.category;
                                }
                                
                                // Find by ID for new category system
                                const categoryById = categories.find(c => c.id === product.category);
                                return categoryById?.name || 'Unknown';
                              })()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium capitalize">{product.pricingType}</div>
                              {product.pricingType === 'flat' || product.pricingType === 'per_km' ? (
                                <div className="text-gray-500">R{product.baseRate} per {product.unit}</div>
                              ) : (
                                <div className="text-gray-500">{product.tiers?.length || 0} tiers</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{(product.discountRate || 0) * 100}% after {product.discountThreshold || 0}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                <Trash2 className="h-3 w-3" />
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
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Form Dialog */}
      <ProductFormDialog
        product={editingProduct}
        categories={categories}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />
    </div>
  );
}

interface ProductFormDialogProps {
  product: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
}

function ProductFormDialog({ product, categories, isOpen, onClose, onSave }: ProductFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [tiers, setTiers] = useState<ProductTier[]>([]);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  
  // Multiple costs support
  const [costs, setCosts] = useState<Array<{
    id?: string;
    cost_name: string;
    cost_per_unit: string;
    description: string;
  }>>([]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setTiers(product.tiers || []);
      
      // Load existing cost data for this product
      const loadCostData = async () => {
        try {
          const productCosts = await apiService.getProductCosts();
          const existingCosts = productCosts.filter(cost => cost.product_id === product.id);
          if (existingCosts.length > 0) {
            setCosts(existingCosts.map(cost => ({
              id: cost.id,
              cost_name: cost.cost_name,
              cost_per_unit: cost.cost_per_unit.toString(),
              description: cost.description || ''
            })));
          } else {
            // Start with one empty cost for existing products
            setCosts([{ cost_name: '', cost_per_unit: '', description: '' }]);
          }
        } catch (error) {
          console.error('Failed to load cost data:', error);
          setCosts([{ cost_name: '', cost_per_unit: '', description: '' }]);
        }
      };
      
      if (product.id) {
        loadCostData();
      }
    } else {
      const defaultData = {
        name: '',
        description: '',
        category: undefined, // No default category - make it truly optional
        pricingType: 'tiered' as PricingType,
        baseRate: 200,
        sku: '',
        discountThreshold: 100,
        discountRate: 0.15,
        unit: 'unit' // Default generic unit
      };
      setFormData(defaultData);
      setTiers([]); // Start with empty tiers for new products
      
      // Initialize with one empty cost for new products
      setCosts([{ cost_name: '', cost_per_unit: '', description: '' }]);
    }
  }, [product, isOpen]);

  const handleSave = async () => {
    if (!formData.name || !formData.pricingType) {
      alert('Please fill in all required fields');
      return;
    }

    const productToSave: Product = {
      id: product?.id || '', // Don't generate ID for new products, let backend handle it
      name: formData.name!,
      description: formData.description || '',
      category: formData.category || undefined, // Allow undefined/no category
      pricingType: formData.pricingType!,
      baseRate: formData.baseRate || 0,
      discountThreshold: formData.discountThreshold,
      discountRate: formData.discountRate,
      sku: '', // Let backend generate the SKU
      unit: formData.unit || (() => {
        // Find the selected category and use its unit, or default to 'unit'
        const selectedCategory = localCategories.find(c => c.id === formData.category);
        return selectedCategory?.unit || 'unit';
      })(),
      tiers: formData.pricingType === 'tiered' ? tiers.map(tier => ({
        threshold: tier.threshold,
        rate: tier.rate
      })) : undefined,
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('🎯 Product data prepared for saving:', productToSave);

    try {
      // Save the product first and get the saved product with ID
      await onSave(productToSave);
      
      // Save multiple costs if provided and we have the product info
      const validCosts = costs.filter(cost => cost.cost_name && cost.cost_per_unit);
      if (validCosts.length > 0) {
        try {
          // Get the latest products to find our saved product
          const savedProducts = await productStorageService.getProducts();
          const savedProduct = product?.id 
            ? savedProducts.find(p => p.id === product.id)  // Editing existing product
            : savedProducts.find(p => 
                p.name === productToSave.name && 
                p.category === productToSave.category
              ); // Find newly created product
          
          if (savedProduct) {
            // Get existing costs to determine what to update vs create
            const existingCosts = await apiService.getProductCosts();
            const productExistingCosts = existingCosts.filter(cost => cost.product_id === savedProduct.id);
            
            // Save each valid cost
            for (const cost of validCosts) {
              const costToSave = {
                product_id: savedProduct.id,
                cost_name: cost.cost_name,
                cost_per_unit: parseFloat(cost.cost_per_unit),
                unit: savedProduct.unit,
                description: cost.description,
                is_active: true
              };
              
              if (cost.id) {
                // Update existing cost
                await apiService.updateProductCost(cost.id, costToSave);
                console.log('✅ Cost data updated successfully');
              } else {
                // Create new cost
                await apiService.createProductCost(costToSave);
                console.log('✅ Cost data created successfully');
              }
            }
            
            // Delete costs that were removed (existed before but not in current costs array)
            const costIdsToKeep = validCosts.filter(c => c.id).map(c => c.id);
            const costsToDelete = productExistingCosts.filter(existing => 
              !costIdsToKeep.includes(existing.id)
            );
            
            for (const costToDelete of costsToDelete) {
              try {
                await apiService.deleteProductCost(costToDelete.id);
                console.log('✅ Removed unused cost');
              } catch (error) {
                console.error('Failed to delete cost:', error);
              }
            }
          } else {
            console.warn('Could not find saved product to attach cost data');
          }
        } catch (error) {
          console.error('Failed to save cost data:', error);
          alert('Product saved successfully, but failed to save cost data. You can add costs later in Cost Management.');
        }
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      throw error; // Re-throw to let the parent handle it
    }
  };

  const handleAddCost = () => {
    setCosts([...costs, { cost_name: '', cost_per_unit: '', description: '' }]);
  };

  const handleUpdateCost = (index: number, field: string, value: string) => {
    const updatedCosts = [...costs];
    updatedCosts[index] = { ...updatedCosts[index], [field]: value };
    setCosts(updatedCosts);
  };

  const handleRemoveCost = (index: number) => {
    setCosts(costs.filter((_, i) => i !== index));
  };

  const handleAddTier = () => {
    setTiers([...tiers, { productId: '', threshold: 0, rate: 0 }]);
  };

  const handleUpdateTier = (index: number, field: keyof ProductTier, value: string | number) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setTiers(updatedTiers);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            Configure product details, pricing, and discount rules
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Drone Spraying"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the product"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Auto-generated (e.g., SP-T-200)"
              />
              <p className="text-xs text-gray-500">
                Format: Category-PricingType-BaseRate (e.g., SP-T-200 = Spraying-Tiered-200)
              </p>
            </div>
          </div>

          {/* Service and Pricing Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Service</Label>
              <Select
                value={formData.category || "none"}
                onValueChange={(value: string) => {
                  if (value === "none") {
                    // No category selected
                    setFormData({
                      ...formData,
                      category: undefined,
                      unit: 'unit' // Default unit when no category
                    });
                    setTiers([]); // Clear any auto-generated tiers
                  } else {
                    const selectedCategory = localCategories.find(c => c.id === value);
                    const unit = selectedCategory?.unit || 'unit';
                    
                    setFormData({
                      ...formData,
                      category: value,
                      pricingType: selectedCategory?.name.toLowerCase().includes('travel') ? 'per_km' : 'tiered',
                      baseRate: selectedCategory?.name.toLowerCase().includes('spray') ? 200 : 
                                selectedCategory?.name.toLowerCase().includes('granular') ? 250 : 15,
                      unit
                    });
                    
                    // Set default tiers for spraying/granular categories
                    if (tiers.length === 0 && 
                        (selectedCategory?.name.toLowerCase().includes('spray') || 
                         selectedCategory?.name.toLowerCase().includes('granular'))) {
                      setTiers([
                        { productId: '', threshold: 40, rate: 200 },
                        { productId: '', threshold: 80, rate: 300 },
                        { productId: '', threshold: 160, rate: 400 }
                      ]);
                    } else if (selectedCategory?.name.toLowerCase().includes('travel') || 
                             selectedCategory?.name.toLowerCase().includes('imaging') || 
                             selectedCategory?.name.toLowerCase().includes('accommodation')) {
                      setTiers([]);
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (No Service Category)</SelectItem>
                  {localCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricingType">Pricing Type *</Label>
              <Select
                value={formData.pricingType}
                onValueChange={(value: PricingType) => {
                  setFormData({ ...formData, pricingType: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing type" />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Base Rate (for flat/per_km pricing) */}
          {(formData.pricingType === 'flat' || formData.pricingType === 'per_km') && (
            <div className="space-y-2">
              <Label htmlFor="baseRate">Base Rate *</Label>
              <Input
                id="baseRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.baseRate || ''}
                onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 50.00"
              />
            </div>
          )}

          {/* Tiered Pricing */}
          {formData.pricingType === 'tiered' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing Tiers</CardTitle>
                <CardDescription>
                  Define thresholds and rates for tiered pricing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded">
                    <div className="flex-1">
                      <Label className="text-xs">Threshold</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={tier.threshold}
                        onChange={(e) => handleUpdateTier(index, 'threshold', parseFloat(e.target.value) || 0)}
                        placeholder="40"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.rate}
                        onChange={(e) => handleUpdateTier(index, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="200"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTier(index)}
                      className="mt-4"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={handleAddTier} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Discount Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Discount Settings</CardTitle>
              <CardDescription>
                Configure volume discounts for this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountThreshold">Discount Threshold</Label>
                  <Input
                    id="discountThreshold"
                    type="number"
                    min="0"
                    value={formData.discountThreshold || ''}
                    onChange={(e) => setFormData({ ...formData, discountThreshold: parseFloat(e.target.value) || 0 })}
                    placeholder="100"
                  />
                  <p className="text-xs text-gray-500">Quantity above which discount applies</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountRate">Discount Rate (%)</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(formData.discountRate || 0) * 100}
                    onChange={(e) => setFormData({ ...formData, discountRate: (parseFloat(e.target.value) || 0) / 100 })}
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500">Percentage discount for excess quantity</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multiple Costs Section */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-base text-blue-800">Product Costs</CardTitle>
              <CardDescription className="text-blue-700">
                Define all costs associated with delivering this product/service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {costs.map((cost, index) => (
                <div key={index} className="border border-blue-200 rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-blue-900">Cost {index + 1}</h4>
                    {costs.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCost(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-2">
                      <Label htmlFor={`cost-name-${index}`}>Cost Name</Label>
                      <Input
                        id={`cost-name-${index}`}
                        value={cost.cost_name}
                        onChange={(e) => handleUpdateCost(index, 'cost_name', e.target.value)}
                        placeholder="e.g., Diesel fuel, Equipment rental"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cost-per-unit-${index}`}>Cost per Unit (R)</Label>
                      <Input
                        id={`cost-per-unit-${index}`}
                        type="number"
                        step="0.01"
                        value={cost.cost_per_unit}
                        onChange={(e) => handleUpdateCost(index, 'cost_per_unit', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`cost-description-${index}`}>Cost Description (Optional)</Label>
                    <Input
                      id={`cost-description-${index}`}
                      value={cost.description}
                      onChange={(e) => handleUpdateCost(index, 'description', e.target.value)}
                      placeholder="Additional details about this cost"
                    />
                  </div>
                </div>
              ))}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddCost}
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Cost
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}