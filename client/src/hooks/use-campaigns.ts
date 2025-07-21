import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import { Campaign } from '@/types/aws';
import { useAuth } from '@/contexts/auth-context';

export function useCampaigns(owner?: string) {
  const { user } = useAuth();
  
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', owner, 'production'], // Add environment to cache key
    queryFn: async () => {
      if (!owner) throw new Error('Owner is required to fetch campaigns');
      console.log('🔄 Fetching campaigns for owner:', owner, '(production environment only)');
      
      // Try with Cognito access token first, then fallback to API key
      const campaigns = await graphqlClient.getCampaignsByOwner(owner, user?.accessToken);
      console.log('✅ Campaigns fetched:', campaigns.length, 'campaigns');
      
      if (campaigns.length > 20) {
        console.log('📊 Large campaign collection detected - pagination was used to fetch all results');
      }
      
      return campaigns;
    },
    enabled: !!owner && !!user, // Ensure user is available
    retry: (failureCount, error) => {
      // Retry up to 3 times, but be more aggressive for network errors
      if (failureCount >= 3) return false;
      
      // If it's a network error, retry more quickly
      if (error?.message?.includes('Network connection failed')) {
        return failureCount < 5;
      }
      
      return true;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s...
      return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
    },
    staleTime: 3 * 60 * 1000, // Consider data fresh for 3 minutes (reduced for better UX)
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Always refetch on component mount
  });
}
