import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '@/lib/auth';
import { AuthUser } from '@shared/schema';

export function useAuth() {
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
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const authUser = await AuthService.signIn(username, password);
      console.log('✅ Authentication successful, setting user:', authUser);
      setUser(authUser);
      console.log('🔄 User state updated in hook');
      return authUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
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

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn,
    signOut,
  };
}
