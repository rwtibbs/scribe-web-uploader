import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    // Ensure query runs immediately when enabled
    initialData: undefined,
    placeholderData: undefined,
    retry: (failureCount, error) => {
      // Retry up to 8 times for mobile networks
      if (failureCount >= 8) return false;
      
      // If it's a network error or auth error, retry more aggressively
      if (error?.message?.includes('Network connection failed') || 
          error?.message?.includes('access token') ||
          error?.message?.includes('User access token is required')) {
        return failureCount < 10;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => {
      // Very fast initial retries for mobile: 100ms, 200ms, 500ms, 1s...
      return Math.min(100 * Math.pow(2, attemptIndex), 5000);
    },
    staleTime: 30 * 1000, // Consider data fresh for only 30 seconds (very aggressive refresh)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes only
    refetchOnWindowFocus: true, // Refetch on window focus for mobile
    refetchOnMount: true, // Always refetch on component mount
    // Force immediate refetch for mobile
    refetchInterval: false,
    networkMode: 'online',
  });

  // Force refetch when authentication becomes available - mobile fix
  useEffect(() => {
    if (isAuthenticated && user?.accessToken && owner && !query.data && !query.isFetching) {
      console.log('🎯 Mobile auth fix: Force refetching campaigns after auth ready');
      query.refetch();
    }
  }, [isAuthenticated, user?.accessToken, owner, query.data, query.isFetching, query.refetch]);

  return query;
}
