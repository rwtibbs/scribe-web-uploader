import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import { useAuth } from '@/contexts/auth-context';

export function useCampaignSessions(campaignId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['campaign-sessions', campaignId, user?.username],
    queryFn: async () => {
      if (!campaignId || !user?.accessToken) {
        return [];
      }
      
      return graphqlClient.getSessionsByCampaign(campaignId, user.accessToken);
    },
    enabled: !!campaignId && !!user?.accessToken,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

export function useCampaignSessionCounts(campaignIds: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['campaign-session-counts', campaignIds, user?.username],
    queryFn: async () => {
      if (!user?.accessToken || campaignIds.length === 0) {
        return {};
      }
      
      console.log('🔄 Fetching session counts for campaigns:', campaignIds);
      
      const counts: Record<string, number> = {};
      
      // Fetch session counts for all campaigns in parallel
      const promises = campaignIds.map(async (campaignId) => {
        try {
          const sessions = await graphqlClient.getSessionsByCampaign(campaignId, user.accessToken);
          counts[campaignId] = sessions.length;
        } catch (error) {
          console.error(`Failed to fetch sessions for campaign ${campaignId}:`, error);
          counts[campaignId] = 0;
        }
      });
      
      await Promise.all(promises);
      
      console.log('✅ Session counts fetched:', counts);
      return counts;
    },
    enabled: !!user?.accessToken && campaignIds.length > 0,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}