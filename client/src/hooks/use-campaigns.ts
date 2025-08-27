import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import { Campaign } from '@/types/aws';
import { useAuth } from '@/contexts/auth-context';

export function useCampaigns(owner?: string) {
  const { user, isAuthenticated } = useAuth();
  
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', owner, 'production'], // Add environment to cache key
    queryFn: async () => {
      console.log('🚀 Campaign query starting with:', {
        owner,
        hasUser: !!user,
        hasAccessToken: !!user?.accessToken,
        userUsername: user?.username,
        isAuthenticated
      });
      
      if (!owner) throw new Error('Owner is required to fetch campaigns');
      if (!user?.accessToken) {
        console.error('❌ Campaign query failed: Missing access token');
        throw new Error('User access token is required');
      }
      
      console.log('🔄 Fetching campaigns for owner:', owner, '(production environment only)');
      
      // Try with Cognito access token first, then fallback to API key
      const campaigns = await graphqlClient.getCampaignsByOwner(owner, user.accessToken);
      console.log('✅ Campaigns fetched:', campaigns.length, 'campaigns');
      
      if (campaigns.length > 20) {
        console.log('📊 Large campaign collection detected - pagination was used to fetch all results');
      }
      
      return campaigns;
    },
    // More robust enablement condition - wait for full auth state including access token
    enabled: !!owner && !!user && !!user.accessToken && isAuthenticated && owner === user?.username && !!user.username,
    retry: (failureCount, error) => {
      // Reasonable retries without causing infinite loading
      if (failureCount >= 3) {
        console.error('❌ Campaign query failed after 3 retries:', error);
        return false;
      }
      
      // Only retry for specific network/auth errors
      if (error?.message?.includes('Network connection failed') || 
          error?.message?.includes('User access token is required')) {
        console.log(`🔄 Retrying campaign query (attempt ${failureCount + 1}/3) due to:`, error?.message);
        return true;
      }
      
      // Don't retry for other errors to prevent infinite loading
      return false;
    },
    retryDelay: (attemptIndex) => {
      // Reasonable delays: 500ms, 1s, 2s
      return Math.min(500 * Math.pow(2, attemptIndex), 2000);
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds (shorter for mobile reliability)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Always refetch on component mount
    refetchOnReconnect: true, // Refetch when network reconnects
    // Add networkMode to handle offline scenarios better
    networkMode: 'online',
    // Add initial data fetch behavior
    notifyOnChangeProps: ['data', 'error', 'isLoading', 'isFetching'],
  });
}
