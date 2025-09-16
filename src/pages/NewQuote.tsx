import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Calculator, Save, Package, Minus, Plus } from 'lucide-react';
import { authService } from '@/lib/auth';
import { storageService } from '@/lib/storage';
import { productStorageService } from '@/lib/productStorage';
import { calculateProductCost } from '@/lib/products';
import { QuoteProduct } from '@/types';
import { Product, Quote, QuoteItem, Category, Service } from '@/types/api';
import { ClientDropdown } from '@/components/clients/ClientDropdown';
import { clientStorageService } from '@/lib/clientStorage';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface NewQuoteProps {
  onNavigate: (page: string, quoteId?: string) => void;
  quoteId?: string; // For editing existing quotes
}

interface ProductSelection {
  product: Product;
  selected: boolean;
  quantity: number;
  // For spraying/granular products
  speed?: number;
  flowRate?: number;
  sprayWidth?: number;
  calculation?: {
    appliedRate: number;
    subtotal: number;
    discountAmount: number;
    total: number;
    appRate?: number;
  };
}

export default function NewQuote({ onNavigate, quoteId }: NewQuoteProps) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [productSelections, setProductSelections] = useState<ProductSelection[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // Keep for backward compatibility
  const [quoteCalculation, setQuoteCalculation] = useState({
    subtotal: 0,
    totalDiscount: 0,
    totalCharge: 0
  });

  useEffect(() => {
    const calculateQuoteTotal = () => {
      let subtotal = 0;
      let totalDiscount = 0;

      productSelections.forEach(selection => {
        if (selection.selected && selection.calculation && selection.quantity > 0) {
          subtotal += selection.calculation.subtotal;
          totalDiscount += selection.calculation.discountAmount;
        }
      });

      const totalCharge = subtotal - totalDiscount;
      setQuoteCalculation({ subtotal, totalDiscount, totalCharge });
    };

    calculateQuoteTotal();
  }, [productSelections]);

  useEffect(() => {
    loadData();
    // Load current user
    const currentUser = authService.getCurrentUser();
  }, []);

  // Load existing quote for editing
  useEffect(() => {
    const loadQuoteForEditing = async () => {
      if (quoteId) {
        try {
          const quotes = await storageService.getQuotes();
          const existingQuote = quotes.find(q => q.id === quoteId);
          
          if (existingQuote) {
            console.log('📝 Loading quote for editing:', existingQuote);
            
            // Set client information
            setClientId(existingQuote.clientId);
            setClientName(existingQuote.clientName || '');
            
            // Load the quote items and update product selections
            if (existingQuote.items && existingQuote.items.length > 0) {
              setProductSelections(prev => 
                prev.map(sel => {
                  const quoteItem = existingQuote.items?.find(item => item.productId === sel.product.id);
                  if (quoteItem) {
                    return {
                      ...sel,
                      selected: true,
                      quantity: quoteItem.quantity,
                      speed: quoteItem.speed,
                      flowRate: quoteItem.flowRate,
                      sprayWidth: quoteItem.sprayWidth,
                      calculation: quoteItem.calculation ? {
                        appliedRate: quoteItem.calculation.rate,
                        subtotal: quoteItem.calculation.subtotal,
                        discountAmount: quoteItem.calculation.discount || 0,
                        total: quoteItem.calculation.finalTotal,
                        appRate: quoteItem.appRate
                      } : undefined
                    };
                  }
                  return sel;
                })
              );
            }
          }
        } catch (error) {
          console.error('Error loading quote for editing:', error);
        }
      }
    };

    if (productSelections.length > 0) {
      loadQuoteForEditing();
    }
  }, [quoteId, productSelections.length]);

  const loadData = async () => {
    try {
      // Load services and products in parallel
      const [servicesData, productsData] = await Promise.all([
        apiService.getServices(),
        apiService.getProducts() // Use API service instead of local storage
      ]);
      
      setServices(servicesData);
      setCategories(servicesData); // Set categories as services for backward compatibility
      console.log('📦 Loaded services:', servicesData.length);
      console.log('📦 Loaded products:', productsData.length);
      
      productsData.forEach(product => {
        console.log('Product:', {
          id: product.id,
          name: product.name,
          category: product.category,
          categoryId: product.categoryId,
          pricingType: product.pricingType,
          baseRate: product.baseRate,
          discountThreshold: product.discountThreshold,
          discountRate: product.discountRate,
          tiersCount: product.tiers?.length || 0
        });
      });
      
      const selections = productsData.map(product => ({
        product,
        selected: false,
        quantity: 0,
        speed: product.pricingType === 'tiered' && (product.category === 'spraying' || product.category === 'granular') ? 10 : undefined,
        flowRate: product.pricingType === 'tiered' && product.category === 'spraying' ? 15 : 
                 product.pricingType === 'tiered' && product.category === 'granular' ? 20 : undefined,
        sprayWidth: product.pricingType === 'tiered' && (product.category === 'spraying' || product.category === 'granular') ? 3 : undefined,
      }));
      setProductSelections(selections);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to local storage
      try {
        const products = await productStorageService.getActiveProducts();
        console.log('📦 Fallback: Loaded products from local storage:', products.length);
        const selections = products.map(product => ({
          product,
          selected: false,
          quantity: 0,
          speed: product.category === 'spraying' || product.category === 'granular' ? 10 : undefined,
          flowRate: product.category === 'spraying' ? 15 : product.category === 'granular' ? 20 : undefined,
          sprayWidth: product.category === 'spraying' || product.category === 'granular' ? 3 : undefined,
        }));
        setProductSelections(selections);
      } catch (fallbackError) {
        console.error('Error loading from fallback:', fallbackError);
        toast.error('Failed to load products. Please try again.');
      }
    }
  };

  const handleProductSelection = (productId: string, selected: boolean) => {
    console.log('🎯 Product selection changed:', productId, selected);
    setProductSelections(prev => 
      prev.map(sel => {
        if (sel.product.id === productId) {
          const updatedSelection = { 
            ...sel, 
            selected, 
            quantity: selected ? Math.max(sel.quantity || 0, 0) : 0  // Default to 0 when selected
          };
          
          console.log('📦 Product details:', {
            name: sel.product.name,
            category: sel.product.category,
            pricingType: sel.product.pricingType,
            baseRate: sel.product.baseRate,
            tiers: sel.product.tiers,
            quantity: updatedSelection.quantity,
            speed: sel.speed,
            flowRate: sel.flowRate,
            sprayWidth: sel.sprayWidth
          });
          
          // Calculate cost if product is selected and has quantity
          if (selected && updatedSelection.quantity > 0) {
            console.log('🔄 Triggering calculation...');
            const calculation = calculateProductCost(
              sel.product,
              updatedSelection.quantity,
              {
                speed: sel.speed,
                flowRate: sel.flowRate,
                sprayWidth: sel.sprayWidth
              }
            );
            updatedSelection.calculation = calculation;
            console.log('✅ Calculation result:', calculation);
          } else {
            updatedSelection.calculation = undefined;
          }
          
          return updatedSelection;
        }
        return sel;
      })
    );
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setProductSelections(prev => 
      prev.map(sel => {
        if (sel.product.id === productId) {
          const updatedSelection = { ...sel, quantity };
          
          // Calculate cost if product is selected and has quantity
          if (sel.selected && quantity > 0) {
            const calculation = calculateProductCost(
              sel.product,
              quantity,
              {
                speed: sel.speed,
                flowRate: sel.flowRate,
                sprayWidth: sel.sprayWidth
              }
            );
            updatedSelection.calculation = calculation;
          } else {
            updatedSelection.calculation = undefined;
          }
          
          return updatedSelection;
        }
        return sel;
      })
    );
  };

  const handleParameterChange = (productId: string, field: 'speed' | 'flowRate' | 'sprayWidth', value: number) => {
    setProductSelections(prev => 
      prev.map(sel => {
        if (sel.product.id === productId) {
          const updatedSelection = { ...sel, [field]: value };
          
          // Recalculate if product is selected
          if (sel.selected && sel.quantity > 0) {
            const calculation = calculateProductCost(
              sel.product,
              sel.quantity,
              {
                speed: updatedSelection.speed,
                flowRate: updatedSelection.flowRate,
                sprayWidth: updatedSelection.sprayWidth
              }
            );
            updatedSelection.calculation = calculation;
          }
          
          return updatedSelection;
        }
        return sel;
      })
    );
  };

  const handleSaveQuote = async () => {
    if (!clientId) {
      toast.error('Please select a client first');
      return;
    }

    const selectedProducts = productSelections.filter(sel => sel.selected && sel.quantity > 0);
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product with quantity greater than 0 to the quote');
      return;
    }

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        toast.error('User not authenticated');
        return;
      }

      const quoteData = {
        clientId: clientId,
        userId: currentUser.id,
        items: selectedProducts.map(selection => ({
          productId: selection.product.id,
          quantity: selection.quantity,
          speed: selection.speed,
          flowRate: selection.flowRate,
          sprayWidth: selection.sprayWidth,
          appRate: selection.calculation?.appRate,
          calculation: {
            rate: selection.calculation?.appliedRate || selection.product.baseRate,
            subtotal: selection.calculation?.subtotal || 0,
            discount: selection.calculation?.discountAmount || 0,
            finalTotal: selection.calculation?.total || 0
          }
        })),
        subtotal: quoteCalculation.subtotal,
        totalDiscount: quoteCalculation.totalDiscount,
        totalCharge: quoteCalculation.totalCharge,
        status: 'draft' as const
      };

      await apiService.createQuote(quoteData);
      
      toast.success('Quote created successfully!');
      
      // Clear form
      setClientId(null);
      setClientName('');
      setClientContact('');
      setProductSelections(prev => prev.map(sel => ({
        ...sel,
        selected: false,
        quantity: 0,
        calculation: undefined
      })));
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote. Please try again.');
    }
  };

  // Group products by their dynamic categories
  const productsByCategory = categories.reduce((acc, category) => {
    const categoryProducts = productSelections.filter(sel => {
      // Handle both old string categories and new UUID categories
      return sel.product.category === category.name || 
             sel.product.categoryId === category.id ||
             sel.product.category === category.id;
    });
    if (categoryProducts.length > 0) {
      acc[category.id] = {
        category: category,
        products: categoryProducts
      };
    }
    return acc;
  }, {} as Record<string, { category: Category; products: ProductSelection[] }>);

  const selectedProductsCount = productSelections.filter(sel => sel.selected && sel.quantity > 0).length;
  const hasCalculations = productSelections.some(sel => sel.selected && sel.calculation && sel.quantity > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{quoteId ? 'Edit Quote' : 'Create New Quote'}</h1>
              <p className="text-gray-600">Generate a new quote with real-time pricing</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Info & Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>Select a client for this quote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <ClientDropdown
                    value={clientId}
                    onChange={setClientId}
                    placeholder="Select a client..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Select Services</span>
                  {selectedProductsCount > 0 && (
                    <Badge variant="secondary">{selectedProductsCount} selected</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Choose the services you want to include in this quote
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-2">
                  {Object.entries(productsByCategory).map(([categoryKey, { category, products }]) => (
                    <AccordionItem key={categoryKey} value={categoryKey} className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{category.name}</Badge>
                          <span className="text-sm text-gray-500">
                            {products.filter(p => p.selected).length} of {products.length} selected
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 space-y-4">
                        {products.map((selection) => (
                          <div key={selection.product.id} className="space-y-3 p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={selection.product.id}
                                checked={selection.selected}
                                onCheckedChange={(checked) => 
                                  handleProductSelection(selection.product.id, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <Label htmlFor={selection.product.id} className="font-medium">
                                  {selection.product.name}
                                </Label>
                                {selection.product.description && (
                                  <p className="text-sm text-gray-500">{selection.product.description}</p>
                                )}
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {selection.product.sku}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {selection.product.pricingType}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {selection.selected && (
                              <div className="ml-6 space-y-3 border-t pt-3">
                                {/* Quantity Input */}
                                <div className="flex items-center space-x-3">
                                  <Label className="text-sm font-medium min-w-[80px]">
                                    {selection.product.category === 'travelling' ? 'Distance (km):' :
                                     selection.product.category === 'accommodation' ? 'Nights:' :
                                     selection.product.category === 'imaging' ? 'Area (ha):' :
                                     selection.product.serviceUnit === 'nights' ? 'Nights:' :
                                     selection.product.serviceUnit === 'km' ? 'Distance (km):' :
                                     selection.product.serviceUnit === 'hectares' ? 'Area (ha):' :
                                     'Area (ha):'}
                                  </Label>
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleQuantityChange(selection.product.id, Math.max(0, selection.quantity - (selection.product.category === 'travelling' ? 0.1 : selection.product.category === 'accommodation' ? 1 : 1)))}
                                      disabled={selection.quantity <= 0}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      type="number"
                                      step={selection.product.category === 'travelling' ? '0.1' : selection.product.category === 'accommodation' ? '1' : '0.1'}
                                      min="0"
                                      value={selection.quantity}
                                      onChange={(e) => handleQuantityChange(selection.product.id, parseFloat(e.target.value) || 0)}
                                      className="w-20 text-center"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleQuantityChange(selection.product.id, selection.quantity + (selection.product.category === 'travelling' ? 0.1 : selection.product.category === 'accommodation' ? 1 : 1))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Additional Parameters for Tiered Spraying/Granular */}
                                {selection.product.pricingType === 'tiered' && (selection.product.category === 'spraying' || selection.product.category === 'granular') && (
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Speed (m/s)</Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={selection.speed || ''}
                                        onChange={(e) => handleParameterChange(selection.product.id, 'speed', parseFloat(e.target.value) || 0)}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">
                                        Flow Rate ({selection.product.category === 'granular' ? 'kg/min' : 'L/min'})
                                      </Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={selection.flowRate || ''}
                                        onChange={(e) => handleParameterChange(selection.product.id, 'flowRate', parseFloat(e.target.value) || 0)}
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Spray Width (m)</Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={selection.sprayWidth || ''}
                                        onChange={(e) => handleParameterChange(selection.product.id, 'sprayWidth', parseFloat(e.target.value) || 0)}
                                        className="text-sm"
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Calculation Display */}
                                {selection.calculation && (
                                  <div className="bg-gray-50 p-3 rounded text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>Applied Rate: R{selection.calculation.appliedRate}{
                                        selection.product.category === 'travelling' ? '/km' :
                                        selection.product.category === 'accommodation' ? '/night' :
                                        selection.product.category === 'imaging' ? '/ha' :
                                        selection.product.serviceUnit === 'nights' ? '/night' :
                                        selection.product.serviceUnit === 'km' ? '/km' :
                                        selection.product.serviceUnit === 'hectares' ? '/ha' :
                                        '/ha'
                                      }</div>
                                      <div>Subtotal: R{selection.calculation.subtotal}</div>
                                      {selection.calculation.discountAmount > 0 && (
                                        <>
                                          <div className="text-green-600">Discount: -R{selection.calculation.discountAmount}</div>
                                          <div className="font-medium">Total: R{selection.calculation.total}</div>
                                        </>
                                      )}
                                      {selection.calculation.appRate && (
                                        <div className="col-span-2">
                                          Application Rate: {selection.calculation.appRate} {
                                            selection.product.category === 'spraying' ? 'L/ha' :
                                            selection.product.category === 'granular' ? 'kg/ha' :
                                            selection.product.category === 'travelling' ? 'km' :
                                            selection.product.category === 'accommodation' ? 'nights' :
                                            selection.product.category === 'imaging' ? 'hectares' :
                                            'units'
                                          }
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Quote Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
                <CardDescription>
                  Real-time calculation based on selected services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasCalculations ? (
                  <>
                    <div className="space-y-3">
                      {productSelections
                        .filter(sel => sel.selected && sel.calculation)
                        .map((selection) => (
                          <div key={selection.product.id} className="flex justify-between text-sm">
                            <span className="truncate mr-2">
                              {selection.product.name} ({selection.quantity} {
                                selection.product.category === 'travelling' ? 'km' :
                                selection.product.category === 'accommodation' ? 'nights' :
                                selection.product.category === 'imaging' ? 'ha' :
                                selection.product.serviceUnit === 'nights' ? 'nights' :
                                selection.product.serviceUnit === 'km' ? 'km' :
                                selection.product.serviceUnit === 'hectares' ? 'ha' :
                                'ha'
                              })
                            </span>
                            <span>R{selection.calculation!.total}</span>
                          </div>
                        ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>R{quoteCalculation.subtotal.toFixed(2)}</span>
                      </div>
                      
                      {quoteCalculation.totalDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Total Discounts</span>
                          <span>-R{quoteCalculation.totalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total Charge</span>
                        <span>R{quoteCalculation.totalCharge.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveQuote}
                      disabled={!clientId}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {quoteId ? 'Update Quote' : 'Save & Preview Quote'}
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select services to see pricing calculation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
