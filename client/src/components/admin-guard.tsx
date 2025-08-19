import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft, Shield } from 'lucide-react';

// Define admin users - only these users can access internal tools
const ADMIN_USERS = [
  'rwtibbitts', // Add your username here
  // Add other admin usernames as needed
];

interface AdminGuardProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function AdminGuard({ children, fallbackMessage }: AdminGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // Check if user is authenticated and is an admin
  const isAdmin = isAuthenticated && user?.username && ADMIN_USERS.includes(user.username);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-white/5 border-white/10 max-w-md w-full">
              <CardContent className="p-8 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
                <p className="text-gray-300 mb-6">
                  Please log in to access this internal tool.
                </p>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go to Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#01032d] to-[#010101] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="bg-white/5 border-white/10 max-w-md w-full">
              <CardContent className="p-8 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
                <p className="text-gray-300 mb-2">
                  {fallbackMessage || 'You do not have permission to access this internal tool.'}
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Current user: {user?.username}
                </p>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Main App
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and is an admin, render the protected content
  return <>{children}</>;
}