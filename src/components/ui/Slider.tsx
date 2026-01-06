"use client";

import { cx } from "@/components/ui/cx";

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  disabled,
  label
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className={cx(disabled && "opacity-60")}>
      {label ? <div className="mb-1 text-xs font-medium text-ink-700">{label}</div> : null}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step ?? 1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cx("h-2 w-full cursor-pointer accent-sky-500", disabled && "cursor-not-allowed")}
        />
        <div className="w-16 text-right text-sm tabular-nums text-ink-800">{value}</div>
      </div>
    </div>
  );
}

