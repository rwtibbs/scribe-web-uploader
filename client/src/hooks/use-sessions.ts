import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import { useAuth } from '@/contexts/auth-context';

export function useSessions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['/api/sessions', user?.username],
    queryFn: async () => {
      if (!user?.username) {
        return [];
      }
      return graphqlClient.getSessionsByOwner(user.username, user.accessToken);
    },
    enabled: !!user?.username,
  });
}

export function useSession(sessionId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['/api/sessions', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      return graphqlClient.getSession(sessionId, user?.accessToken);
    },
    enabled: !!sessionId,
  });
}