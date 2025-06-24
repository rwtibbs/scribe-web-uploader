import { z } from "zod";

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
