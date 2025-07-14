import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import { useAuth } from '@/contexts/auth-context';
import { useCampaign } from '@/contexts/campaign-context';

export function useSessions() {
  const { user } = useAuth();
  const { selectedCampaign } = useCampaign();
  
  return useQuery({
    queryKey: ['/api/sessions', user?.username, selectedCampaign?.id],
    queryFn: async () => {
      if (!user?.username || !selectedCampaign) {
        return [];
      }
      // Get sessions for the specific campaign only
      const allSessions = await graphqlClient.getSessionsByOwner(user.username, user.accessToken);
      console.log('🔍 All sessions:', allSessions.length);
      console.log('🎯 Selected campaign ID:', selectedCampaign.id);
      console.log('📊 Session campaign IDs:', allSessions.map(s => ({ name: s.name, campaignId: s.campaignSessionsId })));
      
      const filteredSessions = allSessions.filter(session => session.campaignSessionsId === selectedCampaign.id);
      console.log('✅ Filtered sessions:', filteredSessions.length);
      
      return filteredSessions;
    },
    enabled: !!user?.username && !!selectedCampaign,
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