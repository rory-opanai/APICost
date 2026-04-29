"use client";

import { useEffect, useMemo, useState } from "react";

import { messagePresets } from "@/lib/estimate/presets";
import {
  per1MUnitsCostScenarios,
  perItemCostScenarios,
  secondsCostScenarios,
  tokenCostScenarios,
  type ScenarioCosts
} from "@/lib/estimate/estimator";
import { formatCompact, formatNumber, formatUsd } from "@/lib/format";
import { pricingByTier, type PricingSnapshot } from "@/lib/pricing/pricing";
import { DEFAULT_STATE, type QueryState } from "@/lib/state/queryState";

import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FieldHint, Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Tooltip } from "@/components/ui/Tooltip";

const CATEGORY_OPTIONS: Array<{ value: QueryState["category"]; label: string; hint: string }> = [
  { value: "text", label: "Text tokens", hint: "Chat / completions style usage." },
  { value: "image_tokens", label: "Image tokens", hint: "Vision + image tokens billed per 1M tokens." },
  { value: "audio_tokens", label: "Audio tokens", hint: "Realtime/audio tokens billed per 1M tokens." },
  { value: "video", label: "Video", hint: "Sora priced per second." },
  { value: "image_per_image", label: "Image (per-image)", hint: "Image generation priced per image." },
  { value: "transcription_tts", label: "Transcription & TTS", hint: "Whisper per minute; TTS per 1M characters." }
];

const PRICING_TIER_OPTIONS: Array<{ value: QueryState["pricingTier"]; label: string }> = [
  { value: "batch", label: "Batch" },
  { value: "flex", label: "Flex" },
  { value: "standard", label: "Standard" },
  { value: "priority", label: "Priority" }
];

function getModelOptions(pricing: PricingSnapshot, category: QueryState["category"]) {
  if (category === "text") {
    const all = Object.keys(pricing.textTokens.models);
    // Keep insertion order, but pin the most common seller defaults at the top.
    const pinnedOrder = [
      "gpt-5.5",
      "gpt-5.5-pro",
      "gpt-5.4",
      "gpt-5.4-mini",
      "gpt-5.4-nano",
      "gpt-5.3-codex",
      "gpt-5.3-chat-latest",
      "gpt-5.2",
      "gpt-5.2-pro",
      "gpt-5.1"
    ];
    const pinnedPresent = pinnedOrder.filter((m) => all.includes(m));
    const pinned = new Set(pinnedPresent);

    // After pinned, keep long-context GPT-5.x variants near the top.
    const otherGpt5 = all.filter((m) => !pinned.has(m) && m.startsWith("gpt-5"));
    const rest = all.filter((m) => !pinned.has(m) && !m.startsWith("gpt-5"));
    return [...pinnedPresent, ...otherGpt5, ...rest];
  }
  if (category === "image_tokens") return Object.keys(pricing.imageTokens.models);
  if (category === "audio_tokens") return Object.keys(pricing.audioTokens.models);
  return [];
}

function hasCachedPricing(pricing: PricingSnapshot, category: QueryState["category"], model: string) {
  if (category === "text") return typeof pricing.textTokens.models[model]?.cachedInputPer1M === "number";
  if (category === "image_tokens") return typeof pricing.imageTokens.models[model]?.cachedInputPer1M === "number";
  if (category === "audio_tokens") return typeof pricing.audioTokens.models[model]?.cachedInputPer1M === "number";
  return false;
}

function getTokenRates(pricing: PricingSnapshot, category: QueryState["category"], model: string) {
  const rates =
    category === "text"
      ? pricing.textTokens.models[model]
      : category === "image_tokens"
        ? pricing.imageTokens.models[model]
        : category === "audio_tokens"
          ? pricing.audioTokens.models[model]
          : null;

  if (!rates) return null;
  if (rates.inputPer1M == null || rates.outputPer1M == null) return null;
  const cached = typeof rates.cachedInputPer1M === "number" ? rates.cachedInputPer1M : undefined;
  return { inputPer1M: rates.inputPer1M, outputPer1M: rates.outputPer1M, cachedInputPer1M: cached };
}

