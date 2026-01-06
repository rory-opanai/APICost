import { z } from "zod";

import batch from "./batch.json";
import flex from "./flex.json";
import priority from "./priority.json";
import standard from "./standard.json";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected ISO date like YYYY-MM-DD");

export const tokenRateSchema = z.object({
  inputPer1M: z.number().nullable(),
  cachedInputPer1M: z.number().nullable().optional(),
  outputPer1M: z.number().nullable()
});

export const pricingSchema = z.object({
  meta: z.object({
    lastUpdated: isoDateSchema,
    sourceUrl: z.string().url(),
    notes: z.string().optional()
  }),
  textTokens: z.object({
    unit: z.literal("USD per 1M tokens"),
    models: z.record(tokenRateSchema)
  }),
  imageTokens: z.object({
    unit: z.literal("USD per 1M tokens"),
    models: z.record(tokenRateSchema)
  }),
  audioTokens: z.object({
    unit: z.literal("USD per 1M tokens"),
    models: z.record(tokenRateSchema)
  }),
  video: z.object({
    unit: z.literal("USD per second"),
    models: z.record(
      z.object({
        variants: z.record(z.number())
      })
    )
  }),
  imageGeneration: z.object({
    unit: z.literal("USD per image"),
    models: z.record(
      z.object({
        qualities: z.record(z.record(z.number().nullable()))
      })
    )
  }),
  other: z.object({
    whisperTranscriptionPerMinute: z.number(),
    ttsPer1MCharacters: z.number(),
    ttsHdPer1MCharacters: z.number()
  })
});

export type PricingSnapshot = z.infer<typeof pricingSchema>;
export type TokenRate = z.infer<typeof tokenRateSchema>;

export const pricingByTier = {
  batch: pricingSchema.parse(batch),
  flex: pricingSchema.parse(flex),
  standard: pricingSchema.parse(standard),
  priority: pricingSchema.parse(priority)
} as const;

export type PricingTier = keyof typeof pricingByTier;

