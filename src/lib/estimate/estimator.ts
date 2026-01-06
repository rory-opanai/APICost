export type ScenarioKey = "low" | "base" | "high";

export type ScenarioMultipliers = {
  low: number;
  base: number;
  high: number;
};

export type TokenRates = {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
};

export type TokenVolume = {
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
  cachedInputPct?: number;
};

export type ScenarioCosts = Record<
  ScenarioKey,
  {
    monthlyUsd: number;
    annualUsd: number;
    effectiveBlendedUsdPer1M?: number;
  }
>;

export type TokenComputationDetails = {
  cachedInputTokens: number;
  billableInputTokens: number;
  outputTokens: number;
};

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundUsd(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function tokenCostMonthlyUsd(volume: TokenVolume, rates: TokenRates) {
  const inputTokens = Math.max(0, volume.monthlyInputTokens);
  const outputTokens = Math.max(0, volume.monthlyOutputTokens);

  const hasCached = typeof rates.cachedInputPer1M === "number" && Number.isFinite(rates.cachedInputPer1M);
  const cachedPct = hasCached ? clampNumber(volume.cachedInputPct ?? 0, 0, 90) : 0;

  const cachedInputTokens = hasCached ? inputTokens * (cachedPct / 100) : 0;
  const billableInputTokens = inputTokens - cachedInputTokens;

  const monthlyUsd =
    (billableInputTokens / 1e6) * rates.inputPer1M +
    (cachedInputTokens / 1e6) * (rates.cachedInputPer1M ?? 0) +
    (outputTokens / 1e6) * rates.outputPer1M;

  const totalTokens = inputTokens + outputTokens;
  const effectiveBlendedUsdPer1M = totalTokens > 0 ? monthlyUsd / (totalTokens / 1e6) : undefined;

  const details: TokenComputationDetails = {
    cachedInputTokens,
    billableInputTokens,
    outputTokens
  };

  return { monthlyUsd, effectiveBlendedUsdPer1M, details };
}

export function tokenCostScenarios(volume: TokenVolume, rates: TokenRates, multipliers: ScenarioMultipliers): ScenarioCosts {
  const scenarios: ScenarioKey[] = ["low", "base", "high"];
  return scenarios.reduce((acc, key) => {
    const m = multipliers[key];
    const scaled: TokenVolume = {
      ...volume,
      monthlyInputTokens: volume.monthlyInputTokens * m,
      monthlyOutputTokens: volume.monthlyOutputTokens * m
    };

    const { monthlyUsd, effectiveBlendedUsdPer1M } = tokenCostMonthlyUsd(scaled, rates);
    acc[key] = {
      monthlyUsd,
      annualUsd: monthlyUsd * 12,
      effectiveBlendedUsdPer1M
    };
    return acc;
  }, {} as ScenarioCosts);
}

export type MessageVolume = {
  messagesPerMonth: number;
  avgInputTokensPerMessage: number;
  avgOutputTokensPerMessage: number;
  cachedInputPct?: number;
};

export function deriveTokenVolumeFromMessages(volume: MessageVolume): TokenVolume {
  const messages = Math.max(0, volume.messagesPerMonth);
  return {
    monthlyInputTokens: messages * Math.max(0, volume.avgInputTokensPerMessage),
    monthlyOutputTokens: messages * Math.max(0, volume.avgOutputTokensPerMessage),
    cachedInputPct: volume.cachedInputPct
  };
}

export function messageCostScenarios(volume: MessageVolume, rates: TokenRates, multipliers: ScenarioMultipliers): ScenarioCosts {
  const scenarios: ScenarioKey[] = ["low", "base", "high"];
  return scenarios.reduce((acc, key) => {
    const m = multipliers[key];
    const scaled: MessageVolume = {
      ...volume,
      messagesPerMonth: volume.messagesPerMonth * m
    };
    acc[key] = tokenCostScenarios(deriveTokenVolumeFromMessages(scaled), rates, { low: 1, base: 1, high: 1 }).base;
    // tokenCostScenarios with neutral multipliers returns base; keep logic centralized.
    return acc;
  }, {} as ScenarioCosts);
}

export function secondsCostScenarios(
  secondsPerMonth: number,
  usdPerSecond: number,
  multipliers: ScenarioMultipliers
): ScenarioCosts {
  const scenarios: ScenarioKey[] = ["low", "base", "high"];
  return scenarios.reduce((acc, key) => {
    const m = multipliers[key];
    const monthlyUsd = Math.max(0, secondsPerMonth) * m * usdPerSecond;
    acc[key] = { monthlyUsd, annualUsd: monthlyUsd * 12 };
    return acc;
  }, {} as ScenarioCosts);
}

export function perItemCostScenarios(
  itemsPerMonth: number,
  usdPerItem: number,
  multipliers: ScenarioMultipliers
): ScenarioCosts {
  const scenarios: ScenarioKey[] = ["low", "base", "high"];
  return scenarios.reduce((acc, key) => {
    const m = multipliers[key];
    const monthlyUsd = Math.max(0, itemsPerMonth) * m * usdPerItem;
    acc[key] = { monthlyUsd, annualUsd: monthlyUsd * 12 };
    return acc;
  }, {} as ScenarioCosts);
}

export function per1MUnitsCostScenarios(
  unitsPerMonth: number,
  usdPer1MUnits: number,
  multipliers: ScenarioMultipliers
): ScenarioCosts {
  const scenarios: ScenarioKey[] = ["low", "base", "high"];
  return scenarios.reduce((acc, key) => {
    const m = multipliers[key];
    const monthlyUsd = (Math.max(0, unitsPerMonth) * m) / 1e6 * usdPer1MUnits;
    acc[key] = { monthlyUsd, annualUsd: monthlyUsd * 12 };
    return acc;
  }, {} as ScenarioCosts);
}

