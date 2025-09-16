import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Settings, Package, FileText, Users, CreditCard, History } from 'lucide-react';
import { storageService } from '@/lib/storage';
import { Settings as SettingsType } from '@/types/api';
import { toast } from 'sonner';

interface AdminSettingsProps {
  onNavigate: (page: string) => void;
}

export default function AdminSettings({ onNavigate }: AdminSettingsProps) {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentSettings = await storageService.getSettings();
        setSettings(currentSettings);
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
                        <SelectItem value="R">R (South African Rand)</SelectItem>
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

              {/* Save Button */}
              <div className="flex justify-end pt-6">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Document Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Document Management</span>
              </CardTitle>
              <CardDescription>
                Access and manage your quotes and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate('quote-history')}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <History className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Quote History</h3>
                      <p className="text-sm text-gray-500">View and manage all quotes</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate('invoice-history')}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Invoice History</h3>
                      <p className="text-sm text-gray-500">View and manage all invoices</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate('products')}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Package className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Product Management</h3>
                      <p className="text-sm text-gray-500">Create and manage service products</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate('service-management')}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Settings className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Service Management</h3>
                      <p className="text-sm text-gray-500">Create and manage service categories</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Client Management</span>
              </CardTitle>
              <CardDescription>
                Manage your clients and track payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate('clients')}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">View Clients</h3>
                      <p className="text-sm text-gray-500">Manage client information and details</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onNavigate('outstanding-payments')}>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Outstanding Payments</h3>
                      <p className="text-sm text-gray-500">Track and manage pending payments</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}