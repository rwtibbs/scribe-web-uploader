import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import { Campaign } from '@/types/aws';
import { useAuth } from '@/contexts/auth-context';

export function useCampaigns(owner?: string) {
  const { user } = useAuth();
  
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', owner],
    queryFn: async () => {
      if (!owner) throw new Error('Owner is required to fetch campaigns');
      console.log('🔄 Fetching campaigns for owner:', owner);
      try {
        // Try with Cognito access token first, then fallback to API key
        const campaigns = await graphqlClient.getCampaignsByOwner(owner, user?.accessToken);
        console.log('✅ Campaigns fetched:', campaigns.length, 'campaigns');
        return campaigns;
      } catch (error) {
        console.error('❌ Failed to fetch campaigns, using fallback:', error);
        // Return empty array when authentication fails
        return [];
      }
    },
    enabled: !!owner,
    retry: false, // Don't retry failed requests
  });
}
