import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import { Campaign } from '@/types/aws';

export function useCampaigns(owner?: string) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', owner],
    queryFn: async () => {
      if (!owner) throw new Error('Owner is required to fetch campaigns');
      console.log('🔄 Fetching campaigns for owner:', owner);
      try {
        const campaigns = await graphqlClient.getCampaignsByOwner(owner);
        console.log('✅ Campaigns fetched:', campaigns.length, 'campaigns');
        return campaigns;
      } catch (error) {
        console.error('❌ Failed to fetch campaigns, using fallback:', error);
        // Return empty array when GraphQL endpoint is unreachable
        return [];
      }
    },
    enabled: !!owner,
    retry: false, // Don't retry failed requests
  });
}
