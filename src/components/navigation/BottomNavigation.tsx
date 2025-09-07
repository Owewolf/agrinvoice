import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, Receipt, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
  },
  {
    id: 'quotes',
    label: 'Quotes',
    icon: FileText,
    path: '/quote-history',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: Receipt,
    path: '/invoice-history',
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    path: '/clients',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/admin-settings',
  },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", active && "text-blue-600")} />
              <span className={cn(active && "text-blue-600")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
