import { db } from './db';
import { 
  users, 
  referralCodes, 
  referralRewards, 
  userCardFingerprints,
  referralUsageTracking,
  type User,
  type ReferralCode,
  type ReferralReward
} from '@shared/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { getUncachableStripeClient } from './stripeClient';
import { getFeatureFlags } from './featureFlags';
import crypto from 'crypto';

export class ReferralService {
  private async getOrCreateBaseCoupon(): Promise<string> {
    const stripe = await getUncachableStripeClient();
    const flags = getFeatureFlags();
    
    const couponId = 'referral_5_off';
    
    try {
      const existingCoupon = await stripe.coupons.retrieve(couponId);
      return existingCoupon.id;
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        const coupon = await stripe.coupons.create({
          id: couponId,
          amount_off: flags.referralDiscountAmount,
          currency: 'usd',
          name: 'Referral - $5 Off',
          duration: 'once',
        });
        return coupon.id;
      }
      throw error;
    }
  }

  async getOrCreateUserByEmail(email: string, cognitoSub: string): Promise<User> {
    const existingUser = await db.select().from(users).where(eq(users.cognitoSub, cognitoSub)).limit(1);
    
    if (existingUser.length > 0) {
      return existingUser[0];
    }

    const [newUser] = await db.insert(users).values({
      email,
      cognitoSub,
    }).returning();

    return newUser;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId)).limit(1);
    return user || null;
  }

  async updateUserStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
    await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
  }

  async createReferralCode(userId: number): Promise<ReferralCode> {
    const existingCode = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
    
    if (existingCode.length > 0) {
      return existingCode[0];
    }

    const stripe = await getUncachableStripeClient();
    const couponId = await this.getOrCreateBaseCoupon();
    
    const code = this.generateReferralCode();
    
    const promotionCode = await stripe.promotionCodes.create({
      coupon: couponId,
      code: code,
      metadata: {
        referrer_user_id: userId.toString(),
        type: 'referral',
      },
      restrictions: {
        first_time_transaction: true,
        minimum_amount: getFeatureFlags().referralMinPurchaseAmount,
        minimum_amount_currency: 'usd',
      },
    } as any);

    const [newReferralCode] = await db.insert(referralCodes).values({
      userId,
      code,
      stripePromotionCodeId: promotionCode.id,
      stripeCouponId: couponId,
    }).returning();

    return newReferralCode;
  }

  async getReferralCode(userId: number): Promise<ReferralCode | null> {
    const [code] = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
    return code || null;
  }

  async getReferralRewards(userId: number): Promise<ReferralReward[]> {
    return await db.select().from(referralRewards).where(eq(referralRewards.referrerUserId, userId));
  }

  async getMonthlyRewardCount(userId: number): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db.select({ count: sql<number>`count(*)` })
      .from(referralRewards)
      .where(
        and(
          eq(referralRewards.referrerUserId, userId),
          gte(referralRewards.createdAt, startOfMonth)
        )
      );

    return Number(result[0]?.count || 0);
  }

  async storeCardFingerprint(userId: number, fingerprint: string, paymentMethodId?: string): Promise<void> {
    const existing = await db.select()
      .from(userCardFingerprints)
      .where(and(
        eq(userCardFingerprints.userId, userId),
        eq(userCardFingerprints.cardFingerprint, fingerprint)
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userCardFingerprints).values({
        userId,
        cardFingerprint: fingerprint,
        stripePaymentMethodId: paymentMethodId,
      });
    }
  }

  async checkCardFingerprintMatch(referrerUserId: number, referredUserFingerprint: string): Promise<boolean> {
    const referrerFingerprints = await db.select()
      .from(userCardFingerprints)
      .where(eq(userCardFingerprints.userId, referrerUserId));

    return referrerFingerprints.some(fp => fp.cardFingerprint === referredUserFingerprint);
  }

  async isCheckoutSessionProcessed(checkoutSessionId: string): Promise<boolean> {
    const [existing] = await db.select()
      .from(referralUsageTracking)
      .where(eq(referralUsageTracking.stripeCheckoutSessionId, checkoutSessionId))
      .limit(1);

    return !!existing;
  }

  async markCheckoutSessionProcessed(
    checkoutSessionId: string, 
    referralCodeId: number, 
    referredUserId: number,
    rewardIssued: boolean
  ): Promise<void> {
    await db.insert(referralUsageTracking).values({
      stripeCheckoutSessionId: checkoutSessionId,
      referralCodeId,
      referredUserId,
      rewardIssued,
    }).onConflictDoNothing();
  }

  async issueReferrerReward(
    referrerUserId: number,
    referredUserId: number,
    checkoutSessionId: string
  ): Promise<ReferralReward | null> {
    const flags = getFeatureFlags();
    
    const monthlyCount = await this.getMonthlyRewardCount(referrerUserId);
    if (monthlyCount >= flags.referralMaxRewardsPerMonth) {
      console.log(`Referrer ${referrerUserId} has reached monthly limit of ${flags.referralMaxRewardsPerMonth} rewards`);
      return null;
    }

    const stripe = await getUncachableStripeClient();
    
    const rewardCoupon = await stripe.coupons.create({
      amount_off: flags.referralDiscountAmount,
      currency: 'usd',
      name: 'Referral Reward - $5 Off',
      duration: 'once',
    });

    const rewardCode = this.generateReferralCode() + '_REWARD';
    
    const promotionCode = await stripe.promotionCodes.create({
      coupon: rewardCoupon.id,
      code: rewardCode,
      metadata: {
        reward_for_user_id: referrerUserId.toString(),
        referred_user_id: referredUserId.toString(),
        type: 'referral_reward',
      },
      restrictions: {
        minimum_amount: flags.referralMinPurchaseAmount,
        minimum_amount_currency: 'usd',
      },
    } as any);

    const [reward] = await db.insert(referralRewards).values({
      referrerUserId,
      referredUserId,
      stripePromotionCodeId: promotionCode.id,
      stripeCouponId: rewardCoupon.id,
      stripeCheckoutSessionId: checkoutSessionId,
    }).returning();

    return reward;
  }

  async getReferralCodeByStripePromotionCodeId(stripePromotionCodeId: string): Promise<ReferralCode | null> {
    const [code] = await db.select()
      .from(referralCodes)
      .where(eq(referralCodes.stripePromotionCodeId, stripePromotionCodeId))
      .limit(1);

    return code || null;
  }

  private generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }
}

export const referralService = new ReferralService();
