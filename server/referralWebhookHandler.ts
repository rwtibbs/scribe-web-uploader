import { referralService } from './referralService';
import { getUncachableStripeClient } from './stripeClient';
import { isReferralEnabled, getFeatureFlags } from './featureFlags';
import type Stripe from 'stripe';

export class ReferralWebhookHandler {
  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (!isReferralEnabled()) {
      console.log('Referral system is disabled, skipping webhook processing');
      return;
    }

    const checkoutSessionId = session.id;
    
    const alreadyProcessed = await referralService.isCheckoutSessionProcessed(checkoutSessionId);
    if (alreadyProcessed) {
      console.log(`Checkout session ${checkoutSessionId} already processed, skipping (idempotent)`);
      return;
    }

    if (!session.customer) {
      console.log('No customer in checkout session, skipping referral processing');
      return;
    }

    const stripe = await getUncachableStripeClient();
    const flags = getFeatureFlags();

    const amountTotal = session.amount_total || 0;
    if (amountTotal < flags.referralMinPurchaseAmount) {
      console.log(`Purchase amount ${amountTotal} is less than minimum ${flags.referralMinPurchaseAmount}, skipping referral`);
      return;
    }

    const discounts = session.total_details?.breakdown?.discounts || [];
    let promotionCodeId: string | null = null;

    for (const discount of discounts) {
      if (discount.discount?.promotion_code) {
        const promoCode = await stripe.promotionCodes.retrieve(
          discount.discount.promotion_code as string
        );
        if (promoCode.metadata?.type === 'referral') {
          promotionCodeId = promoCode.id;
          break;
        }
      }
    }

    if (!promotionCodeId) {
      console.log('No referral promotion code used in this checkout');
      return;
    }

    const referralCode = await referralService.getReferralCodeByStripePromotionCodeId(promotionCodeId);
    if (!referralCode) {
      console.log(`Referral code not found for promotion code ${promotionCodeId}`);
      return;
    }

    const referredUser = await referralService.getUserByStripeCustomerId(session.customer as string);
    if (!referredUser) {
      console.log(`Referred user not found for customer ${session.customer}`);
      return;
    }

    if (referredUser.id === referralCode.userId) {
      console.log('Self-referral detected, skipping reward');
      await referralService.markCheckoutSessionProcessed(
        checkoutSessionId,
        referralCode.id,
        referredUser.id,
        false
      );
      return;
    }

    let cardFingerprint: string | null = null;
    if (session.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        if (paymentIntent.payment_method) {
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
          if (paymentMethod.card?.fingerprint) {
            cardFingerprint = paymentMethod.card.fingerprint;
            
            await referralService.storeCardFingerprint(
              referredUser.id,
              cardFingerprint,
              paymentMethod.id
            );

            const fingerprintMatch = await referralService.checkCardFingerprintMatch(
              referralCode.userId,
              cardFingerprint
            );

            if (fingerprintMatch) {
              console.log('Card fingerprint matches referrer, skipping reward (anti-abuse)');
              await referralService.markCheckoutSessionProcessed(
                checkoutSessionId,
                referralCode.id,
                referredUser.id,
                false
              );
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking card fingerprint:', error);
      }
    }

    try {
      const reward = await referralService.issueReferrerReward(
        referralCode.userId,
        referredUser.id,
        checkoutSessionId
      );

      await referralService.markCheckoutSessionProcessed(
        checkoutSessionId,
        referralCode.id,
        referredUser.id,
        !!reward
      );

      if (reward) {
        console.log(`Referral reward issued to user ${referralCode.userId}`);
      } else {
        console.log('Referral reward not issued (monthly limit reached or other reason)');
      }
    } catch (error) {
      console.error('Error issuing referral reward:', error);
      throw error;
    }
  }
}

export const referralWebhookHandler = new ReferralWebhookHandler();
