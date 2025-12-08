import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ReferralStatus {
  enabled: boolean;
  discountAmount: number;
  minPurchaseAmount: number;
  maxRewardsPerMonth: number;
}

interface ReferralReward {
  id: number;
  redeemed: boolean;
  createdAt: string;
}

interface ReferralInfo {
  referralCode: {
    code: string;
    createdAt: string;
  } | null;
  rewards: ReferralReward[];
  stats: {
    totalRewards: number;
    redeemedRewards: number;
    monthlyRewardCount: number;
    monthlyLimit: number;
  };
}

export function useReferralStatus() {
  return useQuery<ReferralStatus>({
    queryKey: ['/api/referrals/status'],
    queryFn: async () => {
      const response = await fetch('/api/referrals/status');
      if (!response.ok) {
        throw new Error('Failed to fetch referral status');
      }
      return response.json();
    },
  });
}

export function useReferralInfo(accessToken: string | null) {
  return useQuery<ReferralInfo>({
    queryKey: ['/api/referrals'],
    enabled: !!accessToken,
    queryFn: async () => {
      const response = await fetch('/api/referrals', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch referral info');
      }
      return response.json();
    },
  });
}

export function useCreateReferralCode(accessToken: string | null) {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/referrals/code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to create referral code');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals'] });
    },
  });
}
