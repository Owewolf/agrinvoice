import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, 
  Home, 
  Plus, 
  FileText, 
  Receipt, 
  Users,
  BarChart3, 
  Settings, 
  LogOut,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authService } from '@/lib/auth';

const primaryMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
  },
  {
    id: 'new-quote',
    label: 'Create New Quote',
    icon: Plus,
    path: '/new-quote',
  },
  {
    id: 'quote-history',
    label: 'Quote History',
    icon: FileText,
    path: '/quote-history',
  },
  {
    id: 'invoice-history',
    label: 'Invoice History',
    icon: Receipt,
    path: '/invoice-history',
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    path: '/clients',
  },
];

const secondaryMenuItems = [
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    path: '/products',
  },
  {
    id: 'admin-settings',
    label: 'Admin Settings',
    icon: Settings,
    path: '/admin-settings',
  },
];

interface HamburgerMenuProps {
  className?: string;
}

export function HamburgerMenu({ className }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("p-2", className)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left">AgriHover Menu</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Primary Navigation */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Main Navigation
            </h3>
            <nav className="space-y-1">
              {primaryMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                      active
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("mr-3 h-5 w-5", active ? "text-blue-700" : "text-gray-400")} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <Separator />

          {/* Secondary Navigation */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Administration
            </h3>
            <nav className="space-y-1">
              {secondaryMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                      active
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className={cn("mr-3 h-5 w-5", active ? "text-blue-700" : "text-gray-400")} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <Separator />

          {/* Logout */}
          <div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-700 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="mr-3 h-5 w-5 text-red-500" />
              Logout
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
