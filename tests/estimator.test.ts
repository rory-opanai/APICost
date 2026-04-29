import { describe, expect, it } from "vitest";

import {
  per1MUnitsCostScenarios,
  perItemCostScenarios,
  secondsCostScenarios,
  tokenCostMonthlyUsd
} from "@/lib/estimate/estimator";
import { pricingByTier } from "@/lib/pricing/pricing";

describe("estimator", () => {
  it("token calc sanity: input/output + cached input", () => {
    const { monthlyUsd } = tokenCostMonthlyUsd(
      { monthlyInputTokens: 10_000_000, monthlyOutputTokens: 2_000_000, cachedInputPct: 20 },
      { inputPer1M: 0.25, cachedInputPer1M: 0.025, outputPer1M: 2.0 }
    );

    expect(monthlyUsd).toBeCloseTo(6.05, 10);
  });

  it("video: 1,000 seconds at $0.10/sec", () => {
    const scenarios = secondsCostScenarios(1000, 0.1, { low: 1, base: 1, high: 1 });
    expect(scenarios.base.monthlyUsd).toBeCloseTo(100, 10);
    expect(scenarios.base.annualUsd).toBeCloseTo(1200, 10);
  });

  it("whisper: 1,000 minutes at $0.006/min", () => {
    const scenarios = perItemCostScenarios(1000, 0.006, { low: 1, base: 1, high: 1 });
    expect(scenarios.base.monthlyUsd).toBeCloseTo(6, 10);
  });

  it("per-image: 1,000 images at $0.009/image", () => {
    const scenarios = perItemCostScenarios(1000, 0.009, { low: 1, base: 1, high: 1 });
    expect(scenarios.base.monthlyUsd).toBeCloseTo(9, 10);
  });

  it("per-character: 1,000,000 chars at $15 / 1M chars", () => {
    const scenarios = per1MUnitsCostScenarios(1_000_000, 15, { low: 1, base: 1, high: 1 });
    expect(scenarios.base.monthlyUsd).toBeCloseTo(15, 10);
  });
});

describe("pricing snapshots", () => {
  it("includes current GPT-5.5, GPT-5.4, GPT-5.3, realtime, and image pricing", () => {
    expect(pricingByTier.standard.textTokens.models["gpt-5.5"]).toEqual({
      inputPer1M: 5,
      cachedInputPer1M: 0.5,
      outputPer1M: 30
    });
    expect(pricingByTier.standard.textTokens.models["gpt-5.5-pro"]).toEqual({
      inputPer1M: 30,
      cachedInputPer1M: null,
      outputPer1M: 180
    });
    expect(pricingByTier.standard.textTokens.models["gpt-5.4"]).toEqual({
      inputPer1M: 2.5,
      cachedInputPer1M: 0.25,
      outputPer1M: 15
    });
    expect(pricingByTier.standard.textTokens.models["gpt-5.4-mini"]).toEqual({
      inputPer1M: 0.75,
      cachedInputPer1M: 0.075,
      outputPer1M: 4.5
    });
    expect(pricingByTier.standard.textTokens.models["gpt-5.4-nano"]).toEqual({
      inputPer1M: 0.2,
      cachedInputPer1M: 0.02,
      outputPer1M: 1.25
    });
    expect(pricingByTier.standard.textTokens.models["gpt-5.3-codex"]).toEqual({
      inputPer1M: 1.75,
      cachedInputPer1M: 0.175,
      outputPer1M: 14
    });
    expect(pricingByTier.standard.textTokens.models["gpt-5.3-chat-latest"]).toEqual({
      inputPer1M: 1.75,
      cachedInputPer1M: 0.175,
      outputPer1M: 14
    });
    expect(pricingByTier.standard.audioTokens.models["gpt-realtime-1.5"]).toEqual({
      inputPer1M: 32,
      cachedInputPer1M: 0.4,
      outputPer1M: 64
    });
    expect(pricingByTier.standard.textTokens.models["gpt-realtime-1.5"]).toEqual({
      inputPer1M: 4,
      cachedInputPer1M: 0.4,
      outputPer1M: 16
    });
    expect(pricingByTier.standard.imageTokens.models["gpt-image-2"]).toEqual({
      inputPer1M: 8,
      cachedInputPer1M: 2,
      outputPer1M: 30
    });
    expect(pricingByTier.standard.textTokens.models["gpt-image-2"]).toEqual({
      inputPer1M: 5,
      cachedInputPer1M: 1.25,
      outputPer1M: null
    });
    expect(pricingByTier.batch.textTokens.models["gpt-5.5"]).toEqual({
      inputPer1M: 2.5,
      cachedInputPer1M: 0.25,
      outputPer1M: 15
    });
    expect(pricingByTier.flex.textTokens.models["gpt-5.4"]).toEqual({
      inputPer1M: 1.25,
      cachedInputPer1M: 0.13,
      outputPer1M: 7.5
    });
    expect(pricingByTier.priority.textTokens.models["gpt-5.5"]).toEqual({
      inputPer1M: 12.5,
      cachedInputPer1M: 1.25,
      outputPer1M: 75
    });
  });
});
