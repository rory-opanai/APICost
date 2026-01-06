import { z } from "zod";

const categorySchema = z.enum([
  "text",
  "image_tokens",
  "audio_tokens",
  "video",
  "image_per_image",
  "transcription_tts"
]);

const modeSchema = z.enum(["token", "message", "seconds", "per_image", "per_minute", "per_character"]);

const pricingTierSchema = z.enum(["batch", "flex", "standard", "priority"]);

export const queryStateSchema = z.object({
  v: z.literal(1),
  pricingTier: pricingTierSchema.default("standard"),
  category: categorySchema,
  mode: modeSchema,
  modelsSelected: z.array(z.string()).default([]),

  // Token-based inputs
  monthlyInputTokens: z.number().nonnegative().default(1_000_000),
  monthlyOutputTokens: z.number().nonnegative().default(300_000),
  cachedInputPct: z.number().min(0).max(90).default(0),

  // Message-based inputs
  messagesPerMonth: z.number().nonnegative().default(10_000),
  avgInputTokensPerMessage: z.number().nonnegative().default(500),
  avgOutputTokensPerMessage: z.number().nonnegative().default(200),
  presetId: z.string().nullable().optional(),

  // Video
  secondsPerMonth: z.number().nonnegative().default(1000),
  videoModel: z.string().default("sora-2"),
  videoVariant: z.string().default("1280x720"),

  // Per-image generation
  imageModel: z.string().default("dall-e-3"),
  imageQuality: z.string().default("standard"),
  imageResolution: z.string().default("1024x1024"),
  imagesPerMonth: z.number().nonnegative().default(1000),
  customUsdPerImage: z.number().nonnegative().nullable().optional(),

  // Transcription / TTS
  otherModel: z.enum(["whisper", "tts", "tts-hd"]).default("whisper"),
  minutesPerMonth: z.number().nonnegative().default(1000),
  charactersPerMonth: z.number().nonnegative().default(1_000_000),

  // Scenarios
  lowMultiplier: z.number().positive().default(0.7),
  baseMultiplier: z.number().positive().default(1.0),
  highMultiplier: z.number().positive().default(1.5)
});

export type QueryState = z.infer<typeof queryStateSchema>;

export const DEFAULT_STATE: QueryState = queryStateSchema.parse({
  v: 1,
  category: "text",
  mode: "message",
  modelsSelected: ["gpt-5.2", "gpt-5.2-pro", "gpt-5.1"]
});
