import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/lib/auth';
import { AuthUser } from '@shared/schema';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentSession();
    
    // Set up a periodic check for auth state changes (e.g., token expiration)
    const interval = setInterval(() => {
      checkCurrentSession();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const checkCurrentSession = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Checking current session...');
      const currentUser = await AuthService.getCurrentSession();
      setUser(currentUser);
      console.log('✅ Session check complete:', currentUser ? 'User found' : 'No active session');
    } catch (err) {
      console.error('❌ Error checking current session:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const authUser = await AuthService.signIn(username, password);
      setUser(authUser);
      console.log('✅ Authentication successful');
      return authUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      console.error('❌ Authentication failed:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    console.log('🚪 Signing out user');
    AuthService.signOut();
    setUser(null);
    setError(null);
    setIsLoading(false);
    console.log('✅ User signed out successfully');
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}