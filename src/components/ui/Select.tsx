import { cx } from "@/components/ui/cx";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <select
      {...props}
      className={cx(
        "h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-sky-300",
        className
      )}
    />
  );
}

