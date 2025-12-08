import type { Express, Request, Response } from 'express';
import { referralService } from './referralService';
import { isReferralEnabled, getFeatureFlags } from './featureFlags';
import { extractVerifiedUser } from './cognitoAuth';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
  };
}

export function registerReferralRoutes(app: Express) {
  app.post('/api/referrals/code', async (req: AuthenticatedRequest, res: Response) => {
    if (!isReferralEnabled()) {
      return res.status(503).json({ error: 'Referral system is currently disabled' });
    }

    const userInfo = await extractVerifiedUser(req.headers.authorization);
    if (!userInfo) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const user = await referralService.getOrCreateUserByEmail(userInfo.email, userInfo.sub);
      const referralCode = await referralService.createReferralCode(user.id);

      res.json({
        code: referralCode.code,
        createdAt: referralCode.createdAt,
      });
    } catch (error) {
      console.error('Error creating referral code:', error);
      res.status(500).json({ error: 'Failed to create referral code' });
    }
  });

  app.get('/api/referrals', async (req: AuthenticatedRequest, res: Response) => {
    if (!isReferralEnabled()) {
      return res.status(503).json({ error: 'Referral system is currently disabled' });
    }

    const userInfo = await extractVerifiedUser(req.headers.authorization);
    if (!userInfo) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const user = await referralService.getOrCreateUserByEmail(userInfo.email, userInfo.sub);
      const referralCode = await referralService.getReferralCode(user.id);
      const rewards = await referralService.getReferralRewards(user.id);
      const monthlyRewardCount = await referralService.getMonthlyRewardCount(user.id);
      const flags = getFeatureFlags();

      res.json({
        referralCode: referralCode ? {
          code: referralCode.code,
          createdAt: referralCode.createdAt,
        } : null,
        rewards: rewards.map(r => ({
          id: r.id,
          redeemed: r.redeemed,
          createdAt: r.createdAt,
        })),
        stats: {
          totalRewards: rewards.length,
          redeemedRewards: rewards.filter(r => r.redeemed).length,
          monthlyRewardCount,
          monthlyLimit: flags.referralMaxRewardsPerMonth,
        },
      });
    } catch (error) {
      console.error('Error fetching referral info:', error);
      res.status(500).json({ error: 'Failed to fetch referral information' });
    }
  });

  app.get('/api/referrals/status', async (req: Request, res: Response) => {
    const flags = getFeatureFlags();
    res.json({
      enabled: isReferralEnabled(),
      discountAmount: flags.referralDiscountAmount / 100,
      minPurchaseAmount: flags.referralMinPurchaseAmount / 100,
      maxRewardsPerMonth: flags.referralMaxRewardsPerMonth,
    });
  });
}
