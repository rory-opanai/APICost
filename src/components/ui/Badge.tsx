import { cx } from "@/components/ui/cx";

export function Badge({
  children,
  variant = "neutral"
}: {
  children: React.ReactNode;
  variant?: "neutral" | "good" | "warn";
}) {
  const styles =
    variant === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : variant === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-ink-200 bg-ink-100 text-ink-800";

  return (
    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", styles)}>
      {children}
    </span>
  );
}

