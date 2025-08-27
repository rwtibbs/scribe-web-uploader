import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/lib/auth';
import { AuthUser } from '@shared/schema';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authReady: boolean;
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
  const [authReady, setAuthReady] = useState(false);

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
      setAuthReady(false);
      console.log('🔄 Checking current session...');
      
      const currentUser = await AuthService.getCurrentSession();
      
      if (currentUser) {
        console.log('✅ User found, setting user data with access token');
        setUser(currentUser);
        
        // Enhanced mobile authentication stability - longer delay and verification
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Additional verification that the token is valid and accessible
        if (currentUser.accessToken && currentUser.username) {
          console.log('🔐 Auth context fully ready with valid token');
          setAuthReady(true);
        } else {
          console.warn('⚠️ Auth context has user but missing token data');
          setAuthReady(false);
        }
      } else {
        setUser(null);
        setAuthReady(true); // Ready to show login form
        console.log('✅ No active session found');
      }
      
      console.log('✅ Session check complete:', currentUser ? 'User authenticated' : 'No active session');
    } catch (err) {
      console.error('❌ Error checking current session:', err);
      setUser(null);
      setAuthReady(true); // Ready to show login form even after error
      // Only clear cache when session check fails (user not authenticated)
      localStorage.removeItem('selectedCampaign');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      setAuthReady(false);
      
      // Production environment is forced in aws-config.ts
      const authUser = await AuthService.signIn(username, password);
      setUser(authUser);
      
      // Enhanced mobile stability with verification
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify auth state is fully ready before allowing queries
      if (authUser.accessToken && authUser.username) {
        setAuthReady(true);
        console.log('✅ Authentication successful and auth context ready');
      } else {
        console.warn('⚠️ Authentication succeeded but context not ready');
        setAuthReady(false);
      }
      
      return authUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      console.error('❌ Authentication failed:', err);
      
      // Provide specific error message for non-production accounts
      if (errorMessage.includes('User does not exist') || errorMessage.includes('Incorrect username or password')) {
        setError('Only production accounts are permitted. Please contact support if you need access.');
      } else {
        setError(errorMessage);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    console.log('🚪 Signing out user');
    
    // Clear all cached data on signout to prevent cross-environment contamination
    localStorage.removeItem('selectedCampaign');
    localStorage.removeItem('tabletopscribe-environment');
    
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
    authReady,
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