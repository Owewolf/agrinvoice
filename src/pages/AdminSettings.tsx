import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Settings, Package, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { productStorageService } from '@/lib/productStorage';
import { Settings as SettingsType, Product } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AdminSettingsProps {
  onNavigate: (page: string) => void;
}

export default function AdminSettings({ onNavigate }: AdminSettingsProps) {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);


  useEffect(() => {
    const loadData = async () => {
      try {
        const currentSettings = await storageService.getSettings();
        setSettings(currentSettings);
        
        const allProducts = await productStorageService.getProducts();
        setProducts(allProducts);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    setLoading(true);
    try {
      await storageService.saveSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (field: keyof SettingsType, value: string | number) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productStorageService.deleteProduct(productId);
        const updatedProducts = await productStorageService.getProducts();
        setProducts(updatedProducts);
        toast.success('Product deleted successfully!');
      } catch (error) {
        console.error('Failed to delete product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Admin Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Company Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Company Branding</span>
              </CardTitle>
              <CardDescription>
                Customize your company information and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings?.branding?.companyName || ''}
                      onChange={(e) => {
                        if (settings) {
                          setSettings({
                            ...settings,
                            branding: {
                              ...settings.branding,
                              companyName: e.target.value
                            }
                          });
                        }
                      }}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={settings?.branding?.website || ''}
                      onChange={(e) => {
                        if (settings) {
                          setSettings({
                            ...settings,
                            branding: {
                              ...settings.branding,
                              website: e.target.value
                            }
                          });
                        }
                      }}
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={settings?.currency} onValueChange={(value) => updateSettings('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                        <SelectItem value="USD">USD (US Dollar)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Contact Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings?.branding?.contactInfo?.email || ''}
                      onChange={(e) => {
                        if (settings) {
                          setSettings({
                            ...settings,
                            branding: {
                              ...settings.branding,
                              contactInfo: {
                                ...settings.branding.contactInfo,
                                email: e.target.value
                              }
                            }
                          });
                        }
                      }}
                      placeholder="contact@yourcompany.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={settings?.branding?.contactInfo?.phone || ''}
                      onChange={(e) => {
                        if (settings) {
                          setSettings({
                            ...settings,
                            branding: {
                              ...settings.branding,
                              contactInfo: {
                                ...settings.branding.contactInfo,
                                phone: e.target.value
                              }
                            }
                          });
                        }
                      }}
                      placeholder="+27 11 123 4567"
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="address">Company Address</Label>
                  <Input
                    id="address"
                    value={settings?.branding?.contactInfo?.address || ''}
                    onChange={(e) => {
                      if (settings) {
                        setSettings({
                          ...settings,
                          branding: {
                            ...settings.branding,
                            contactInfo: {
                              ...settings.branding.contactInfo,
                              address: e.target.value
                            }
                          }
                        });
                      }
                    }}
                    placeholder="123 Main Street, City, Province, Postal Code"
                  />
                </div>
              </div>

              <Separator />

              {/* Banking Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Banking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={settings?.payments?.bankName || ''}
                      onChange={(e) => {
                        if (settings) {
                          setSettings({
                            ...settings,
                            payments: {
                              ...settings.payments,
                              bankName: e.target.value
                            }
                          });
                        }
                      }}
                      placeholder="Standard Bank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchCode">Branch Code</Label>
                    <Input
                      id="branchCode"
                      value={settings?.payments?.branchCode || ''}
                      onChange={(e) => {
                        if (settings) {
                          setSettings({
                            ...settings,
                            payments: {
                              ...settings.payments,
                              branchCode: e.target.value
                            }
                          });
                        }
                      }}
                      placeholder="051001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={settings?.payments?.accountName || ''}
                      onChange={(e) => {
                        if (settings) {
                          setSettings({
                            ...settings,
                            payments: {
                              ...settings.payments,
                              accountName: e.target.value
                            }
                          });
                        }
                      }}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={settings?.payments?.accountNumber || ''}
                      onChange={(e) => {
                        if (settings) {
                          setSettings({
                            ...settings,
                            payments: {
                              ...settings.payments,
                              accountNumber: e.target.value
                            }
                          });
                        }
                      }}
                      placeholder="123456789"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manage Products Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Manage Products</span>
              </CardTitle>
              <CardDescription>
                Create, edit, and manage your service products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-gray-600">{products.length} products configured</p>
                </div>
                <Button onClick={() => onNavigate('products')} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Product</span>
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products configured</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first service product</p>
                  <Button onClick={() => onNavigate('products')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Product
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Product</th>
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-left py-3 px-4">Pricing</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.sku}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="capitalize">
                              {product.category}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="font-medium capitalize">{product.pricingType.replace('_', ' ')}</div>
                              {product.pricingType === 'tiered' && (
                                <div className="text-gray-500">
                                  {product.tiers?.length || 0} tiers
                                </div>
                              )}
                              {product.pricingType === 'flat' && (
                                <div className="text-gray-500">
                                  R{product.baseRate || 0} per {product.unit || 'unit'}
                                </div>
                              )}
                              {product.pricingType === 'per_km' && (
                                <div className="text-gray-500">
                                  R{product.baseRate || 0} per {product.unit || 'unit'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="default">
                              Active
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onNavigate('products')}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Categories Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>
                Available service categories and their descriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Spraying Services</h3>
                  <p className="text-sm text-gray-500">Liquid application services with drone technology</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Granular Services</h3>
                  <p className="text-sm text-gray-500">Granular product application services</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Travel Charges</h3>
                  <p className="text-sm text-gray-500">Transportation and travel-related costs</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium">Imaging Services</h3>
                  <p className="text-sm text-gray-500">Aerial photography and mapping services</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}