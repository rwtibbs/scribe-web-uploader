import { useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth';
import { AuthUser } from '@shared/schema';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      setIsLoading(true);
      const currentUser = await AuthService.getCurrentSession();
      setUser(currentUser);
    } catch (err) {
      console.error('Error checking current session:', err);
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
    AuthService.signOut();
    setUser(null);
    setError(null);
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
