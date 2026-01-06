import { describe, expect, it } from "vitest";

import {
  per1MUnitsCostScenarios,
  perItemCostScenarios,
  secondsCostScenarios,
  tokenCostMonthlyUsd
} from "@/lib/estimate/estimator";

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

