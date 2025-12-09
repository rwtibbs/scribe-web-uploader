export interface FeatureFlags {
  referralSystem: boolean;
  referralMaxRewardsPerMonth: number;
  referralMinPurchaseAmount: number;
  referralDiscountAmount: number;
}

const defaultFlags: FeatureFlags = {
  referralSystem: false,
  referralMaxRewardsPerMonth: 5,
  referralMinPurchaseAmount: 500,
  referralDiscountAmount: 500,
};

export function getFeatureFlags(): FeatureFlags {
  return {
    referralSystem: process.env.FEATURE_REFERRAL_SYSTEM !== 'false',
    referralMaxRewardsPerMonth: parseInt(process.env.REFERRAL_MAX_REWARDS_PER_MONTH || '5', 10),
    referralMinPurchaseAmount: parseInt(process.env.REFERRAL_MIN_PURCHASE_AMOUNT || '500', 10),
    referralDiscountAmount: parseInt(process.env.REFERRAL_DISCOUNT_AMOUNT || '500', 10),
  };
}

export function isReferralEnabled(): boolean {
  return getFeatureFlags().referralSystem;
}
