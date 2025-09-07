import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, AlertTriangle } from 'lucide-react';
import { clientStorageService } from '@/lib/clientStorage';
import { formatCurrency } from '@/lib/clientUtils';
import { useEffect, useState } from 'react';

export function ClientStatsCard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalOutstanding: 0,
    clientsWithOutstanding: 0,
    totalQuotes: 0,
    totalInvoices: 0
  });

  useEffect(() => {
    const clients = clientStorageService.getClients();
    const clientsWithOutstanding = clientStorageService.getClientsWithOutstanding();
    
    let totalOutstanding = 0;
    let totalQuotes = 0;
    let totalInvoices = 0;

    clients.forEach(client => {
      const clientStats = clientStorageService.getClientStats(client.id);
      totalQuotes += clientStats.totalQuotes;
      totalInvoices += clientStats.totalInvoices;
    });

    clientsWithOutstanding.forEach(client => {
      totalOutstanding += client.outstandingAmount;
    });

    setStats({
      totalClients: clients.length,
      totalOutstanding,
      clientsWithOutstanding: clientsWithOutstanding.length,
      totalQuotes,
      totalInvoices
    });
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clients with Outstanding</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.clientsWithOutstanding}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalQuotes}</div>
        </CardContent>
      </Card>
    </div>
  );
}
