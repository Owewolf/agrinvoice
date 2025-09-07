import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom';

import AuthGuard from '@/components/AuthGuard';
import { MainLayout } from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NewQuote from '@/pages/NewQuote';
import QuotePreview from '@/pages/QuotePreview';
import QuoteHistory from '@/pages/QuoteHistory';
import InvoicePreview from '@/pages/InvoicePreview';
import InvoiceHistory from '@/pages/InvoiceHistory';
import AdminSettings from '@/pages/AdminSettings';
import Products from '@/pages/Products';
import { Clients } from '@/pages/Clients';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function AppContent() {
  const navigate = useNavigate();

  const handleNavigate = (page: string, params?: { quoteId?: string; invoiceId?: string } | string) => {
    let path = `/${page}`;
    if (typeof params === 'string') {
      if (page === 'quote-preview') {
        path = `/${page}/${params}`;
      } else if (page === 'invoice-preview') {
        path = `/${page}/${params}`;
      }
    } else if (params?.quoteId) {
      if (page === 'new-quote') {
        path = `/${page}?edit=${params.quoteId}`;
      } else {
        path = `/quote-preview/${params.quoteId}`;
      }
    } else if (params?.invoiceId) {
      path = `/invoice-preview/${params.invoiceId}`;
    }
    navigate(path);
  };

  const AuthWrapper = ({ children }: { children: React.ReactElement }) => (
    <AuthGuard onNavigate={handleNavigate}>{children}</AuthGuard>
  );

  const QuotePreviewWrapper = () => {
    const { quoteId } = useParams<{ quoteId: string }>();
    return <QuotePreview onNavigate={handleNavigate} quoteId={quoteId!} />;
  };

  const NewQuoteWrapper = () => {
    const [searchParams] = useSearchParams();
    const editQuoteId = searchParams.get('edit');
    return <NewQuote onNavigate={handleNavigate} quoteId={editQuoteId || undefined} />;
  };

  const InvoicePreviewWrapper = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    return <InvoicePreview onNavigate={handleNavigate} invoiceId={invoiceId} />;
  };

  return (
    <MainLayout>
      <Routes>
        <Route path="/login" element={<Login onNavigate={handleNavigate} />} />
        <Route path="/dashboard" element={<AuthWrapper><Dashboard onNavigate={handleNavigate} /></AuthWrapper>} />
        <Route path="/new-quote" element={<AuthWrapper><NewQuoteWrapper /></AuthWrapper>} />
        <Route path="/quotes" element={<AuthWrapper><NewQuoteWrapper /></AuthWrapper>} />
        <Route path="/quote-preview/:quoteId" element={<AuthWrapper><QuotePreviewWrapper /></AuthWrapper>} />
        <Route path="/quote-history" element={<AuthWrapper><QuoteHistory onNavigate={handleNavigate} /></AuthWrapper>} />
        <Route path="/invoice-preview/:invoiceId" element={<AuthWrapper><InvoicePreviewWrapper /></AuthWrapper>} />
        <Route path="/invoice-history" element={<AuthWrapper><InvoiceHistory onNavigate={handleNavigate} /></AuthWrapper>} />
        <Route path="/admin-settings" element={<AuthWrapper><AdminSettings onNavigate={handleNavigate} /></AuthWrapper>} />
        <Route path="/products" element={<AuthWrapper><Products onNavigate={handleNavigate} /></AuthWrapper>} />
        <Route path="/clients" element={<AuthWrapper><Clients onNavigate={handleNavigate} /></AuthWrapper>} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  useEffect(() => {
    // This will clear the old product data from local storage
    // and ensure the new data with the corrected category is used.
    localStorage.removeItem('agrihover_products');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
