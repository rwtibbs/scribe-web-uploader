import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { graphqlClient } from '@/lib/graphql';
import { Campaign } from '@/types/aws';
import { useAuth } from '@/contexts/auth-context';

export function useCampaigns(owner?: string) {
  const { user, isAuthenticated } = useAuth();
  
  const query = useQuery<Campaign[]>({
    queryKey: ['campaigns', owner, 'production'], // Add environment to cache key
    queryFn: async () => {
      if (!owner) throw new Error('Owner is required to fetch campaigns');
      if (!user?.accessToken) throw new Error('User access token is required');
      
      console.log('🔄 Fetching campaigns for owner:', owner, '(production environment only)');
      
      // Try with Cognito access token first, then fallback to API key
      const campaigns = await graphqlClient.getCampaignsByOwner(owner, user.accessToken);
      console.log('✅ Campaigns fetched:', campaigns.length, 'campaigns');
      
      if (campaigns.length > 20) {
        console.log('📊 Large campaign collection detected - pagination was used to fetch all results');
      }
      
      return campaigns;
    },
    // More robust enablement condition - wait for full auth state
    enabled: !!owner && !!user && !!user.accessToken && isAuthenticated && owner === user?.username,
    retry: (failureCount, error) => {
      // Retry up to 5 times for mobile networks
      if (failureCount >= 5) return false;
      
      // If it's a network error or auth error, retry more aggressively
      if (error?.message?.includes('Network connection failed') || 
          error?.message?.includes('access token') ||
          error?.message?.includes('User access token is required')) {
        return failureCount < 7;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => {
      // Faster initial retries for mobile: 500ms, 1s, 2s, 4s...
      return Math.min(500 * Math.pow(2, attemptIndex), 8000);
    },
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes (more aggressive refresh for mobile)
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Refetch on mount but respect cache
    // Add networkMode to handle offline scenarios better
    networkMode: 'online',
  });

  // CRITICAL FIX: Force refetch when user becomes available for the first time only
  // This handles the race condition where the query was disabled initially
  useEffect(() => {
    if (user?.accessToken && isAuthenticated && owner && owner === user.username && !query.data) {
      console.log('🔄 User became available, triggering initial campaigns fetch for mobile compatibility');
      query.refetch();
    }
  }, [user?.accessToken, isAuthenticated, owner, query.data]);

  return query;
}
