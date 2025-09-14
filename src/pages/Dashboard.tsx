import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  Users,
  Activity
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { dashboardAnalytics, type DashboardStats } from '@/lib/dashboardAnalytics';
import { MiniBarChart, MiniLineChart, TrendIndicator } from '@/components/ui/mini-chart';

interface DashboardProps {
  onNavigate: (page: string, params?: { quoteId?: string; invoiceId?: string }) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await dashboardAnalytics.getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: 'good' | 'warning' | 'danger'): string => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'danger': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getOutstandingStatus = (amount: number): 'good' | 'warning' | 'danger' => {
    if (amount === 0) return 'good';
    if (amount < 50000) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  const conversionTrends = dashboardAnalytics.getConversionTrends(6);
  const chartData = stats.monthlyTrends.map(trend => ({
    label: trend.month,
    value: trend.quotes,
    secondaryValue: trend.invoices
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your business overview.</p>
            </div>
          </div>
        </div>
        {/* Top KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Quotes */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.totalQuotes}</span>
                    <Badge variant="secondary" className="text-xs">
                      +{stats.recentActivity.quotesThisMonth} this month
                    </Badge>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Hectares */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Hectares</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.totalHectares.toFixed(1)}</span>
                    <Badge variant="secondary" className="text-xs">hectares</Badge>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Payments */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding Payments</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(stats.outstandingPayments)}</span>
                    {stats.overdueCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {stats.overdueCount} overdue
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  getOutstandingStatus(stats.outstandingPayments) === 'danger' ? 'bg-red-100' :
                  getOutstandingStatus(stats.outstandingPayments) === 'warning' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  <AlertCircle className={`h-6 w-6 ${
                    getOutstandingStatus(stats.outstandingPayments) === 'danger' ? 'text-red-600' :
                    getOutstandingStatus(stats.outstandingPayments) === 'warning' ? 'text-orange-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote Status Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <span>Quote Status Overview</span>
            </CardTitle>
            <CardDescription>
              Current status distribution of all quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{stats.quoteStatusBreakdown.draft}</div>
                <div className="text-sm text-gray-600">Draft</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.quoteStatusBreakdown.sent}</div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.quoteStatusBreakdown.accepted}</div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.quoteStatusBreakdown.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Analysis Block */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Quote → Invoice Conversion Analysis</span>
            </CardTitle>
            <CardDescription>
              Track your sales conversion performance and revenue trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Conversion Metrics */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.conversionRate}%</div>
                    <div className="text-sm text-gray-600">Conversion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.totalInvoices}</div>
                    <div className="text-sm text-gray-600">Total Invoices</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quote Revenue:</span>
                    <span className="font-semibold">{formatCurrency(stats.quoteRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Invoice Revenue:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(stats.invoiceRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Quote Value:</span>
                    <span className="font-semibold">{formatCurrency(stats.avgQuoteValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Invoice Value:</span>
                    <span className="font-semibold">{formatCurrency(stats.avgInvoiceValue)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Trend Chart */}
              <div>
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">6-Month Trend</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-gray-600">Quotes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-gray-600">Invoices</span>
                    </div>
                  </div>
                </div>
                <MiniBarChart 
                  data={chartData} 
                  height={150} 
                  primaryColor="#3b82f6" 
                  secondaryColor="#10b981" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Customers Analytics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <span>Top Customers</span>
            </CardTitle>
            <CardDescription>
              Your highest value customers by revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topCustomers.length > 0 ? (
                stats.topCustomers.map((customer, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{formatCurrency(customer.revenue)}</div>
                      <div className="text-sm text-gray-500">{customer.quoteCount} quotes</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>No customer data yet</p>
                  <p className="text-sm">Create quotes to see your top customers</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Performance Overview</span>
            </CardTitle>
            <CardDescription>
              Monthly revenue trends and business metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Revenue Trend Chart */}
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Monthly Revenue Trend</h4>
                  <div className="text-sm text-gray-600">Invoice revenue over the last 6 months</div>
                </div>
                <MiniLineChart 
                  data={stats.monthlyTrends.map(trend => ({
                    label: trend.month,
                    value: trend.revenue
                  }))}
                  height={120}
                  color="#10b981"
                />
              </div>

              {/* Key Metrics */}
              <div className="space-y-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{stats.recentActivity.paidThisMonth}</div>
                  <div className="text-sm text-gray-600">Paid This Month</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{stats.recentActivity.invoicesThisMonth}</div>
                  <div className="text-sm text-gray-600">Invoices This Month</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">
                    {stats.recentActivity.invoicesThisMonth > 0 
                      ? Math.round((stats.recentActivity.paidThisMonth / stats.recentActivity.invoicesThisMonth) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Payment Rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
