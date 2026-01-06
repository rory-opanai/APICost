"use client";

import { useId } from "react";

import { cx } from "@/components/ui/cx";

export function Tooltip({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <span className={cx("group relative inline-flex items-center", className)}>
      <span tabIndex={0} aria-describedby={id} className="outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className={cx(
          "pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-72 -translate-x-1/2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs text-ink-700 shadow-card",
          "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        )}
      >
        {label}
      </span>
    </span>
  );
}

