import { useEffect, useState } from 'react';
import { authService } from '@/lib/auth';
import { User } from '@/types';
import Login from '@/pages/Login';

interface AuthGuardProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
}

export default function AuthGuard({ children, onNavigate }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    onNavigate('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onNavigate={onNavigate} />;
  }

  return <>{children}</>;
}