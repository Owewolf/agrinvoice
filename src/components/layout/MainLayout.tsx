import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNavigation } from '@/components/navigation/BottomNavigation';
import { HamburgerMenu } from '@/components/navigation/HamburgerMenu';
import { Badge } from '@/components/ui/badge';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  
  // Don't show navigation on login page
  const isLoginPage = location.pathname === '/login';
  
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header - Desktop */}
      <header className="hidden md:block bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <HamburgerMenu />
              <div className="flex items-center space-x-3">
                <img 
                  src="/images/Logo.jpg" 
                  alt="AgriHover" 
                  className="h-8 w-8 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <h1 className="text-lg font-bold text-gray-900">AgriHover</h1>
                  <p className="text-xs text-gray-500">Quote & Invoice System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-xs hidden lg:block">
                {new Date().toLocaleDateString('en-ZA', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Badge>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4">
          <div className="flex items-center justify-between h-14">
            <HamburgerMenu />
            <div className="flex items-center space-x-2">
              <img 
                src="/images/Logo.jpg" 
                alt="AgriHover" 
                className="h-6 w-6 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="text-base font-bold text-gray-900">AgriHover</h1>
            </div>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
}
