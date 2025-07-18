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
      return campaigns;
    },
    enabled: !!owner && !!user, // Ensure user is available
    retry: 3, // Allow retries for transient network issues
    retryDelay: 1000, // 1 second between retries
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Always refetch on component mount
  });
}
