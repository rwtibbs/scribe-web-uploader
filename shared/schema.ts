import { z } from "zod";
import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Campaign schema
export const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  owner: z.string(),
});

export type Campaign = z.infer<typeof campaignSchema>;

// Session schema
export const sessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  duration: z.number().positive(),
  audioFile: z.string().optional(),
  transcriptionStatus: z.enum(['pending-upload', 'uploading', 'processing', 'completed', 'error']),
  campaignSessionsId: z.string(),
  _version: z.number().optional(),
});

export const insertSessionSchema = sessionSchema.omit({ id: true, _version: true });

export type Session = z.infer<typeof sessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Upload progress schema
export const uploadProgressSchema = z.object({
  loaded: z.number(),
  total: z.number(),
  percentage: z.number(),
  status: z.string(),
});

export type UploadProgress = z.infer<typeof uploadProgressSchema>;

// Auth user schema
export const authUserSchema = z.object({
  username: z.string(),
  sub: z.string(),
  accessToken: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

// File upload schema
export const fileUploadSchema = z.object({
  sessionId: z.string(),
  campaignId: z.string(),
  audio_filename: z.string(),
  user_specified_fields: z.record(z.any()),
});

export type FileUploadPayload = z.infer<typeof fileUploadSchema>;

// ============================================
// Referral System Database Tables (Drizzle ORM)
// ============================================

// Users table - stores user info with Stripe references
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  cognitoSub: text("cognito_sub").unique().notNull(),
  email: text("email").unique().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Referral codes table - maps user to their Stripe promotion code
export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  code: text("code").unique().notNull(),
  stripePromotionCodeId: text("stripe_promotion_code_id").notNull(),
  stripeCouponId: text("stripe_coupon_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({ id: true, createdAt: true });
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;

// Referral rewards table - tracks issued $5-off coupons for referrers
export const referralRewards = pgTable("referral_rewards", {
  id: serial("id").primaryKey(),
  referrerUserId: integer("referrer_user_id").references(() => users.id).notNull(),
  referredUserId: integer("referred_user_id").references(() => users.id).notNull(),
  stripePromotionCodeId: text("stripe_promotion_code_id").notNull(),
  stripeCouponId: text("stripe_coupon_id").notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull(),
  redeemed: boolean("redeemed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralRewardSchema = createInsertSchema(referralRewards).omit({ id: true, createdAt: true });
export type ReferralReward = typeof referralRewards.$inferSelect;
export type InsertReferralReward = z.infer<typeof insertReferralRewardSchema>;

// User card fingerprints table - for anti-abuse detection
export const userCardFingerprints = pgTable("user_card_fingerprints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cardFingerprint: text("card_fingerprint").notNull(),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserCardFingerprintSchema = createInsertSchema(userCardFingerprints).omit({ id: true, createdAt: true });
export type UserCardFingerprint = typeof userCardFingerprints.$inferSelect;
export type InsertUserCardFingerprint = z.infer<typeof insertUserCardFingerprintSchema>;

// Referral usage tracking - prevents duplicate rewards for same checkout
export const referralUsageTracking = pgTable("referral_usage_tracking", {
  id: serial("id").primaryKey(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique().notNull(),
  referralCodeId: integer("referral_code_id").references(() => referralCodes.id).notNull(),
  referredUserId: integer("referred_user_id").references(() => users.id).notNull(),
  rewardIssued: boolean("reward_issued").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReferralUsageTrackingSchema = createInsertSchema(referralUsageTracking).omit({ id: true, createdAt: true });
export type ReferralUsageTracking = typeof referralUsageTracking.$inferSelect;
export type InsertReferralUsageTracking = z.infer<typeof insertReferralUsageTrackingSchema>;