function toMultipliers(state: QueryState) {
  return { low: state.lowMultiplier, base: state.baseMultiplier, high: state.highMultiplier };
}

type ModelEstimate = {
  model: string;
  scenarios?: ScenarioCosts;
  pricingStatus: "ok" | "missing";
  notes?: string;
};

export default function Calculator({ initialState }: { initialState: QueryState }) {
  const [state, setState] = useState<QueryState>(() => ({ ...DEFAULT_STATE, ...initialState }));
  const [notice, setNotice] = useState<string | null>(null);

  const pricing = pricingByTier[state.pricingTier] ?? pricingByTier.standard;

  // Enforce mode invariants when category switches.
  useEffect(() => {
    setState((s) => {
      if (s.category === "video" && s.mode !== "seconds") return { ...s, mode: "seconds" };
      if (s.category === "image_per_image" && s.mode !== "per_image") return { ...s, mode: "per_image" };
      if (s.category === "transcription_tts") {
        const wanted = s.otherModel === "whisper" ? "per_minute" : "per_character";
        if (s.mode !== wanted) return { ...s, mode: wanted };
      }
      if ((s.category === "text" || s.category === "image_tokens" || s.category === "audio_tokens") && s.mode !== "token" && s.mode !== "message") {
        return { ...s, mode: "message" };
      }
      return s;
    });
  }, [state.category, state.mode, state.otherModel]);

  const tokenModelOptions = useMemo(() => getModelOptions(pricing, state.category), [pricing, state.category]);
  const cachedApplicable = useMemo(() => {
    if (!["text", "image_tokens", "audio_tokens"].includes(state.category)) return false;
    return state.modelsSelected.some((m) => hasCachedPricing(pricing, state.category, m));
  }, [pricing, state.category, state.modelsSelected]);

  // Keep selections valid when switching categories/models.
  useEffect(() => {
    if (!(state.category === "text" || state.category === "image_tokens" || state.category === "audio_tokens")) return;
    if (!tokenModelOptions.length) return;
    setState((s) => {
      const allowed = new Set(tokenModelOptions);
      const filtered = s.modelsSelected.filter((m) => allowed.has(m));
      const next = filtered.length ? filtered : [tokenModelOptions[0]!];
      const same = next.length === s.modelsSelected.length && next.every((m, i) => m === s.modelsSelected[i]);
      return same ? s : { ...s, modelsSelected: next };
    });
  }, [state.category, tokenModelOptions]);

  useEffect(() => {
    if (state.category !== "video") return;
    const variants = Object.keys(pricing.video.models[state.videoModel]?.variants ?? {});
    if (!variants.length) return;
    if (variants.includes(state.videoVariant)) return;
    setState((s) => ({ ...s, videoVariant: variants[0]! }));
  }, [pricing, state.category, state.videoModel, state.videoVariant]);

  useEffect(() => {
    if (state.category !== "image_per_image") return;
    const qualities = Object.keys(pricing.imageGeneration.models[state.imageModel]?.qualities ?? {});
    if (!qualities.length) return;
    const nextQuality = qualities.includes(state.imageQuality) ? state.imageQuality : qualities[0]!;
    const resolutions = Object.keys(pricing.imageGeneration.models[state.imageModel]?.qualities?.[nextQuality] ?? {});
    const nextRes = resolutions.includes(state.imageResolution) ? state.imageResolution : resolutions[0] ?? state.imageResolution;

    setState((s) => {
      const patch: Partial<QueryState> = {};
      if (s.imageQuality !== nextQuality) patch.imageQuality = nextQuality;
      if (s.imageResolution !== nextRes) patch.imageResolution = nextRes;
      return Object.keys(patch).length ? { ...s, ...patch } : s;
    });
  }, [pricing, state.category, state.imageModel, state.imageQuality, state.imageResolution]);

  const estimates = useMemo(() => {
    const multipliers = toMultipliers(state);

    if (state.category === "video") {
      const model = state.videoModel;
      const variant = state.videoVariant;
      const rate = pricing.video.models[model]?.variants?.[variant];
      if (typeof rate !== "number") {
        return {
          kind: "single" as const,
          model,
          scenarios: undefined,
          errors: ["Missing video pricing for the selected model/variant in the pricing snapshot."]
        };
      }
      const scenarios = secondsCostScenarios(state.secondsPerMonth, rate, multipliers);
      return { kind: "single" as const, model: `${model} (${variant})`, scenarios, errors: [] };
    }

    if (state.category === "image_per_image") {
      const model = state.imageModel;
      const quality = state.imageQuality;
      const resolution = state.imageResolution;
      const priced = pricing.imageGeneration.models[model]?.qualities?.[quality]?.[resolution] ?? null;
      const usdPerImage = typeof priced === "number" ? priced : state.customUsdPerImage ?? null;
      if (typeof usdPerImage !== "number") {
        return {
          kind: "single" as const,
          model: `${model} (${quality}, ${resolution})`,
          scenarios: undefined,
          errors: ["Missing per-image pricing. Set a custom price or populate the pricing snapshot for this option."]
        };
      }
      const scenarios = perItemCostScenarios(state.imagesPerMonth, usdPerImage, multipliers);
      return { kind: "single" as const, model: `${model} (${quality}, ${resolution})`, scenarios, errors: [] };
    }

    if (state.category === "transcription_tts") {
      if (state.otherModel === "whisper") {
        const scenarios = perItemCostScenarios(state.minutesPerMonth, pricing.other.whisperTranscriptionPerMinute, multipliers);
        return { kind: "single" as const, model: "whisper", scenarios, errors: [] };
      }
      const usdPer1M = state.otherModel === "tts-hd" ? pricing.other.ttsHdPer1MCharacters : pricing.other.ttsPer1MCharacters;
      const label = state.otherModel === "tts-hd" ? "tts-hd" : "tts";
      const scenarios = per1MUnitsCostScenarios(state.charactersPerMonth, usdPer1M, multipliers);
      return { kind: "single" as const, model: label, scenarios, errors: [] };
    }

    // Token categories
    const errors: string[] = [];
    if (state.modelsSelected.length === 0) errors.push("Select at least one model.");

    const volume =
      state.mode === "token"
        ? {
            monthlyInputTokens: state.monthlyInputTokens,
            monthlyOutputTokens: state.monthlyOutputTokens,
            cachedInputPct: state.cachedInputPct
          }
        : {
            monthlyInputTokens: state.messagesPerMonth * state.avgInputTokensPerMessage,
            monthlyOutputTokens: state.messagesPerMonth * state.avgOutputTokensPerMessage,
            cachedInputPct: state.cachedInputPct
          };

    const modelEstimates: ModelEstimate[] = state.modelsSelected.map((model) => {
      const rates = getTokenRates(pricing, state.category, model);
      if (!rates) {
        return { model, pricingStatus: "missing", notes: "Missing input/output rates in the pricing snapshot." };
      }
      const scenarios = tokenCostScenarios(volume, rates, multipliers);
      return { model, pricingStatus: "ok", scenarios };
    });

    return { kind: "multi" as const, modelEstimates, errors, volume };
  }, [pricing, state]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied to clipboard.");
      window.setTimeout(() => setNotice(null), 1800);
    } catch {
      setNotice("Copy failed. Your browser may block clipboard access.");
      window.setTimeout(() => setNotice(null), 2400);
    }
  }

  function buildMarkdownSummary() {
    const multipliers = toMultipliers(state);

    const lines: string[] = [];
    lines.push(`# OpenAI API Deal Sizer`);
    lines.push(``);
    lines.push(`- Category: **${state.category}**`);
    lines.push(`- Pricing tier: **${state.pricingTier}**`);
    lines.push(`- Mode: **${state.mode}**`);
    lines.push(`- Scenarios: low=${multipliers.low} base=${multipliers.base} high=${multipliers.high}`);
    lines.push(``);

    if (estimates.kind === "single") {
      lines.push(`## Selection`);
      lines.push(`- Model: \`${estimates.model}\``);
      lines.push(``);
      if (estimates.scenarios) {
        lines.push(`## Costs (USD)`);
        lines.push(`| Scenario | Monthly | Annual |`);
        lines.push(`|---|---:|---:|`);
        (["low", "base", "high"] as const).forEach((k) => {
          lines.push(`| ${k} | ${formatUsd(estimates.scenarios![k].monthlyUsd)} | ${formatUsd(estimates.scenarios![k].annualUsd)} |`);
        });
      }
    } else {
      lines.push(`## Models`);
      lines.push(`- ${state.modelsSelected.map((m) => `\`${m}\``).join(", ") || "—"}`);
      lines.push(``);
      if (estimates.volume) {
        lines.push(`## Volume (base)`);
        lines.push(`- Input tokens/mo: ${formatNumber(estimates.volume.monthlyInputTokens)}`);
        lines.push(`- Output tokens/mo: ${formatNumber(estimates.volume.monthlyOutputTokens)}`);
        if (cachedApplicable) lines.push(`- Cached input %: ${state.cachedInputPct}%`);
        lines.push(``);
      }
      lines.push(`## Costs by model (USD)`);
      lines.push(`| Model | Monthly (base) | Annual (base) |`);
      lines.push(`|---|---:|---:|`);
      estimates.modelEstimates.forEach((m) => {
        if (!m.scenarios) {
          lines.push(`| \`${m.model}\` | — | — |`);
          return;
        }
        lines.push(
          `| \`${m.model}\` | ${formatUsd(m.scenarios.base.monthlyUsd)} | ${formatUsd(m.scenarios.base.annualUsd)} |`
        );
      });
    }

    lines.push(``);
    lines.push(`_Note: Reasoning tokens are billed as output tokens._`);
    return lines.join("\n");
  }

  const perImageOptions = useMemo(() => Object.keys(pricing.imageGeneration.models), [pricing]);
  const perImageQualities = useMemo(() => {
    return Object.keys(pricing.imageGeneration.models[state.imageModel]?.qualities ?? {});
  }, [pricing, state.imageModel]);
  const perImageResolutions = useMemo(() => {
    const q = pricing.imageGeneration.models[state.imageModel]?.qualities?.[state.imageQuality] ?? {};
    return Object.keys(q);
  }, [pricing, state.imageModel, state.imageQuality]);

  const videoModels = useMemo(() => Object.keys(pricing.video.models), [pricing]);
  const videoVariants = useMemo(() => {
    const v = pricing.video.models[state.videoModel]?.variants ?? {};
    return Object.keys(v);
  }, [pricing, state.videoModel]);

  const categoryHint = CATEGORY_OPTIONS.find((c) => c.value === state.category)?.hint ?? "";

  return (
    <Card>
      <CardHeader
        title="Calculator"
        description={categoryHint}
        right={
          <div className="flex items-center gap-2">
            {notice ? <Badge variant="neutral">{notice}</Badge> : null}
            <button
              type="button"
              className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
              onClick={() => copy(buildMarkdownSummary())}
            >
              Copy summary
            </button>
          </div>
        }
      />
      <CardBody>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Inputs */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    id="category"
                    value={state.category}
                    onChange={(e) => setState((s) => ({ ...s, category: e.target.value as QueryState["category"] }))}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pricingTier">Pricing tier</Label>
                    <Tooltip label="Matches the pricing docs query parameter: ?latest-pricing=batch|flex|standard|priority">
                      <span className="cursor-help rounded-full border border-ink-200 bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
                        ?
                      </span>
                    </Tooltip>
                  </div>
                  <Select
                    id="pricingTier"
                    value={state.pricingTier}
                    onChange={(e) => setState((s) => ({ ...s, pricingTier: e.target.value as QueryState["pricingTier"] }))}
                  >
                    {PRICING_TIER_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="mode">Mode</Label>
                  <Select
                    id="mode"
                    value={state.mode}
                    onChange={(e) => setState((s) => ({ ...s, mode: e.target.value as QueryState["mode"] }))}
                    disabled={
                      state.category === "video" ||
                      state.category === "image_per_image" ||
                      state.category === "transcription_tts"
                    }
                  >
                    {state.category === "text" || state.category === "image_tokens" || state.category === "audio_tokens" ? (
                      <>
                        <option value="message">Message-based</option>
                        <option value="token">Token-based</option>
                      </>
                    ) : null}
                    {state.category === "video" ? <option value="seconds">Seconds</option> : null}
                    {state.category === "image_per_image" ? <option value="per_image">Per image</option> : null}
                    {state.category === "transcription_tts" ? (
                      <>
                        <option value={state.otherModel === "whisper" ? "per_minute" : "per_character"}>
                          {state.otherModel === "whisper" ? "Per minute" : "Per 1M characters"}
                        </option>
                      </>
                  ) : null}
                  </Select>
                </div>
              </div>
            </div>

            {/* Category-specific inputs */}
            {state.category === "video" ? (
              <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="videoModel">Model</Label>
                    <Select
                      id="videoModel"
                      value={state.videoModel}
                      onChange={(e) => setState((s) => ({ ...s, videoModel: e.target.value }))}
                    >
                      {videoModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="videoVariant">Resolution</Label>
                    <Select
                      id="videoVariant"
                      value={state.videoVariant}
                      onChange={(e) => setState((s) => ({ ...s, videoVariant: e.target.value }))}
                    >
                      {videoVariants.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="secondsPerMonth">Seconds per month</Label>
                    <Input
                      id="secondsPerMonth"
                      type="number"
                      inputMode="numeric"
                      value={state.secondsPerMonth}
                      min={0}
                      onChange={(e) => setState((s) => ({ ...s, secondsPerMonth: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {state.category === "image_per_image" ? (
              <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="imageModel">Model</Label>
                    <Select
                      id="imageModel"
                      value={state.imageModel}
                      onChange={(e) => setState((s) => ({ ...s, imageModel: e.target.value }))}
                    >
                      {perImageOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="imageQuality">Quality</Label>
                    <Select
                      id="imageQuality"
                      value={state.imageQuality}
                      onChange={(e) => setState((s) => ({ ...s, imageQuality: e.target.value }))}
                    >
                      {perImageQualities.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="imageResolution">Resolution</Label>
                    <Select
                      id="imageResolution"
                      value={state.imageResolution}
                      onChange={(e) => setState((s) => ({ ...s, imageResolution: e.target.value }))}
                    >
                      {perImageResolutions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="imagesPerMonth">Images per month</Label>
                    <Input
                      id="imagesPerMonth"
                      type="number"
                      inputMode="numeric"
                      value={state.imagesPerMonth}
                      min={0}
                      onChange={(e) => setState((s) => ({ ...s, imagesPerMonth: Number(e.target.value) }))}
                    />
                  </div>
                  {(() => {
                    const priced =
                      pricing.imageGeneration.models[state.imageModel]?.qualities?.[state.imageQuality]?.[
                        state.imageResolution
                      ] ?? null;
                    const needsCustom = priced == null;
                    if (!needsCustom) return null;
                    return (
                      <div className="sm:col-span-2">
                        <Label htmlFor="customUsdPerImage">Custom price per image (USD)</Label>
                        <Input
                          id="customUsdPerImage"
                          type="number"
                          inputMode="decimal"
                          step="0.0001"
                          value={state.customUsdPerImage ?? ""}
                          onChange={(e) =>
                            setState((s) => ({
                              ...s,
                              customUsdPerImage: e.target.value === "" ? null : Number(e.target.value)
                            }))
                          }
                        />
                        <FieldHint>
                          This option is shown when pricing is <code className="rounded bg-ink-100 px-1 py-0.5">null</code>{" "}
                          in the pricing snapshot JSON.
                        </FieldHint>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : null}

            {state.category === "transcription_tts" ? (
              <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="otherModel">Service</Label>
                    <Select
                      id="otherModel"
                      value={state.otherModel}
                      onChange={(e) => setState((s) => ({ ...s, otherModel: e.target.value as QueryState["otherModel"] }))}
                    >
                      <option value="whisper">Whisper transcription ($/minute)</option>
                      <option value="tts">TTS ($/1M chars)</option>
                      <option value="tts-hd">TTS HD ($/1M chars)</option>
                    </Select>
                  </div>
                  {state.otherModel === "whisper" ? (
                    <div>
                      <Label htmlFor="minutesPerMonth">Minutes per month</Label>
                      <Input
                        id="minutesPerMonth"
                        type="number"
                        inputMode="numeric"
                        value={state.minutesPerMonth}
                        min={0}
                        onChange={(e) => setState((s) => ({ ...s, minutesPerMonth: Number(e.target.value) }))}
                      />
                      <FieldHint>Rate: {formatUsd(pricing.other.whisperTranscriptionPerMinute)}/min</FieldHint>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="charactersPerMonth">Characters per month</Label>
                      <Input
                        id="charactersPerMonth"
                        type="number"
                        inputMode="numeric"
                        value={state.charactersPerMonth}
                        min={0}
                        onChange={(e) => setState((s) => ({ ...s, charactersPerMonth: Number(e.target.value) }))}
                      />
                      <FieldHint>
                        Rate:{" "}
                        {formatUsd(
                          state.otherModel === "tts-hd"
                            ? pricing.other.ttsHdPer1MCharacters
                            : pricing.other.ttsPer1MCharacters
                        )}
                        /1M chars
                      </FieldHint>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {state.category === "text" || state.category === "image_tokens" || state.category === "audio_tokens" ? (
              <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Label>Models</Label>
                      <span className="text-xs text-ink-500">{state.modelsSelected.length} selected</span>
                    </div>
                    <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-ink-200 bg-white">
                      {tokenModelOptions.map((m) => {
                        const checked = state.modelsSelected.includes(m);
                        return (
                          <label
                            key={m}
                            className="flex cursor-pointer items-center gap-2 border-b border-ink-100 px-3 py-2 text-sm last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...state.modelsSelected, m]
                                  : state.modelsSelected.filter((x) => x !== m);
                                setState((s) => ({ ...s, modelsSelected: next }));
                              }}
                            />
                            <span className="font-mono text-xs text-ink-800">{m}</span>
                            {hasCachedPricing(pricing, state.category, m) ? (
                              <span className="ml-auto text-xs text-ink-500">cached</span>
                            ) : null}
                          </label>
                        );
                      })}
                    </div>
                    <FieldHint>Note: some models may have null pricing placeholders.</FieldHint>
                  </div>

                  {state.mode === "message" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label htmlFor="preset">Presets</Label>
                        <Select
                          id="preset"
                          value={state.presetId ?? ""}
                          onChange={(e) => {
                            const id = e.target.value;
                            const preset = messagePresets.find((p) => p.id === id);
                            setState((s) => ({
                              ...s,
                              presetId: id || null,
                              ...(preset
                                ? {
                                    avgInputTokensPerMessage: preset.avgInputTokensPerMessage,
                                    avgOutputTokensPerMessage: preset.avgOutputTokensPerMessage
                                  }
                                : {})
                            }));
                          }}
                        >
                          <option value="">Custom</option>
                          {messagePresets.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </Select>
                        {state.presetId ? (
                          <FieldHint>{messagePresets.find((p) => p.id === state.presetId)?.description}</FieldHint>
                        ) : null}
                      </div>

                      <div>
                        <Label htmlFor="messagesPerMonth">Messages per month</Label>
                        <Input
                          id="messagesPerMonth"
                          type="number"
                          inputMode="numeric"
                          value={state.messagesPerMonth}
                          min={0}
                          onChange={(e) => setState((s) => ({ ...s, messagesPerMonth: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="avgIn">Avg input tokens / message</Label>
                        <Input
                          id="avgIn"
                          type="number"
                          inputMode="numeric"
                          value={state.avgInputTokensPerMessage}
                          min={0}
                          onChange={(e) => setState((s) => ({ ...s, avgInputTokensPerMessage: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="avgOut">Avg output tokens / message</Label>
                        <Input
                          id="avgOut"
                          type="number"
                          inputMode="numeric"
                          value={state.avgOutputTokensPerMessage}
                          min={0}
                          onChange={(e) => setState((s) => ({ ...s, avgOutputTokensPerMessage: Number(e.target.value) }))}
                        />
                        <FieldHint>
                          Includes reasoning (billed as output). Derived tokens/mo:{" "}
                          <span className="font-medium text-ink-700">
                            {formatCompact(state.messagesPerMonth * (state.avgInputTokensPerMessage + state.avgOutputTokensPerMessage))}
                          </span>
                        </FieldHint>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="inTokens">Monthly input tokens</Label>
                        <Input
                          id="inTokens"
                          type="number"
                          inputMode="numeric"
                          value={state.monthlyInputTokens}
                          min={0}
                          onChange={(e) => setState((s) => ({ ...s, monthlyInputTokens: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="outTokens">Monthly output tokens</Label>
                        <Input
                          id="outTokens"
                          type="number"
                          inputMode="numeric"
                          value={state.monthlyOutputTokens}
                          min={0}
                          onChange={(e) => setState((s) => ({ ...s, monthlyOutputTokens: Number(e.target.value) }))}
                        />
                        <FieldHint>Output includes reasoning tokens.</FieldHint>
                      </div>
                    </div>
                  )}

                  {cachedApplicable ? (
                    <div className="rounded-2xl border border-ink-200/70 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label>Cached input %</Label>
                          <Tooltip label="Only applies to models with cached input pricing. Cached tokens are billed at the cached input rate.">
                            <span className="cursor-help rounded-full border border-ink-200 bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
                              ?
                            </span>
                          </Tooltip>
                        </div>
                        <span className="text-xs text-ink-500">0–90%</span>
                      </div>
                      <div className="mt-2">
                        <Slider
                          value={state.cachedInputPct}
                          min={0}
                          max={90}
                          step={1}
                          onChange={(v) => setState((s) => ({ ...s, cachedInputPct: v }))}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Scenarios */}
            <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
              <div className="flex items-center gap-2">
                <Label>Scenario multipliers</Label>
                <Tooltip label="Applied to volume. Use low/base/high to communicate uncertainty and seasonality.">
                  <span className="cursor-help rounded-full border border-ink-200 bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
                    ?
                  </span>
                </Tooltip>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="lowMul" className="text-xs">
                    Low
                  </Label>
                  <Input
                    id="lowMul"
                    type="number"
                    inputMode="decimal"
                    step="0.05"
                    min={0.05}
                    value={state.lowMultiplier}
                    onChange={(e) => setState((s) => ({ ...s, lowMultiplier: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="baseMul" className="text-xs">
                    Base
                  </Label>
                  <Input
                    id="baseMul"
                    type="number"
                    inputMode="decimal"
                    step="0.05"
                    min={0.05}
                    value={state.baseMultiplier}
                    onChange={(e) => setState((s) => ({ ...s, baseMultiplier: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="highMul" className="text-xs">
                    High
                  </Label>
                  <Input
                    id="highMul"
                    type="number"
                    inputMode="decimal"
                    step="0.05"
                    min={0.05}
                    value={state.highMultiplier}
                    onChange={(e) => setState((s) => ({ ...s, highMultiplier: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink-900">Results</h3>
                  <p className="mt-1 text-xs text-ink-600">Monthly + annual costs for low/base/high scenarios.</p>
                </div>
              </div>

              {estimates.errors.length ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {estimates.errors.join(" ")}
                </div>
              ) : null}

              {estimates.kind === "single" ? (
                <div className="mt-4">
                  <div className="text-sm text-ink-700">
                    <span className="font-mono text-xs text-ink-800">{estimates.model}</span>
                  </div>
                  {estimates.scenarios ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {(["low", "base", "high"] as const).map((k) => (
                        <div key={k} className="rounded-2xl border border-ink-200 bg-white p-3">
                          <div className="text-xs font-medium text-ink-600">{k.toUpperCase()}</div>
                          <div className="mt-1 text-lg font-semibold text-ink-900">
                            {formatUsd(estimates.scenarios![k].monthlyUsd)}
                          </div>
                          <div className="text-xs text-ink-600">{formatUsd(estimates.scenarios![k].annualUsd)} / yr</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      {estimates.errors.join(" ")}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <div className="overflow-x-auto rounded-2xl border border-ink-200 bg-white">
                    <table className="w-full text-sm">
                      <thead className="bg-ink-50 text-xs text-ink-600">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Model</th>
                          <th className="px-3 py-2 text-right font-medium">Monthly (base)</th>
                          <th className="px-3 py-2 text-right font-medium">Annual (base)</th>
                          <th className="px-3 py-2 text-right font-medium">
                            <Tooltip label="Blended cost per 1M total tokens (input + output) for the base scenario.">
                              <span className="underline decoration-dotted underline-offset-2">$/1M blended</span>
                            </Tooltip>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimates.modelEstimates.map((m) => {
                          const ok = m.pricingStatus === "ok" && m.scenarios;
                          return (
                            <tr key={m.model} className="border-t border-ink-100">
                              <td className="px-3 py-2 font-mono text-xs text-ink-800">{m.model}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{ok ? formatUsd(m.scenarios!.base.monthlyUsd) : "—"}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{ok ? formatUsd(m.scenarios!.base.annualUsd) : "—"}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {ok && typeof m.scenarios!.base.effectiveBlendedUsdPer1M === "number"
                                  ? formatUsd(m.scenarios!.base.effectiveBlendedUsdPer1M)
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 rounded-2xl border border-ink-200/70 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-ink-600">Base volume</div>
                      <div className="text-xs font-medium text-ink-800">
                        {estimates.volume ? (
                          <>
                            {formatCompact(estimates.volume.monthlyInputTokens)} in + {formatCompact(estimates.volume.monthlyOutputTokens)} out{" "}
                            {cachedApplicable ? <span className="text-ink-500">({state.cachedInputPct}% cached)</span> : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scenario detail table for multi */}
            {estimates.kind === "multi" ? (
              <div className="rounded-2xl border border-ink-200/70 bg-white/60 p-4">
                <h3 className="text-sm font-semibold text-ink-900">Scenario bands</h3>
                <p className="mt-1 text-xs text-ink-600">Low/Base/High monthly + annual per model.</p>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-ink-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-xs text-ink-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Model</th>
                        <th className="px-3 py-2 text-right font-medium">Low / mo</th>
                        <th className="px-3 py-2 text-right font-medium">Base / mo</th>
                        <th className="px-3 py-2 text-right font-medium">High / mo</th>
                        <th className="px-3 py-2 text-right font-medium">Base / yr</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimates.modelEstimates.map((m) => {
                        const s = m.scenarios;
                        return (
                          <tr key={m.model} className="border-t border-ink-100">
                            <td className="px-3 py-2 font-mono text-xs text-ink-800">{m.model}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{s ? formatUsd(s.low.monthlyUsd) : "—"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{s ? formatUsd(s.base.monthlyUsd) : "—"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{s ? formatUsd(s.high.monthlyUsd) : "—"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{s ? formatUsd(s.base.annualUsd) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

          </section>
        </div>
      </CardBody>
    </Card>
  );
}
