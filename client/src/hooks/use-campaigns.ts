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
      // More aggressive retries for mobile networks
      if (failureCount >= 8) return false;
      
      // If it's a network error or auth error, retry very aggressively
      if (error?.message?.includes('Network connection failed') || 
          error?.message?.includes('access token') ||
          error?.message?.includes('User access token is required') ||
          error?.message?.includes('GraphQL authentication failed')) {
        return failureCount < 10;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => {
      // Very fast initial retries for mobile: 200ms, 400ms, 800ms, 1.6s...
      return Math.min(200 * Math.pow(2, attemptIndex), 5000);
    },
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes (more aggressive refresh for mobile)
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Always refetch on component mount
    // Add networkMode to handle offline scenarios better
    networkMode: 'online',
  });
}
