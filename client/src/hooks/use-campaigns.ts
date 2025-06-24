import { useQuery } from '@tanstack/react-query';
import { graphqlClient } from '@/lib/graphql';
import { Campaign } from '@/types/aws';

export function useCampaigns(owner?: string) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', owner],
    queryFn: () => {
      if (!owner) throw new Error('Owner is required to fetch campaigns');
      return graphqlClient.getCampaignsByOwner(owner);
    },
    enabled: !!owner,
  });
}
